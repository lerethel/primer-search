// ==UserScript==
// @name         Copy from Primer-BLAST for PrimerSearch
// @version      1.0
// @description  Copies lists of primers from Primer-BLAST to be pasted into PrimerSearch
// @match        https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi?*
// ==/UserScript==

(function () {
  "use strict";

  const container = document.createElement("div");

  container.innerHTML =
    '<button type="button" style="width: 18rem;">Copy for PrimerSearch' +
    '</button><label style="display: inline; margin-left: 1rem;">' +
    'Max product length<input type="input" style="display: inline;' +
    'margin-left: 1rem; width: 4rem; text-align: center;"></label>';

  const primerSearchButton = container.getElementsByTagName("button")[0];
  const maxProductLengthElement = container.getElementsByTagName("input")[0];
  const originalButtonText = primerSearchButton.textContent;
  const rprimerField = /^(?:(?:forward|reverse) primer|product length)$/i;

  let buttonTimer;

  primerSearchButton.addEventListener(
    "click",
    (event) => {
      clearTimeout(buttonTimer);

      const treeWalker = document.createTreeWalker(
        document.getElementById("alignments"),
        NodeFilter.SHOW_ELEMENT,
        (node) =>
          node.tagName === "TH" && rprimerField.test(node.textContent)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
      );

      const getNextProperty = () =>
        treeWalker.nextNode()?.nextElementSibling.textContent;
      const maxProductLength = parseInt(maxProductLengthElement.value);
      const primerInfo = [];

      let forward, reverse, length;

      while (
        (forward = getNextProperty()) &&
        (reverse = getNextProperty()) &&
        (length = getNextProperty())
      ) {
        if (!maxProductLength || length <= maxProductLength) {
          primerInfo.push({
            forward,
            reverse,
            length: parseInt(length),
          });
        }
      }

      navigator.clipboard.writeText(
        "<Copied for PrimerSearch>" + JSON.stringify(primerInfo)
      );

      const { target } = event;

      target.textContent = primerInfo.length
        ? "Primers copied"
        : "No primers found";
      buttonTimer = setTimeout(() => {
        target.textContent = originalButtonText;
      }, 3000);
    },
    false
  );

  document.getElementById("alignInfo").prepend(container);
})();
