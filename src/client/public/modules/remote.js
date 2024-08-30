import * as cE from "./const-elem.js";
import * as fn from "./fn.js";
import * as not from "./notification.js";
import * as pair from "./pair.js";

const taxonMinLength = 5;
const taxonRequest = new fn.SingletonRequest("/ensembl/taxon");

let taxonTimer;

export function findTaxons() {
  const search = fn.capitalize(cE.species.value.trim());

  if (search.length < taxonMinLength) {
    return;
  }

  for (const option of cE.speciesList.options) {
    if (option.textContent.indexOf(search) === 0) {
      return;
    }
  }

  clearTimeout(taxonTimer);

  taxonTimer = setTimeout(async () => {
    const response = await taxonRequest.send({ search });

    if (!response?.ok) {
      return;
    }

    const json = await response.json();
    const fragment = new DocumentFragment();

    json.forEach((entry) => {
      const element = document.createElement("option");
      element.textContent = `${entry.scientific_name} (taxid:${entry.id})`;
      fragment.append(element);
    });

    cE.speciesList.replaceChildren(fragment);
  }, 1000);
}

const rtaxid = /\s*\(taxid.+$/;
const seqRequest = new fn.SingletonRequest("/ensembl/sequence");

export async function findSeq() {
  const species = cE.species.value.replace(rtaxid, "").trim();
  const gene = cE.geneName.value.trim();

  const seqWarning = new fn.WarningQueue();
  seqWarning.append(!species, not.wSpeciesNotSpecified);
  seqWarning.append(!gene, not.wNoGeneName);

  seqWarning.run(async () => {
    fn.info(not.iSearchingForSequence);
    const response = await seqRequest.send({ species, gene });

    if (!response) {
      return;
    }

    if (!response.ok) {
      fn.warning(not.wSequenceNotFound);
      return;
    }

    fn.joinExons((await response.json()).sequence);
    fn.info(not.iSequenceDownloaded);
  });
}

const primerRequest = new fn.SingletonRequest("/blast/search");

let primerInterval;

export async function findPrimers() {
  const species = cE.species.value.trim();
  const sequence = cE.seq.textContent;
  const onSpliceSite = cE.mustSpanJunction.checked ? 1 : 0;
  const maxProductLength = cE.maxProductLength.value;

  const seqWarning = new fn.WarningQueue();
  seqWarning.append(!species, not.wSpeciesNotSpecified);
  seqWarning.append(!sequence, not.wNoSequence);

  seqWarning.run(async () => {
    clearInterval(primerInterval);
    fn.info(not.iRequestBeingProcessed);

    const initResponse = await primerRequest.send(null, {
      method: "POST",
      body: JSON.stringify({
        species,
        sequence,
        onSpliceSite,
        maxProductLength,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (!initResponse) {
      return;
    }

    const initJSON = await initResponse.json();

    if (!initResponse.ok) {
      fn.warning(initJSON.message);
      return;
    }

    primerInterval = setInterval(async () => {
      const primerResponse = await primerRequest.send(
        { job_key: initJSON.job_key },
        { cache: "no-store" }
      );

      if (!primerResponse) {
        clearInterval(primerInterval);
        return;
      }

      const primerJSON = await primerResponse.json();

      if (primerJSON.message) {
        if (primerResponse.ok) {
          fn.info(primerJSON.message);
        } else {
          fn.warning(primerJSON.message);
          clearInterval(primerInterval);
        }
        return;
      }

      clearInterval(primerInterval);
      pair.populateFromJSON(primerJSON);
      fn.info(not.iPrimersDownloaded);
    }, 30000);
  });
}
