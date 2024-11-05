import { hash } from "crypto";
import { URL } from "url";
import {
  blastURL,
  buildBLASTForm,
  isJobActive,
  parserBySelector,
  responseToDOM,
  selectorAlias,
} from "../utils/blast.js";
import * as db from "../utils/db.js";

export const initSearch = async (req, res) => {
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

  if (
    select &&
    (select.data || (await isJobActive(req, res, select.job_key)))
  ) {
    return res.json({ job_key: select.job_key });
  }

  const response = await fetch(blastURL, {
    method: "POST",
    body: buildBLASTForm(options),
  });

  const retryURL = response.headers.get("x-ncbi-retry-url");

  if (!retryURL) {
    const { status, data } = parserBySelector.get(selectorAlias.error)(
      (await responseToDOM(response)).querySelector(selectorAlias.error)
    );
    return res.status(status).json(data);
  }

  const jobKey = URL.parse(retryURL).searchParams.get("job_key");

  res.json({ job_key: jobKey });
  select
    ? db.run("UPDATE primer SET job_key = ? WHERE id = ?;", [jobKey, id])
    : db.run("INSERT INTO primer (id, job_key) VALUES (?, ?);", [id, jobKey]);
};

export const getPrimers = async (req, res) => {
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

    const { status, valid, data } = parser(element);

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
};
