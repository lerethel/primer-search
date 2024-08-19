import * as cE from "./const-elem.js";
import * as css from "./css-attr.js";
import * as fn from "./fn.js";
import * as not from "./notification.js";

/////////////////////////////////////
/// METHODS FOR OPERATING THE DOM ///

let primerPairNumber = 0;
const rproductLength = /\{pl\}|\d+/;

function createPrimerPair() {
  return cE.primerPairTemplate.content.cloneNode(true).children[0];
}

export function appendPrimerPair(forward, reverse, productLength) {
  const primerPair = createPrimerPair();

  if (forward && reverse) {
    const [forwardElement, reverseElement] = primerPair.getElementsByClassName(
      css.primerClass
    );
    forwardElement.value = forward;
    reverseElement.value = reverse;
  }

  if (productLength) {
    showProductLength(primerPair, productLength);
  }

  cE.primerPairList.append(primerPair);
  primerPairNumber++;

  if (primerPairNumber > 1) {
    showRemovePrimerPairBtn();
  }
}

export function removePrimerPair(primerPair, keepLast) {
  primerPair.remove();
  primerPairNumber--;
  fn.unmark({ pair: primerPair });

  if (keepLast && !primerPairNumber) {
    appendPrimerPair();
    hideRemovePrimerPairBtn();
  }
}

export function removeAllPrimerPairs(keepLast) {
  const primerPairs = cE.primerPairList.getElementsByClassName(
    css.primerPairClass
  );
  let i = primerPairs.length;

  while (i--) {
    removePrimerPair(primerPairs[i], keepLast);
  }
}

export function showRemovePrimerPairBtn() {
  cE.primerPairList.classList.add(css.removeBtnShownClass);
}

export function hideRemovePrimerPairBtn() {
  cE.primerPairList.classList.remove(css.removeBtnShownClass);
}

export function showProductLength(primerPair, productLength) {
  const productLengthElement = primerPair.getElementsByClassName(
    css.productLengthClass
  )[0];

  productLengthElement.textContent = productLengthElement.textContent.replace(
    rproductLength,
    productLength
  );

  productLengthElement.classList.add(css.shownProductLengthClass);
}

export function hideProductLength(primerPair) {
  primerPair
    .getElementsByClassName(css.productLengthClass)[0]
    .classList.remove(css.shownProductLengthClass);
}

///////////////////////////////////
/// METHODS FOR HANDLING EVENTS ///

export function handleEvent(event) {
  const primerPair = event.target.closest("." + css.primerPairClass);

  if (!primerPair) {
    return;
  }

  const [forwardElement, reverseElement] = primerPair.getElementsByClassName(
    css.primerClass
  );

  forwardElement.value = forwardElement.value.trim();
  reverseElement.value = reverseElement.value.trim();

  const primer = {
    forward: forwardElement,
    reverse: reverseElement,
    pair: primerPair,
    target: event.target,
  };

  eventMap[event.type].forEach((callback) => {
    callback(primer, event);
  });
}

const eventMap = {
  paste: [],
  click: [],
  keyup: [],
};

eventMap.paste.push((primer, event) => {
  if (!isTargetPrimer(primer)) {
    return;
  }

  event.preventDefault();
  const clipboardText = event.clipboardData.getData("text").trim();

  if (clipboardText.indexOf("<Copied for PrimerSearch>") === 0) {
    // Paste primers copied by the userscript for Primer-BLAST.
    const parsedJSON = JSON.parse(
      clipboardText.replace("<Copied for PrimerSearch>", "")
    );

    if (parsedJSON.length) {
      removeAllPrimerPairs();
      parsedJSON.forEach((jsonPair) => {
        appendPrimerPair(jsonPair.forward, jsonPair.reverse, jsonPair.length);
      });
    } else {
      fn.info(not.iCopiedListEmpty);
    }
  } else {
    event.target.value = clipboardText;

    if (primer.forward.value || primer.reverse.value) {
      // Mark a primer pair in the gene sequence after it's pasted.
      // The condition checks the presence of only one of the primers
      // because the paste event is fired before the input field is updated.
      primer.pair
        .getElementsByClassName(css.markPrimerPairBtnClass)[0]
        .dispatchEvent(
          new Event("click", {
            bubbles: true,
          })
        );
    }
  }
});

