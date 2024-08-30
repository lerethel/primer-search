import ensemblDefaults from "../config/ensembl-defaults.js";

function buildEnsemblQuery(json, species) {
  const suffixSplit = json.canonical_transcript.split(".");

  return new URLSearchParams({
    ...ensemblDefaults,
    ...{
      g: json.id,
      t: suffixSplit[0],
      r: `${json.seq_region_name}:${json.start}-${json.end}`,
      name: `${species}_${suffixSplit[0]}_${suffixSplit[1]}_sequence`,
    },
  });
}

const rwhitespace = /\s+/g;

export async function getSequence(req, res) {
  const { gene } = req.query;
  const species = req.query.species.replace(rwhitespace, "_");
  const seqInfoResponse = await fetch(
    `https://rest.ensembl.org/lookup/symbol/${species}/${gene}?content-type=application/json`
  );

  if (!seqInfoResponse.ok) {
    return res.status(404).end();
  }

  const seqResponse = await fetch(
    `https://www.ensembl.org/${species}/DataExport/Output`,
    {
      method: "POST",
      body: buildEnsemblQuery(await seqInfoResponse.json(), species),
    }
  );

  res.json({ sequence: await seqResponse.text() });
}

export async function getTaxon(req, res) {
  const { search } = req.query;
  const response = await fetch(
    `https://rest.ensembl.org/taxonomy/name/${search}%25?content-type=application/json`
  );

  if (!response.ok) {
    return res.status(404).end();
  }

  res.json(
    (await response.json())
      .map((taxon) => {
        return { id: taxon.id, scientific_name: taxon.scientific_name };
      })
      .sort((a, b) => a.scientific_name.length - b.scientific_name.length)
  );
}
