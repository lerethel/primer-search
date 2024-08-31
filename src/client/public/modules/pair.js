import * as cE from "./const-elem.js";
import * as css from "./css-attr.js";
import * as fn from "./fn.js";
import * as not from "./notification.js";

/////////////////////////////////////
/// METHODS FOR OPERATING THE DOM ///

const rproductLength = /\{pl\}|\d+/;

function createPrimerPair() {
  const primerPair = cE.primerPairTemplate.content.cloneNode(true).children[0];

  primerPair.getElementsByClassName(css.removePrimerPairBtnClass)[0].title =
    not.tRemovePrimerPair;

  primerPair.getElementsByClassName(css.markPrimerPairBtnClass)[0].title =
    not.tMarkPrimerPair;

  primerPair.getElementsByClassName(css.copyPairInfoBtnClass)[0].title =
    not.tCopyPairInfo;

  return primerPair;
}

function getPrimerElements(primerPair) {
  return primerPair.getElementsByClassName(css.primerClass);
}

export function appendPrimerPair(forward, reverse, productLength) {
  const primerPair = createPrimerPair();

  if (forward && reverse) {
    const [forwardElement, reverseElement] = getPrimerElements(primerPair);
    forwardElement.value = forward;
    reverseElement.value = reverse;
  }

  if (productLength) {
    showProductLength(primerPair, productLength);
  }

  cE.primerPairList.append(primerPair);

  if (cE.primerPairList.childElementCount > 1) {
    showRemovePrimerPairBtn();
  }
}

export function removePrimerPair(primerPair, keepLast = false) {
  primerPair.remove();
  fn.unmark({ pair: primerPair });

  if (keepLast && !cE.primerPairList.childElementCount) {
    appendPrimerPair();
    hideRemovePrimerPairBtn();
  }
}

export function removeAllPrimerPairs() {
  while (cE.primerPairList.childElementCount) {
    removePrimerPair(cE.primerPairList.lastElementChild);
  }
}

export function populateFromJSON(json) {
  removeAllPrimerPairs();
  json.forEach((jsonPair) => {
    appendPrimerPair(jsonPair.forward, jsonPair.reverse, jsonPair.length);
  });
}

export function showRemovePrimerPairBtn() {
  cE.primerPairList.classList.add(css.removeBtnShownClass);
}

export function hideRemovePrimerPairBtn() {
  cE.primerPairList.classList.remove(css.removeBtnShownClass);
}

function getProductLengthElement(primerPair) {
  return primerPair.getElementsByClassName(css.productLengthClass)[0];
}

export function showProductLength(primerPair, productLength) {
  const productLengthElement = getProductLengthElement(primerPair);

  productLengthElement.textContent = productLengthElement.textContent.replace(
    rproductLength,
    productLength
  );

  productLengthElement.classList.add(css.shownProductLengthClass);
}

export function hideProductLength(primerPair) {
  getProductLengthElement(primerPair).classList.remove(
    css.shownProductLengthClass
  );
}

///////////////////////////////////
/// METHODS FOR HANDLING EVENTS ///

export function handleEvent(event) {
  const primerPair = event.target.closest("." + css.primerPairClass);

  if (!primerPair) {
    return;
  }

  const [forwardElement, reverseElement] = getPrimerElements(primerPair);

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

    parsedJSON.length
      ? populateFromJSON(parsedJSON)
      : fn.error(not.eCopiedListEmpty);
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
  const reversedReverseValue = fn.reverseComplement(reverseValue);
  const forwardIndex = seqText.indexOf(forwardValue);
  const reverseIndex = seqText.indexOf(reversedReverseValue);

  // Unmark everything now in case of errors.
  fn.unmark();

  // Check that the primers are in the sequence.
  fn.error(not.eForwardPrimerNotFound, forwardIndex < 0);
  fn.error(not.eReversePrimerNotFound, reverseIndex < 0);

  // Check that the reverse primer follows the forward primer.
  fn.error(not.eReversePrecedesForward, forwardIndex > reverseIndex);

  // Check that the primers don't overlap.
  fn.error(
    not.ePrimersOverlap,
    forwardIndex + forwardValue.length > reverseIndex
  );

  // Check that the primers occur only once in the sequence.
  fn.error(
    not.eForwardOccursMoreThanOnce,
    seqText.includes(forwardValue, forwardIndex + forwardValue.length)
  );
  fn.error(
    not.eReverseOccursMoreThanOnce,
    seqText.includes(reversedReverseValue, reverseIndex + reverseValue.length)
  );

  fn.mark(primer);

  const product = seqText.substring(
    forwardIndex,
    reverseIndex + reverseValue.length
  );

  showProductLength(primer.pair, product.length);

  primer.forward.dataset.cachedValue = forwardValue;
  primer.reverse.dataset.cachedValue = reverseValue;
});

// Copy information about a primer pair to the clipboard.
eventMap.click.push((primer) => {
  if (!isClickValid(primer, css.copyPairInfoBtnClass)) {
    return;
  }

  const geneName = cE.geneName.value.trim();
  const productLengthElement = getProductLengthElement(primer.pair);

  fn.error(not.eNoGeneName, !geneName);
  fn.error(
    not.eNoProductLength,
    !productLengthElement.classList.contains(css.shownProductLengthClass)
  );

  navigator.clipboard.writeText(
    `${geneName} (F): ${primer.forward.value}\n${geneName} ` +
      `(R): ${primer.reverse.value}\n${productLengthElement.textContent}`
  );
  fn.success(not.sPrimerPairInfoCopied);
});

// Remove a primer pair.
eventMap.click.push((primer, event) => {
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
