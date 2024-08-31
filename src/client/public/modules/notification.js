////////////
/// INFO ///

export const iSequenceAlreadyConverted = "Sequence is already converted.";

export const iExonsNotSeparated =
  "Exons are not separated. Each exon must " +
  "have a title above it beginning with `>`.";

export const iSearchingForSequence = "Searching for sequence...";

export const iRequestBeingProcessed = "Request is being processed...";

///////////////
/// SUCCESS ///

export const sPrimerPairInfoCopied =
  "Primer pair info has been copied to clipboard.";

export const sSequenceDownloaded = "Sequence has been downloaded.";

export const sPrimersDownloaded = "Primers have been downloaded.";

//////////////
/// ERRORS ///

export const eCopiedListEmpty =
  "Copied list of primers is empty. If a max product " +
  "length was specified, then there are no primers " +
  "with a product length shorter than the one specified.";

export const eForwardPrimerNotFound =
  "Forward primer has not been found in sequence. " +
  "Make sure forward primer is correct.";

export const eReversePrimerNotFound =
  "Reverse primer has not been found in sequence. " +
  "Make sure reverse primer is correct and not inverted.";

export const ePrimersOverlap =
  "Forward and reverse primers overlap. " +
  "Make sure both primers are correct and in correct fields.";

export const eReversePrecedesForward =
  "Reverse primer precedes forward primer in sequence. " +
  "Make sure both primers are correct and in correct fields.";

export const eForwardOccursMoreThanOnce =
  "Forward primer occurs more than once in sequence. " +
  "Make sure forward primer is correct.";

export const eReverseOccursMoreThanOnce =
  "Reverse primer occurs more than once in sequence. " +
  "Make sure reverse primer is correct.";

export const eNoProductLength =
  "Product length is not available. " +
  "Make sure both primers are correct and can be found in sequence.";

export const eNoGeneName = "Gene name is not specified.";

export const eSequenceNotFound = "Sequence has not been found on Ensembl.";

export const eSpeciesNotSpecified = "Species is not specified.";

export const eNoSequence = "Sequence is not specified.";

export const eNetworkError =
  "Network error: unable to connect to server. " +
  "Check your internet connection and try again.";

/////////////////////
/// BUTTON TITLES ///

export const tRemovePrimerPair = "Remove primer pair";

export const tMarkPrimerPair = "Mark primer pair in gene sequence";

export const tCopyPairInfo = "Copy primer pair info";
