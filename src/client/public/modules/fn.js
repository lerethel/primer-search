import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/+esm";

import * as cE from "./const-elem.js";
import * as css from "./css-attr.js";
import * as not from "./notification.js";

////////////////
/// TOASTIFY ///

const toastDefaults = {
  gravity: "bottom",
  position: "right",
  duration: 15000,
  close: true,
};

function showToast(options, condition = true) {
  if (condition) {
    Toastify({ ...options, ...toastDefaults }).showToast();
  }
}

export function info(text, condition) {
  showToast({ text }, condition);
}

export function success(text, condition) {
  showToast({ text, className: "success-toast" }, condition);
}

export function error(text, condition = true) {
  showToast({ text, className: "error-toast" }, condition);

  if (condition) {
    throw new Error(text);
  }
}

//////////////
/// SERVER ///

export class SingletonRequest {
  #controller;

  constructor(url) {
    this.url = url;
  }

  async send(params, options) {
    if (this.#controller) {
      this.#controller.abort();
    }

    this.#controller = new AbortController();

    try {
      const query = params ? new URLSearchParams(params).toString() : "";
      return await fetch(this.url + (query ? `?${query}` : ""), {
        ...options,
        signal: this.#controller.signal,
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        error(not.eNetworkError);
      }

      throw e;
    } finally {
      this.#controller = undefined;
    }
  }
}

/////////////
/// OTHER ///

const rexonHeader = /^\s*>.+?$/m;
const rwhitespace = /\s+/g;

export function joinExons(fastaSeq) {
  fastaSeq = fastaSeq.trim();

  if (!fastaSeq) {
    return;
  }

  if (!rexonHeader.test(fastaSeq)) {
    info(not.iExonsNotSeparated);
    cE.seq.textContent = fastaSeq;
    return;
  }

  const fragment = new DocumentFragment();

  fastaSeq.split(rexonHeader).forEach((exon) => {
    exon = exon.replace(rwhitespace, "");

    if (!exon) {
      return;
    }

    const exonElement = document.createElement("span");

    exonElement.classList.add(css.exonClass);
    exonElement.textContent = exon;
    fragment.append(exonElement);
  });

  cE.seq.replaceChildren(fragment);
}

const rnucleobases = /[ATGC]/g;
const basePairs = {
  A: "T",
  G: "C",
  T: "A",
  C: "G",
};

export function reverseComplement(primerSeq) {
  return primerSeq
    .split("")
    .reverse()
    .join("")
    .replace(rnucleobases, (base) => basePairs[base]);
}

export function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}
