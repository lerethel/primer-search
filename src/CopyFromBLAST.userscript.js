// ==UserScript==
// @name         Copy from Primer-BLAST for PrimerSearch
// @version      1.0
// @description  Copies lists of primers from Primer-BLAST to be pasted into PrimerSearch
// @match        https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi?*
// ==/UserScript==

(function () {
	"use strict";

	const primerSearchButton = document.createElement("button");
	primerSearchButton.type = "button";
	primerSearchButton.textContent = "Copy for PrimerSearch";
	primerSearchButton.style.display = "inline";

	const maxProductLengthField = document.createElement("input");
	maxProductLengthField.type = "input";
	maxProductLengthField.style.display = "inline";
	maxProductLengthField.style.marginLeft = "10px";
	maxProductLengthField.style.width = "30px";
	maxProductLengthField.style.textAlign = "center";

	const maxProductLengthFieldLabel = document.createElement("label");
	maxProductLengthFieldLabel.textContent = "Max product length";
	maxProductLengthFieldLabel.style.display = "inline";
	maxProductLengthFieldLabel.style.marginLeft = "10px";
	maxProductLengthFieldLabel.append(maxProductLengthField);

	primerSearchButton.addEventListener("click", () => {
		const treeWalker = document.createTreeWalker(document.getElementById("alignments"), NodeFilter.SHOW_ELEMENT);
		const primerInfo = [];
		let currentPrimerPairInfo = [];

		while (treeWalker.nextNode()) {
			const currentElement = treeWalker.currentNode;
			const currentText = currentElement.textContent.toLowerCase();

			if (currentText === "forward primer" || currentText === "reverse primer") {
				currentPrimerPairInfo.push(currentElement.nextElementSibling.textContent);
			} else if (currentText === "product length") {
				currentPrimerPairInfo.push(parseInt(currentElement.nextElementSibling.textContent));

				const maxProductLengthParsed = (maxProductLengthField.value) ? parseInt(maxProductLengthField.value) : 0;

				if (!maxProductLengthParsed || currentPrimerPairInfo[2] <= maxProductLengthParsed) {
					primerInfo.push({
						forward: currentPrimerPairInfo[0],
						reverse: currentPrimerPairInfo[1],
						length: currentPrimerPairInfo[2]
					});
				}

				currentPrimerPairInfo = [];
			}
		}

		navigator.clipboard.writeText("<Copied for PrimerSearch>" + JSON.stringify(primerInfo));
	}, false);

	const container = document.createElement("div");
	container.append(primerSearchButton, maxProductLengthFieldLabel);

	const alignInfo = document.getElementById("alignInfo");
	alignInfo.insertBefore(container, alignInfo.firstChild);
}());