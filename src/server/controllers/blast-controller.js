import { parse as parseHTML } from "node-html-parser";
import { URL } from "url";
import blastDefaults from "../config/blast-defaults.js";

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

// Some error pages on Primer-BLAST seem to have an empty #alignments element.
// Use a Map to control the order in which the selectors are run.
const senderBySelector = new Map();

senderBySelector.set(".error, .info", (req, res, element) => {
  const message = element?.textContent;
  res.status(404).json({
    message: message
      ? blastPrefix + cleanMessage(message)
      : "Unknown error occurred.",
  });
});

senderBySelector.set("#statInfo", (req, res, element) => {
  const statusMessage = element.getElementsByTagName("td")[1].textContent;
  res.status(202).json({
    message: blastPrefix + cleanMessage(statusMessage),
  });
});

senderBySelector.set("#userGuidedForm", (req, res) => {
  const jobURL = `${blastURL}?job_key=${req.query.job_key}`;
  res.status(202).json({
    message:
      "Primer-BLAST needs user guidance. Follow " +
      "the link below to resolve the issue. You can " +
      `return to this page after submitting the form.\n\n${jobURL}`,
  });
});

senderBySelector.set("#alignments", (req, res, element) => {
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

  res.status(200).json(primerInfo);
});

export async function initSearch(req, res) {
  const { sequence, species, onSpliceSite, maxProductLength } = req.body;
  const response = await fetch(blastURL, {
    method: "POST",
    body: buildBLASTForm({
      INPUT_SEQUENCE: sequence,
      ORGANISM: species,
      PRIMER_ON_SPLICE_SITE: onSpliceSite,
      PRIMER_PRODUCT_MAX: maxProductLength,
    }),
  });

  const retryURL = response.headers.get("x-ncbi-retry-url");

  if (!retryURL) {
    const document = await responseToDOM(response);
    return senderBySelector.get(".error, .info")(
      req,
      res,
      document.querySelector(".error, .info")
    );
  }

  res.json({ job_key: URL.parse(retryURL).searchParams.get("job_key") });
}

export async function getPrimers(req, res) {
  const response = await fetch(`${blastURL}?job_key=${req.query.job_key}`);
  const document = await responseToDOM(response);

  for (const [selector, sender] of senderBySelector) {
    const element = document.querySelector(selector);
    if (element) {
      return sender(req, res, element);
    }
  }
}
