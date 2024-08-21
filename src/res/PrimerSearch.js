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
    if (cE.seq.getElementsByClassName(css.exonClass).length) {
      fn.info(not.iSequenceAlreadyConverted);
      return;
    }

    fn.joinExons(cE.seq.innerText);
  },
  false
);

cE.seq.addEventListener(
  "paste",
  (event) => {
    cE.geneName.value = "";

    if (cE.convertOnPaste.checked) {
      event.preventDefault();
      fn.joinExons(event.clipboardData.getData("text"));
    }
  },
  false
);

///////////////////
/// PRIMER PAIR ///

// Add the first primer pair.
pair.appendPrimerPair();

cE.addPrimerPairBtn.addEventListener("click", pair.appendPrimerPair, false);

for (const eventType of ["paste", "click", "keyup"]) {
  cE.primerPairList.addEventListener(eventType, pair.handleEvent, false);
}
