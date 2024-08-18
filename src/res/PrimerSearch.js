(function () {
  "use strict";

  const convertBtnId = "convert-btn";
  const seqId = "seq";
  const convertOnPasteId = "convert-on-paste";
  const geneNameId = "gene-name";
  const evenExonClass = "even";
  const oddExonClass = "odd";

  const addPrimerPairBtnId = "add-primer-pair-btn";
  const primerPairTemplateId = "primer-pair-template";
  const primerPairListId = "primer-pair-list";
  const primerPairClass = "primer-pair";
  const primerClass = "primer";
  const removeBtnShownClass = "remove-btn-shown";
  const markPrimerPairBtnClass = "mark-primer-pair-btn";
  const copyPairInfoBtnClass = "copy-pair-info-btn";
  const productLengthClass = "product-length";
  const removePrimerPairBtnClass = "remove-primer-pair-btn";
  const markedPrimerPairClass = "marked";
  const forwardMarkClass = "forward-mark";
  const reverseMarkClass = "reverse-mark";
  const shownProductLengthClass = "shown";

  // Constant elements
  const seqCE = document.getElementById(seqId);
  const convertBtnCE = document.getElementById(convertBtnId);
  const convertOnPasteCE = document.getElementById(convertOnPasteId);
  const geneNameCE = document.getElementById(geneNameId);

  const addPrimerPairBtnCE = document.getElementById(addPrimerPairBtnId);
  const primerPairListCE = document.getElementById(primerPairListId);
  const primerPairTemplateCE = document.getElementById(primerPairTemplateId);

  // Notifications
  const iSequenceAlreadyConverted = "Sequence is already converted.";

  const iExonsNotSeparated =
    "Exons are not separated. Each exon must " +
    "have a title above it beginning with `>`.";

  const iPrimerPairInfoCopied =
    "Primer pair info has been copied to clipboard.";

  const iCopiedListEmpty =
    "Copied list of primers is empty. If a max product " +
    "length was specified, then there are no primers " +
    "with a product length shorter than the one specified.";

  const wForwardPrimerNotFound =
    "Forward primer has not been found in sequence. " +
    "Make sure forward primer is correct.";

  const wReversePrimerNotFound =
    "Reverse primer has not been found in sequence. " +
    "Make sure reverse primer is correct and not inverted.";

  const wPrimersOverlap =
    "Forward and reverse primers overlap. " +
    "Make sure both primers are correct and in correct fields.";

  const wReversePrecedesForward =
    "Reverse primer precedes forward primer in sequence. " +
    "Make sure both primers are correct and in correct fields.";

  const wForwardOccursMoreThanOnce =
    "Forward primer occurs more than once in sequence. " +
    "Make sure forward primer is correct.";

  const wReverseOccursMoreThanOnce =
    "Reverse primer occurs more than once in sequence. " +
    "Make sure reverse primer is correct.";

  const wNoProductLength =
    "Product length is not available. " +
    "Make sure both primers are correct and can be found in sequence.";

  const wNoGeneName = "Gene name is not specified.";

  ////////////////////////////////////////////////

  function info(text) {
    toastMessage({
      text: text,
    });
  }

  function warning(text) {
    toastMessage({
      text: text,
      style: {
        background:
          "linear-gradient(to right, rgb(255, 95, 109), rgb(255, 150, 113))",
      },
    });
  }

  const defaultToastOptions = {
    gravity: "bottom",
    position: "right",
    duration: 10000,
  };

  function toastMessage(extraOptions) {
    Toastify({ ...extraOptions, ...defaultToastOptions }).showToast();
  }

  class WarningQueue {
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

  ////////////////////////////////////////////////

  convertBtnCE.addEventListener(
    "click",
    () => {
      if (seqCE.innerHTML.includes(`<span class="${evenExonClass}">`)) {
        info(iSequenceAlreadyConverted);
        return;
      }

      concatenateExons(seqCE.innerText);
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

    seqCE.innerHTML =
      text.replace(rremoveHeaders, () => {
        let result = "";

        if (currentExon > 0) {
          result += "</span>";
        }

        result += `<span class="${
          currentExon % 2 === 0 ? evenExonClass : oddExonClass
        }">`;

        currentExon++;
        return result;
      }) + (currentExon ? "</span>" : "");

    // Remove line breaks and possible spaces between nucleotide bases.
    const treeWalker = document.createTreeWalker(seqCE, NodeFilter.SHOW_TEXT);
    while (treeWalker.nextNode()) {
      treeWalker.currentNode.textContent =
        treeWalker.currentNode.textContent.replace(rremoveWhitespaces, "");
    }

    // If currentExon is 0, then no exon title has been found and exons cannot be given varying colors.
    if (!currentExon) {
      info(iExonsNotSeparated);
    }
  }

  ////////////////////////////////////////////////

  seqCE.addEventListener(
    "paste",
    (event) => {
      geneNameCE.value = "";

      if (convertOnPasteCE.checked) {
        event.preventDefault();
        concatenateExons(event.clipboardData.getData("text"));
      }
    },
    false
  );

  ////////////////////////////////////////////////

  addPrimerPairBtnCE.addEventListener("click", appendPrimerPair, false);

  let primerPairNumber = 0;

  function appendPrimerPair(forward, reverse, productLength) {
    const primerPair = createPrimerPair();

    if (forward && reverse) {
      const [forwardElement, reverseElement] =
        primerPair.getElementsByClassName(primerClass);
      forwardElement.value = forward;
      reverseElement.value = reverse;
    }

    if (productLength) {
      showProductLength(primerPair, productLength);
    }

    primerPairListCE.append(primerPair);
    primerPairNumber++;

    if (primerPairNumber > 1) {
      showRemovePrimerPairBtn();
    }
  }

  function createPrimerPair() {
    return primerPairTemplateCE.content.cloneNode(true).children[0];
  }

  function removePrimerPair(primerPair, keepLast) {
    primerPair.remove();
    primerPairNumber--;
    unmark({ pair: primerPair });

    if (keepLast && !primerPairNumber) {
      appendPrimerPair();
      hideRemovePrimerPairBtn();
    }
  }

  function removeAllPrimerPairs(keepLast) {
    const primerPairs =
      primerPairListCE.getElementsByClassName(primerPairClass);
    let i = primerPairs.length;

    while (i--) {
      removePrimerPair(primerPairs[i], keepLast);
    }
  }

  function showRemovePrimerPairBtn() {
    primerPairListCE.classList.add(removeBtnShownClass);
  }

  function hideRemovePrimerPairBtn() {
    primerPairListCE.classList.remove(removeBtnShownClass);
  }

  const rproductLength = /\{pl\}|\d+/;

  function showProductLength(primerPair, productLength) {
    const productLengthElement =
      primerPair.getElementsByClassName(productLengthClass)[0];

    productLengthElement.textContent = productLengthElement.textContent.replace(
      rproductLength,
      productLength
    );

    productLengthElement.classList.add(shownProductLengthClass);
  }

  function hideProductLength(primerPair) {
    primerPair
      .getElementsByClassName(productLengthClass)[0]
      .classList.remove(shownProductLengthClass);
  }

  // Add the first primer pair.
  appendPrimerPair();

  ////////////////////////////////////////////////

  for (const eventType of ["paste", "click", "keyup"]) {
    primerPairListCE.addEventListener(eventType, handlePrimerPair, false);
  }

  function handlePrimerPair(event) {
    const primerPair = event.target.closest("." + primerPairClass);

    if (!primerPair) {
      return;
    }

    const [forwardElement, reverseElement] =
      primerPair.getElementsByClassName(primerClass);

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
        info(iCopiedListEmpty);
      }
    } else {
      event.target.value = clipboardText;

      if (primer.forward.value || primer.reverse.value) {
        // Mark a primer pair in the gene sequence after it's pasted.
        // The condition checks the presence of only one of the primers
        // because the paste event is fired before the input field is updated.
        primer.pair
          .getElementsByClassName(markPrimerPairBtnClass)[0]
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
    if (!isClickValid(primer, markPrimerPairBtnClass)) {
      return;
    }

    const seqText = seqCE.textContent;
    const forwardValue = primer.forward.value;
    const reverseValue = primer.reverse.value;
    const forwardIndex = seqText.indexOf(forwardValue);
    const reverseIndex = seqText.indexOf(reverseComplement(reverseValue));

    // Unmark everything now in case of errors.
    unmark();

    const primerWarning = new WarningQueue();

    // Check that the primers are in the sequence.
    primerWarning.append(forwardIndex < 0, wForwardPrimerNotFound);
    primerWarning.append(reverseIndex < 0, wReversePrimerNotFound);

    if (primerWarning.passed) {
      // Check that the reverse primer follows the forward primer.
      primerWarning.append(
        forwardIndex > reverseIndex,
        wReversePrecedesForward
      );

      // Check that the primers don't overlap.
      primerWarning.append(
        forwardIndex + forwardValue.length > reverseIndex,
        wPrimersOverlap
      );

      // Check that the primers occur only once in the sequence.
      primerWarning.append(
        seqText.includes(forwardValue, forwardIndex + forwardValue.length),
        wForwardOccursMoreThanOnce
      );
      primerWarning.append(
        seqText.includes(reverseValue, reverseIndex + reverseValue.length),
        wReverseOccursMoreThanOnce
      );
    }

    primerWarning.run(() => {
      mark(primer);

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
    if (!isClickValid(primer, copyPairInfoBtnClass)) {
      return;
    }

    const geneName = geneNameCE.value.trim();
    const productLengthElement =
      primer.pair.getElementsByClassName(productLengthClass)[0];
    const pairInfoWarning = new WarningQueue();

    pairInfoWarning.append(!geneName, wNoGeneName);
    pairInfoWarning.append(
      !productLengthElement.classList.contains(shownProductLengthClass),
      wNoProductLength
    );

    pairInfoWarning.run(() => {
      navigator.clipboard.writeText(
        `${geneName} (F): ${primer.forward.value}\n${geneName} ` +
          `(R): ${primer.reverse.value}\n${productLengthElement.textContent}`
      );
      info(iPrimerPairInfoCopied);
    });
  });

  eventMap.click.push((primer, event) => {
    // Remove a primer pair when the corresponding button is clicked.
    if (event.target.classList.contains(removePrimerPairBtnClass)) {
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
      unmark(primer);
      dataset.cachedValue = value;
    }
  });

  function isClickValid(primer, className) {
    return (
      seqCE.textContent &&
      primer.forward.value &&
      primer.reverse.value &&
      primer.target.closest("." + className)
    );
  }

  function isTargetPrimer(primer) {
    return primer.target === primer.forward || primer.target === primer.reverse;
  }

  const markInstance = new Mark(seqCE);
  let markedPrimerPair;

  function mark(primer) {
    primer.pair.classList.add(markedPrimerPairClass);

    markInstance.mark(primer.forward.value, {
      acrossElements: true,
      className: forwardMarkClass,
    });

    markInstance.mark(reverseComplement(primer.reverse.value), {
      acrossElements: true,
      className: reverseMarkClass,
    });

    markedPrimerPair = primer.pair;

    seqCE.getElementsByTagName("mark")[0].scrollIntoView({
      behavior: "smooth",
    });
  }

  function unmark(primer) {
    if (!markedPrimerPair) {
      return;
    }

    if (primer && primer.pair !== markedPrimerPair) {
      return;
    }

    markInstance.unmark();
    markedPrimerPair.classList.remove(markedPrimerPairClass);
    markedPrimerPair = undefined;
  }

  const racidBases = /[ATGC]/g;
  const compementaryPairs = {
    A: "T",
    G: "C",
    T: "A",
    C: "G",
  };

  function reverseComplement(primer) {
    return primer
      .split("")
      .reverse()
      .join("")
      .replace(racidBases, (base) => compementaryPairs[base]);
  }
})();
