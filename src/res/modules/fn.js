import Mark from "https://cdn.jsdelivr.net/npm/mark.js@8.11.1/+esm";
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/+esm";

import * as cE from "./const-elem.js";
import * as css from "./css-attr.js";

////////////
/// MARK ///

let markedPrimerPair;

const markInstance = new Mark(cE.seq);

export function mark(primer) {
  primer.pair.classList.add(css.markedPrimerPairClass);

  markInstance.mark(primer.forward.value, {
    acrossElements: true,
    className: css.forwardMarkClass,
  });

  markInstance.mark(reverseComplement(primer.reverse.value), {
    acrossElements: true,
    className: css.reverseMarkClass,
  });

  markedPrimerPair = primer.pair;

  cE.seq.getElementsByTagName("mark")[0].scrollIntoView({
    behavior: "smooth",
  });
}

export function unmark(primer) {
  if (!markedPrimerPair) {
    return;
  }

  if (primer && primer.pair !== markedPrimerPair) {
    return;
  }

  markInstance.unmark();
  markedPrimerPair.classList.remove(css.markedPrimerPairClass);
  markedPrimerPair = undefined;
}

////////////////
/// TOASTIFY ///

const defaultToastOptions = {
  gravity: "bottom",
  position: "right",
  duration: 10000,
};

function toastMessage(extraOptions) {
  Toastify({ ...extraOptions, ...defaultToastOptions }).showToast();
}

export function info(text) {
  toastMessage({
    text: text,
  });
}

export function warning(text) {
  toastMessage({
    text: text,
    style: {
      background:
        "linear-gradient(to right, rgb(255, 95, 109), rgb(255, 150, 113))",
    },
  });
}

export class WarningQueue {
  passed = true;
  #queue = [];

  append(condition, message) {
    if (condition) {
      this.#queue.push(message);
      this.passed = false;
    }
  }

  run(fn) {
    this.passed ? fn() : this.#show();
  }

  #show() {
    for (const message of this.#queue) {
      warning(message);
    }
  }
}

/////////////
/// OTHER ///

const racidBases = /[ATGC]/g;
const compementaryPairs = {
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
    .replace(racidBases, (base) => compementaryPairs[base]);
}
