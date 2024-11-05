import * as db from "../utils/db.js";
import { buildEnsemblQuery } from "../utils/ensembl.js";

const rwhitespace = /\s+/g;

export const getSequence = async (req, res) => {
  const { gene } = req.query;
  const species = req.query.species.replace(rwhitespace, "_");
  const id = `${gene}/${species}`;
  const cache = await db.get("SELECT data FROM sequence WHERE id = ?;", [id]);

  if (cache) {
    return res.json(JSON.parse(cache.data));
  }

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

  const data = { sequence: await seqResponse.text() };

  res.json(data);
  db.run("INSERT INTO sequence VALUES (?, ?);", [id, JSON.stringify(data)]);
};

export const getTaxon = async (req, res) => {
  const { search } = req.query;
  const cache = await db.get("SELECT data FROM taxon WHERE id = ?;", [search]);

  if (cache) {
    return res.json(JSON.parse(cache.data));
  }

  const response = await fetch(
    `https://rest.ensembl.org/taxonomy/name/${search}%25?content-type=application/json`
  );

  if (!response.ok) {
    return res.status(404).end();
  }

  const data = (await response.json())
    .map((taxon) => ({ id: taxon.id, scientific_name: taxon.scientific_name }))
    .sort((a, b) => a.scientific_name.length - b.scientific_name.length);

  res.json(data);
  db.run("INSERT INTO taxon VALUES (?, ?);", [search, JSON.stringify(data)]);
};
