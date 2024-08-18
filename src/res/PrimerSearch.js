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
    const iExonsNotSeparated = "Exons are not separated. Each exon must have a title above it beginning with `>`.";
    const iPrimerPairInfoCopied = "Primer pair info has been copied to clipboard.";
    const iCopiedListEmpty = "Copied list of primers is empty. If a max product length was specified, then there are no primers with a product length shorter than the one specified.";

    const wForwardPrimerNotFound = "Forward primer has not been found in sequence. Make sure forward primer is correct.";
    const wReversePrimerNotFound = "Reverse primer has not been found in sequence. Make sure reverse primer is correct and not inverted.";
    const wPrimersOverlap = "Forward and reverse primers overlap. Make sure both primers are correct and in correct fields.";
    const wReversePrecedesForward = "Reverse primer precedes forward primer in sequence. Make sure both primers are correct and in correct fields.";
    const wForwardOccursMoreThanOnce = "Forward primer occurs more than once in sequence. Make sure forward primer is correct.";
    const wReverseOccursMoreThanOnce = "Reverse primer occurs more than once in sequence. Make sure reverse primer is correct.";
    const wNoProductLength = "Product length is not available. Make sure both primers are correct and can be found in sequence.";
    const wNoGeneName = "Gene name is not specified.";

    ////////////////////////////////////////////////

    function info(text) {
        toastMessage({
            text: text
        });
    }

    function warning(text) {
        toastMessage({
            text: text,
            style: {
                background: "linear-gradient(to right, rgb(255, 95, 109), rgb(255, 150, 113))"
            }
        });
    }

    const defaultToastOptions = {
        gravity: "bottom",
        position: "right",
        duration: 10000
    };

    function toastMessage(additionalOptions) {
        Toastify(Object.assign(additionalOptions, defaultToastOptions)).showToast();
    }

    ////////////////////////////////////////////////

    convertBtnCE.addEventListener("click", concatenateExons, false);

    const rremoveHeaders = /^>.+?$/gm;
    const rremoveWhitespaces = /\s+/g;

    function concatenateExons(customText) {
        const isTextCustom = (typeof customText === "string");

        if (!isTextCustom && seqCE.innerHTML.indexOf(`<span class="${evenExonClass}">`) >= 0) {
            info(iSequenceAlreadyConverted);
            return;
        }

        const text = ((isTextCustom) ? customText : seqCE.innerText).trim();

        if (!text) {
            return;
        }

        let currentExon = 0;

        seqCE.innerHTML = text.replace(rremoveHeaders, () => {
            let result = "";

            if (currentExon > 0) {
                result += "</span>";
            }

            result += `<span class="${(currentExon % 2 === 0) ? evenExonClass : oddExonClass}">`;

            currentExon++;
            return result;
        }) + ((currentExon) ? "</span>" : "");

        // Remove line breaks and possible spaces between nucleotide bases.
        const treeWalker = document.createTreeWalker(seqCE, NodeFilter.SHOW_TEXT);
        while (treeWalker.nextNode()) {
            treeWalker.currentNode.textContent = treeWalker.currentNode.textContent.replace(rremoveWhitespaces, "");
        }

        // If currentExon is 0, then no exon title has been found and exons cannot be given varying colors.
        if (!currentExon) {
            info(iExonsNotSeparated);
        }
    }

    ////////////////////////////////////////////////

    seqCE.addEventListener("paste", (event) => {
        geneNameCE.value = "";

        if (convertOnPasteCE.checked) {
            event.preventDefault();
            concatenateExons(event.clipboardData.getData("text"));
        }
    }, false);

    ////////////////////////////////////////////////

    addPrimerPairBtnCE.addEventListener("click", appendPrimerPair, false);

    let primerPairNumber = 0;

    function appendPrimerPair(forward, reverse, productLength) {
        const primerPair = createPrimerPair();

        if (forward && reverse) {
            const [forwardElement, reverseElement] = primerPair.getElementsByClassName(primerClass);
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

        // markedPrimerPair and unmark() are declared below.
        if (primerPair === markedPrimerPair) {
            unmark();
        }

        if (keepLast && !primerPairNumber) {
            appendPrimerPair();
            hideRemovePrimerPairBtn();
        }
    }

    function removeAllPrimerPairs(keepLast) {
        const primerPairs = primerPairListCE.getElementsByClassName(primerPairClass);
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
        const productLengthElement = primerPair.getElementsByClassName(productLengthClass)[0];
        productLengthElement.textContent = productLengthElement.textContent.replace(rproductLength, productLength);
        productLengthElement.classList.add(shownProductLengthClass);
    }

    function hideProductLength(primerPair) {
        const productLengthElement = primerPair.getElementsByClassName(productLengthClass)[0];
        productLengthElement.classList.remove(shownProductLengthClass);
    }

    // Add the first primer pair.
    appendPrimerPair();

    ////////////////////////////////////////////////

    primerPairListCE.addEventListener("paste", handlePrimerPair, false);
    primerPairListCE.addEventListener("click", handlePrimerPair, false);
    primerPairListCE.addEventListener("keyup", handlePrimerPair, false);

    let markedPrimerPair;

    function handlePrimerPair(event) {
        const target = event.target;
        const primerPair = target.closest("." + primerPairClass);

        if (!primerPair) {
            return;
        }

        const [forwardElement, reverseElement] = primerPair.getElementsByClassName(primerClass);
        const forward = forwardElement.value.trim();
        const reverse = reverseElement.value.trim();
        const targetIsPrimer = (target === forwardElement || target === reverseElement);

        if (event.type === "paste" && targetIsPrimer) {
            const clipboardText = event.clipboardData.getData("text").trim();
            event.preventDefault();

            if (clipboardText.indexOf("<Copied for PrimerSearch>") === 0) {
                // Paste primers copied by the userscript for Primer-BLAST
                const parsed = JSON.parse(clipboardText.replace("<Copied for PrimerSearch>", ""));

                if (parsed.length) {
                    removeAllPrimerPairs();
                    parsed.forEach((element) => {
                        appendPrimerPair(element.forward, element.reverse, element.length);
                    });
                } else {
                    info(iCopiedListEmpty);
                }

            } else {
                target.value = clipboardText;

                if (forward || reverse) {
                    // Mark a primer pair in the gene sequence after it's pasted.
                    // The condition checks the presence of only one of the primers
                    // because the paste event is fired before the input field is updated.

                    primerPair.getElementsByClassName(markPrimerPairBtnClass)[0].dispatchEvent(new Event("click", {
                        bubbles: true
                    }));

                }
            }
        } else if (event.type === "click") {
            // Mark a primer pair in the gene sequence or copy information
            // about the primer pair when the corresponding button is clicked.

            const seqText = seqCE.textContent;

            if (forward && reverse && seqText) {

                if (target.closest("." + markPrimerPairBtnClass)) {
                    // This block marks a primer pair in the gene sequence,
                    // calculates and shows the product length of the primer pair.
                    const forwardIndex = seqText.indexOf(forward);
                    const reverseIndex = seqText.indexOf(reverseComplement(reverse));

                    // Unmark everything now in case of errors.
                    unmark();

                    let primersCorrect = true;

                    const primerCheckFailed = (warningText) => {
                        warning(warningText);
                        primersCorrect = false;
                    };

                    // Check that the primers are in the sequence.
                    if (forwardIndex < 0) {
                        primerCheckFailed(wForwardPrimerNotFound);
                    }

                    if (reverseIndex < 0) {
                        primerCheckFailed(wReversePrimerNotFound);
                    }

                    if (primersCorrect) {

                        if (forwardIndex > reverseIndex) {
                            // Check that the reverse primer follows the forward primer.
                            primerCheckFailed(wReversePrecedesForward);
                        } else if (forwardIndex + forward.length > reverseIndex) {
                            // Check that the primers don't overlap.
                            primerCheckFailed(wPrimersOverlap);
                        }

                        // Check that the primers occur only once in the sequence.
                        if (seqText.indexOf(forward, forwardIndex + forward.length) >= 0) {
                            primerCheckFailed(wForwardOccursMoreThanOnce);
                        }

                        if (seqText.indexOf(reverse, reverseIndex + reverse.length) >= 0) {
                            primerCheckFailed(wReverseOccursMoreThanOnce);
                        }

                    }

                    if (primersCorrect) {
                        primerPair.classList.add(markedPrimerPairClass);

                        markInstance.mark(forward, markForwardOptions);
                        markInstance.mark(reverseComplement(reverse), markReverseOptions);
                        markedPrimerPair = primerPair;

                        seqCE.getElementsByTagName("mark")[0].scrollIntoView({
                            behavior: "smooth"
                        });

                        showProductLength(primerPair, seqText.substring(forwardIndex, reverseIndex + reverse.length).length);
                        forwardElement.dataset.cachedValue = forward;
                        reverseElement.dataset.cachedValue = reverse;
                    }

                } else if (target.closest("." + copyPairInfoBtnClass)) {
                    // This block copies information about a primer pair to the clipboard.
                    const geneName = geneNameCE.value.trim();
                    let pairInfoFull = true;

                    const pairInfoCheckFailed = (warningText) => {
                        warning(warningText);
                        pairInfoFull = false;
                    };

                    if (!geneName) {
                        pairInfoCheckFailed(wNoGeneName);
                    }

                    const productLengthElement = primerPair.getElementsByClassName(productLengthClass)[0];

                    if (!productLengthElement.classList.contains(shownProductLengthClass)) {
                        pairInfoCheckFailed(wNoProductLength);
                    }

                    if (pairInfoFull) {
                        navigator.clipboard.writeText(`${geneName} (F): ${forward}\n${geneName} (R): ${reverse}\n${productLengthElement.textContent}`);
                        info(iPrimerPairInfoCopied);
                    }
                }

            }

            // Remove a primer pair when the corresponding button is clicked.
            if (target.classList.contains(removePrimerPairBtnClass)) {
                removePrimerPair(primerPair, true);
            }

        } else if (event.type === "keyup" && targetIsPrimer) {
            // Hide the product length of a primer pair when any of the primers are modified.
            // If the primer pair is marked in the sequence, unmark it.

            const value = target.value.trim(); // Adding whitespaces doesn't count as a change.

            if (value) {
                showRemovePrimerPairBtn();
            }

            const dataset = target.dataset;

            if (dataset.cachedValue && dataset.cachedValue !== value) {
                hideProductLength(primerPair);

                if (primerPair === markedPrimerPair) {
                    unmark();
                }

                dataset.cachedValue = value;
            }

        }
    }

    const markInstance = new Mark(seqCE);
    const markForwardOptions = {
        acrossElements: true,
        className: forwardMarkClass
    };
    const markReverseOptions = {
        acrossElements: true,
        className: reverseMarkClass
    };

    function unmark() {
        if (markedPrimerPair) {
            markInstance.unmark();
            markedPrimerPair.classList.remove(markedPrimerPairClass);
            markedPrimerPair = undefined;
        }
    }

    const racidBases = /[ATGC]/g;
    const compementaryPairs = {
        A: "T",
        G: "C",
        T: "A",
        C: "G"
    };

    function reverseComplement(primer) {
        return primer.split("").reverse().join("").replace(racidBases, (base) => compementaryPairs[base]);
    }

}());