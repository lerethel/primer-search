import { parse as parseHTML } from "node-html-parser";
import blastDefaults from "../config/blast-defaults.js";

export const buildBLASTForm = (options) => {
  const form = new FormData();
  const totalOptions = { ...blastDefaults, ...options };

  for (const entryName in totalOptions) {
    form.set(entryName, totalOptions[entryName]);
  }

  return form;
};

const rnewLine = /[\r\n]/g;
export const cleanMessage = (message) => message.trim().replace(rnewLine, "");

export const responseToDOM = async (response) =>
  parseHTML(await response.text());

export const blastURL =
  "https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi";

export const selectorAlias = {
  status: "#statInfo",
  primer: "#alignments",
  error: ".error, .info",
  default: "html",
};

export const isJobActive = async (req, res, jobKey) => {
  const response = await fetch(`${blastURL}?job_key=${jobKey}`);
  const document = await responseToDOM(response);

  for (const selector of [selectorAlias.status, selectorAlias.primer]) {
    const element = document.querySelector(selector);

    if (element) {
      const { valid, status } = parserBySelector.get(selector)(
        req,
        res,
        element
      );
      return valid && status < 400;
    }
  }

  return false;
};

const rerrorStatus = /Failed|Canceled/;
const rprimerField = /^(?:(?:forward|reverse) primer|product length)$/i;
const blastPrefix = "Primer-BLAST: ";

// The selectors aren't mutually exclusive.
// Use a Map to control the order in which they are run, along with a validity check.
export const parserBySelector = new Map();

parserBySelector.set(selectorAlias.status, (req, res, element) => {
  const messageElement = element.getElementsByTagName("td")[1];
  // Remove links since they serve as buttons here and aren't related to the text.
  messageElement.getElementsByTagName("a").forEach((link) => link.remove());
  const message = messageElement.textContent;

  return rerrorStatus.test(message)
    ? parserBySelector.get(selectorAlias.error)(req, res, messageElement)
    : {
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
