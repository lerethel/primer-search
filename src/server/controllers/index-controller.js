import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getIndex(req, res) {
  res.sendFile(path.join(__dirname, "..", "..", "client", "index.html"));
}

export function getNotFound(req, res) {
  res.status(404).end();
}
