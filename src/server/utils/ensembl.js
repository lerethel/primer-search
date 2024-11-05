import ensemblDefaults from "../config/ensembl-defaults.js";

export const buildEnsemblQuery = (json, species) => {
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
};
