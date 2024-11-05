import * as path from "path";

export const getIndex = (req, res) =>
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "client", "index.html")
  );

export const getNotFound = (req, res) => res.status(404).end();
