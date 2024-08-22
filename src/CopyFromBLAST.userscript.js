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

  primerSearchButton.addEventListener(
    "click",
    () => {
      const treeWalker = document.createTreeWalker(
        document.getElementById("alignments"),
        NodeFilter.SHOW_ELEMENT
      );
      const maxProductLength = parseInt(maxProductLengthField.value);
      const primerInfo = [];

      let curPrimerPairInfo = [];

      while (treeWalker.nextNode()) {
        const curElement = treeWalker.currentNode;
        const curText = curElement.textContent.toLowerCase();

        if (curText === "forward primer" || curText === "reverse primer") {
          curPrimerPairInfo.push(curElement.nextElementSibling.textContent);
        } else if (curText === "product length") {
          curPrimerPairInfo.push(
            parseInt(curElement.nextElementSibling.textContent)
          );

          if (!maxProductLength || curPrimerPairInfo[2] <= maxProductLength) {
            primerInfo.push({
              forward: curPrimerPairInfo[0],
              reverse: curPrimerPairInfo[1],
              length: curPrimerPairInfo[2],
            });
          }

          curPrimerPairInfo = [];
        }
      }

      navigator.clipboard.writeText(
        "<Copied for PrimerSearch>" + JSON.stringify(primerInfo)
      );
    },
    false
  );

  const container = document.createElement("div");
  container.append(primerSearchButton, maxProductLengthFieldLabel);

  const alignInfo = document.getElementById("alignInfo");
  alignInfo.insertBefore(container, alignInfo.firstChild);
})();
