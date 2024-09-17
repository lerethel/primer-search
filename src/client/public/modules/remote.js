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

    if (!response.ok) {
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

  fn.error(not.eSpeciesNotSpecified, !species);
  fn.error(not.eNoGeneName, !gene);

  fn.info(not.iSearchingForSequence);
  const response = await seqRequest.send({ species, gene });

  fn.error(not.eSequenceNotFound, !response.ok);

  fn.joinExons((await response.json()).sequence);
  fn.success(not.sSequenceDownloaded);
}

const primerRequest = new fn.SingletonRequest("/blast/search");

let primerTimer;

export async function findPrimers() {
  const species = cE.species.value.trim();
  const sequence = cE.seq.textContent;
  const onSpliceSite = cE.mustSpanJunction.checked ? 1 : 0;
  const maxProductLength = cE.maxProductLength.value;

  fn.error(not.eSpeciesNotSpecified, !species);
  fn.error(not.eNoSequence, !sequence);

  clearTimeout(primerTimer);
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

  const initJSON = await initResponse.json();

  fn.error(initJSON.message, !initResponse.ok);

  createPrimerPoller(initJSON.job_key, 30000)();
}

function createPrimerPoller(jobKey, interval) {
  return async function poller() {
    const primerResponse = await primerRequest.send(
      { job_key: jobKey },
      { cache: "no-store" }
    );

    const primerJSON = await primerResponse.json();

    if (primerJSON.message) {
      if (!primerResponse.ok) {
        fn.error(primerJSON.message);
      }

      primerTimer = setTimeout(poller, interval);
      return fn.info(primerJSON.message);
    }

    pair.populateFromJSON(primerJSON);
    fn.success(not.sPrimersDownloaded);
  };
}