// Mark a primer pair in the gene sequence; calculate
// and show the product length of the primer pair.
eventMap.click.push((primer) => {
  if (!isClickValid(primer, css.markPrimerPairBtnClass)) {
    return;
  }

  const seqText = cE.seq.textContent;
  const forwardValue = primer.forward.value;
  const reverseValue = primer.reverse.value;
  const forwardIndex = seqText.indexOf(forwardValue);
  const reverseIndex = seqText.indexOf(fn.reverseComplement(reverseValue));

  // Unmark everything now in case of errors.
  fn.unmark();

  const primerWarning = new fn.WarningQueue();

  // Check that the primers are in the sequence.
  primerWarning.append(forwardIndex < 0, not.wForwardPrimerNotFound);
  primerWarning.append(reverseIndex < 0, not.wReversePrimerNotFound);

  if (primerWarning.passed) {
    // Check that the reverse primer follows the forward primer.
    primerWarning.append(
      forwardIndex > reverseIndex,
      not.wReversePrecedesForward
    );

    // Check that the primers don't overlap.
    primerWarning.append(
      forwardIndex + forwardValue.length > reverseIndex,
      not.wPrimersOverlap
    );

    // Check that the primers occur only once in the sequence.
    primerWarning.append(
      seqText.includes(forwardValue, forwardIndex + forwardValue.length),
      not.wForwardOccursMoreThanOnce
    );
    primerWarning.append(
      seqText.includes(reverseValue, reverseIndex + reverseValue.length),
      not.wReverseOccursMoreThanOnce
    );
  }

  primerWarning.run(() => {
    fn.mark(primer);

    const product = seqText.substring(
      forwardIndex,
      reverseIndex + reverseValue.length
    );

    showProductLength(primer.pair, product.length);

    primer.forward.dataset.cachedValue = forwardValue;
    primer.reverse.dataset.cachedValue = reverseValue;
  });
});

// Copy information about a primer pair to the clipboard.
eventMap.click.push((primer) => {
  if (!isClickValid(primer, css.copyPairInfoBtnClass)) {
    return;
  }

  const geneName = cE.geneName.value.trim();
  const productLengthElement = primer.pair.getElementsByClassName(
    css.productLengthClass
  )[0];
  const pairInfoWarning = new fn.WarningQueue();

  pairInfoWarning.append(!geneName, not.wNoGeneName);
  pairInfoWarning.append(
    !productLengthElement.classList.contains(css.shownProductLengthClass),
    not.wNoProductLength
  );

  pairInfoWarning.run(() => {
    navigator.clipboard.writeText(
      `${geneName} (F): ${primer.forward.value}\n${geneName} ` +
        `(R): ${primer.reverse.value}\n${productLengthElement.textContent}`
    );
    fn.info(not.iPrimerPairInfoCopied);
  });
});

eventMap.click.push((primer, event) => {
  // Remove a primer pair when the corresponding button is clicked.
  if (event.target.classList.contains(css.removePrimerPairBtnClass)) {
    removePrimerPair(primer.pair, true);
  }
});

// Hide the product length of a primer pair when any of the primers
// are modified. If the primer pair is marked in the sequence, unmark it.
eventMap.keyup.push((primer, event) => {
  if (!isTargetPrimer(primer)) {
    return;
  }

  const {
    target: { value, dataset },
  } = event;

  if (value) {
    showRemovePrimerPairBtn();
  }

  if (dataset.cachedValue && dataset.cachedValue !== value) {
    hideProductLength(primer.pair);
    fn.unmark(primer);
    dataset.cachedValue = value;
  }
});

function isClickValid(primer, className) {
  return (
    cE.seq.textContent &&
    primer.forward.value &&
    primer.reverse.value &&
    primer.target.closest("." + className)
  );
}

function isTargetPrimer(primer) {
  return primer.target === primer.forward || primer.target === primer.reverse;
}
