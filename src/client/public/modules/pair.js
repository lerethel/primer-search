import * as cE from "./const-elem.js";
import * as css from "./css-attr.js";
import * as fn from "./fn.js";
import * as not from "./notification.js";

/////////////////////////////////////
/// METHODS FOR OPERATING THE DOM ///

function showRemoveButton() {
  cE.primerPairList.classList.add(css.removeBtnShownClass);
}

function hideRemoveButton() {
  cE.primerPairList.classList.remove(css.removeBtnShownClass);
}

let pairCache = [];

class PrimerPair {
  pair = cE.primerPairTemplate.content.cloneNode(true).children[0];

  productLength = new ProductLength(this.pair);

  buttons = {
    remove: this.pair.getElementsByClassName(css.removePrimerPairBtnClass)[0],
    mark: this.pair.getElementsByClassName(css.markPrimerPairBtnClass)[0],
    copyInfo: this.pair.getElementsByClassName(css.copyPairInfoBtnClass)[0],
  };

  constructor(forward, reverse, productLength) {
    this.buttons.remove.title = not.tRemovePrimerPair;
    this.buttons.mark.title = not.tMarkPrimerPair;
    this.buttons.copyInfo.title = not.tCopyPairInfo;

    [this.forward, this.reverse] = this.pair.getElementsByClassName(
      css.primerClass
    );

    if (forward && reverse && productLength) {
      this.forward.value = forward;
      this.reverse.value = reverse;
      this.productLength.value = productLength;
      this.productLength.show();
    }
  }

  append() {
    cE.primerPairList.append(this.pair);
    pairCache.push(this);

    if (pairCache.length > 1) {
      showRemoveButton();
    }
  }

  remove(leaveEmpty) {
    this.pair.remove();
    fn.unmark(this);
    pairCache = pairCache.filter((instance) => instance !== this);

    if (leaveEmpty && !pairCache.length) {
      appendEmpty();
      hideRemoveButton();
    }
  }

  static find(pair) {
    return pairCache.find((instance) => instance.pair === pair);
  }
}

export function appendEmpty() {
  return new PrimerPair().append();
}

export function removeAll(leaveEmpty) {
  let count = pairCache.length;
  while (count--) {
    pairCache[count].remove(leaveEmpty);
  }
}

export function populateFromJSON(json) {
  removeAll();
  json.forEach(({ forward, reverse, length }) => {
    new PrimerPair(forward, reverse, length).append();
  });
}

const rproductLength = /\d+/;

class ProductLength {
  #element;

  constructor(pair) {
    this.#element = pair.getElementsByClassName(css.productLengthClass)[0];
  }

  get value() {
    return this.#element.textContent.match(rproductLength)[0];
  }

  set value(value) {
    this.#element.textContent = this.#element.textContent.replace(
      rproductLength,
      value
    );
  }

  show() {
    this.#element.classList.add(css.shownProductLengthClass);
  }

  hide() {
    this.#element.classList.remove(css.shownProductLengthClass);
  }

  get shown() {
    return this.#element.classList.contains(css.shownProductLengthClass);
  }
}

///////////////////////////////////
/// METHODS FOR HANDLING EVENTS ///

export function handleEvent(event) {
  const pair = PrimerPair.find(event.target.closest("." + css.primerPairClass));

  if (!pair) {
    return;
  }

  pair.forward.value = pair.forward.value.trim();
  pair.reverse.value = pair.reverse.value.trim();

  eventMap[event.type].forEach((callback) => callback(pair, event));
}

const eventMap = { paste: [], click: [], input: [] };

eventMap.paste.push((pair, event) => {
  if (!isTargetPrimer(pair, event)) {
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
    // "Input" has to be called manually since the default pasting
    // behavior is prevented, i.e., pasting doesn't update the field.
    event.target.dispatchEvent(new Event("input", { bubbles: true }));

    if (pair.forward.value && pair.reverse.value) {
      // Mark a primer pair in the gene sequence after it's pasted.
      pair.buttons.mark.dispatchEvent(new Event("click", { bubbles: true }));
    }
  }
});

// Mark a primer pair in the gene sequence; calculate
// and show the product length of the primer pair.
eventMap.click.push((pair, event) => {
  if (!isClickValid(pair, event, pair.buttons.mark)) {
    return;
  }

  const seqText = cE.seq.textContent;

  const forwardValue = pair.forward.value;
  const reverseValue = pair.reverse.value;
  const reversedReverseValue = fn.reverseComplement(reverseValue);

  const forwardIndex = seqText.indexOf(forwardValue);
  const reverseIndex = seqText.indexOf(reversedReverseValue);
  const forwardEndIndex = forwardIndex + forwardValue.length;
  const reverseEndIndex = reverseIndex + reversedReverseValue.length;

  // Unmark everything now in case of errors.
  fn.unmark();

  // Check that the primers are in the sequence.
  fn.error(not.eForwardPrimerNotFound, forwardIndex < 0);
  fn.error(not.eReversePrimerNotFound, reverseIndex < 0);

  // Check that the reverse primer follows the forward primer.
  fn.error(not.eReversePrecedesForward, forwardIndex > reverseIndex);

  // Check that the primers don't overlap.
  fn.error(not.ePrimersOverlap, forwardEndIndex > reverseIndex);

  // Check that the primers occur only once in the sequence.
  fn.error(
    not.eForwardOccursMoreThanOnce,
    seqText.includes(forwardValue, forwardEndIndex)
  );
  fn.error(
    not.eReverseOccursMoreThanOnce,
    seqText.includes(reversedReverseValue, reverseEndIndex)
  );

  fn.mark(pair);

  const product = seqText.substring(forwardIndex, reverseEndIndex);
  pair.productLength.value = product.length;
  pair.productLength.show();
});

// Copy information about a primer pair to the clipboard.
eventMap.click.push((pair, event) => {
  if (!isClickValid(pair, event, pair.buttons.copyInfo)) {
    return;
  }

  const geneName = cE.geneName.value.trim();

  fn.error(not.eNoGeneName, !geneName);
  fn.error(not.eNoProductLength, !pair.productLength.shown);

  navigator.clipboard.writeText(
    `${geneName} (F): ${pair.forward.value}\n` +
      `${geneName} (R): ${pair.reverse.value}\n` +
      `Product length: ${pair.productLength.value}`
  );
  fn.success(not.sPrimerPairInfoCopied);
});

// Remove a primer pair.
eventMap.click.push((pair, event) => {
  if (event.target === pair.buttons.remove) {
    pair.remove(true);
  }
});

// Hide the product length of a primer pair when either of the primers
// is modified. If the primer pair is marked in the sequence, unmark it.
eventMap.input.push((pair, event) => {
  if (!isTargetPrimer(pair, event)) {
    return;
  }

  const { data } = event;
  const { value } = event.target;

  // Ignore cases where only whitespaces were added to either side of a primer.
  if (data && !data.trim() && !value.includes(" ")) {
    return;
  }

  if (value) {
    showRemoveButton();
  }

  pair.productLength.hide();
  fn.unmark(pair);
});

function isClickValid(pair, event, intendedTarget) {
  if (!intendedTarget.contains(event.target)) {
    return false;
  }

  fn.error(not.eNoSequence, !cE.seq.textContent);
  fn.error(not.eNoForward, !pair.forward.value);
  fn.error(not.eNoReverse, !pair.reverse.value);

  return true;
}

function isTargetPrimer(pair, event) {
  return event.target === pair.forward || event.target === pair.reverse;
}
