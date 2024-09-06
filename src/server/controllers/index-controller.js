import * as path from "path";

export function getIndex(req, res) {
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "client", "index.html")
  );
}

export function getNotFound(req, res) {
  res.status(404).end();
}
