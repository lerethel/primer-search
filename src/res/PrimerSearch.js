import * as cE from "./modules/const-elem.js";
import * as css from "./modules/css-attr.js";
import * as fn from "./modules/fn.js";
import * as not from "./modules/notification.js";
import * as pair from "./modules/pair.js";

////////////////
/// SEQUENCE ///

cE.convertBtn.addEventListener(
  "click",
  () => {
    if (cE.seq.innerHTML.includes(`<span class="${css.exonClass}">`)) {
      fn.info(not.iSequenceAlreadyConverted);
      return;
    }

    concatenateExons(cE.seq.innerText);
  },
  false
);

cE.seq.addEventListener(
  "paste",
  (event) => {
    cE.geneName.value = "";

    if (cE.convertOnPaste.checked) {
      event.preventDefault();
      concatenateExons(event.clipboardData.getData("text"));
    }
  },
  false
);

const rremoveHeaders = /^>.+?$/gm;
const rremoveWhitespaces = /\s+/g;

function concatenateExons(text) {
  text = text.trim();

  if (!text) {
    return;
  }

  let currentExon = 0;

  cE.seq.innerHTML =
    text.replace(rremoveHeaders, () => {
      let result = "";

      if (currentExon > 0) {
        result += "</span>";
      }

      result += `<span class="${css.exonClass}">`;
      currentExon++;

      return result;
    }) + (currentExon ? "</span>" : "");

  // Remove line breaks and possible spaces between nucleotide bases.
  const treeWalker = document.createTreeWalker(cE.seq, NodeFilter.SHOW_TEXT);
  while (treeWalker.nextNode()) {
    treeWalker.currentNode.textContent =
      treeWalker.currentNode.textContent.replace(rremoveWhitespaces, "");
  }

  // If currentExon is 0, then no exon title has been found and exons cannot be given varying colors.
  if (!currentExon) {
    fn.info(not.iExonsNotSeparated);
  }
}

///////////////////
/// PRIMER PAIR ///

// Add the first primer pair.
pair.appendPrimerPair();

cE.addPrimerPairBtn.addEventListener("click", pair.appendPrimerPair, false);

for (const eventType of ["paste", "click", "keyup"]) {
  cE.primerPairList.addEventListener(eventType, pair.handleEvent, false);
}
