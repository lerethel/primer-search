import { hash } from "crypto";
import { parse as parseHTML } from "node-html-parser";
import { URL } from "url";
import blastDefaults from "../config/blast-defaults.js";
import * as db from "../utils/db.js";

function buildBLASTForm(options) {
  const form = new FormData();
  const totalOptions = { ...blastDefaults, ...options };

  for (const entryName in totalOptions) {
    form.set(entryName, totalOptions[entryName]);
  }

  return form;
}

const rnewLine = /[\r\n]/g;

function cleanMessage(message) {
  return message.trim().replace(rnewLine, "");
}

async function responseToDOM(response) {
  return parseHTML(await response.text());
}

const blastURL =
  "https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi";
const rprimerField = /^(?:(?:forward|reverse) primer|product length)$/i;
const blastPrefix = "Primer-BLAST: ";

const selectorAlias = {
  status: "#statInfo",
  primer: "#alignments",
  error: ".error, .info",
  default: "html",
};

// The selectors aren't mutually exclusive.
// Use a Map to control the order in which they are run, along with a validity check.
const parserBySelector = new Map();

parserBySelector.set(selectorAlias.status, (req, res, element) => {
  // Remove links since they serve as buttons here and aren't related to the text.
  element.getElementsByTagName("a").forEach((link) => link.remove());
  const message = element.getElementsByTagName("td")[1].textContent;

  return {
    status: 202,
    valid: message.length > 0,
    data: { message: blastPrefix + cleanMessage(message) },
  };
});

parserBySelector.set(selectorAlias.primer, (req, res, element) => {
  const entries = element
    .getElementsByTagName("th")
    .filter((th) => rprimerField.test(th.textContent));
  const getPrimerProperty = (index) =>
    entries[index].nextElementSibling.textContent;
  const primerInfo = [];

  for (let i = 0; i < entries.length; ) {
    primerInfo.push({
      forward: getPrimerProperty(i++),
      reverse: getPrimerProperty(i++),
      length: getPrimerProperty(i++),
    });
  }

  return { status: 200, valid: primerInfo.length > 0, data: primerInfo };
});

parserBySelector.set(selectorAlias.error, (req, res, element) => {
  const message = element.textContent;

  return {
    status: 404,
    valid: message.length > 0,
    data: { message: blastPrefix + cleanMessage(message) },
  };
});

// The default option, which should always be at the end,
// be valid, and include an element that is always in the HTML page.
parserBySelector.set(selectorAlias.default, () => {
  return {
    status: 404,
    valid: true,
    data: { message: "Unknown error occurred." },
  };
});

export async function initSearch(req, res) {
  const { sequence, species, onSpliceSite, maxProductLength } = req.body;

  const options = {
    INPUT_SEQUENCE: sequence,
    ORGANISM: species,
    PRIMER_ON_SPLICE_SITE: onSpliceSite,
    PRIMER_PRODUCT_MAX: maxProductLength,
    SEARCHMODE: "2",
  };

  const id = hash("sha1", JSON.stringify(options));
  const select = await db.get("SELECT * FROM primer WHERE id = ?;", [id]);

  if (select) {
    const hoursPassed = (Date.now() - select.job_timestamp) / 1000 / 60 / 60;
    if (hoursPassed <= 12 || select.data) {
      return res.json({ job_key: select.job_key });
    }
  }

  const response = await fetch(blastURL, {
    method: "POST",
    body: buildBLASTForm(options),
  });

  const retryURL = response.headers.get("x-ncbi-retry-url");

  if (!retryURL) {
    const { status, data } = parserBySelector.get(selectorAlias.error)(
      req,
      res,
      (await responseToDOM(response)).querySelector(selectorAlias.error)
    );
    return res.status(status).json(data);
  }

  const jobKey = URL.parse(retryURL).searchParams.get("job_key");

  res.json({ job_key: jobKey });
  select
    ? db.run("UPDATE primer SET job_key = ?, job_timestamp = ? WHERE id = ?;", [
        jobKey,
        Date.now(),
        id,
      ])
    : db.run(
        "INSERT INTO primer (id, job_key, job_timestamp) VALUES (?, ?, ?);",
        [id, jobKey, Date.now()]
      );
}

export async function getPrimers(req, res) {
  const jobKey = req.query.job_key;
  const select = await db.get("SELECT data FROM primer WHERE job_key = ?;", [
    jobKey,
  ]);

  if (select?.data) {
    return res.json(JSON.parse(select.data));
  }

  const response = await fetch(`${blastURL}?job_key=${jobKey}`);
  const document = await responseToDOM(response);

  for (const [selector, parser] of parserBySelector) {
    const element = document.querySelector(selector);

    if (!element) {
      continue;
    }

    const { status, valid, data } = parser(req, res, element);

    if (!valid) {
      continue;
    }

    if (selector === selectorAlias.primer) {
      db.run("UPDATE primer SET data = ? WHERE job_key = ?;", [
        JSON.stringify(data),
        jobKey,
      ]);
    }

    return res.status(status).json(data);
  }
}
