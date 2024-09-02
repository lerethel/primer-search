import * as path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function open() {
  return new sqlite3.Database(path.join(__dirname, "..", "cache.db"));
}

export function init() {
  const db = open();

  db.exec(
    `
    CREATE TABLE IF NOT EXISTS taxon (
        id PRIMARY KEY,
        data
    );
    CREATE TABLE IF NOT EXISTS sequence (
        id PRIMARY KEY,
        data
    );
    CREATE TABLE IF NOT EXISTS primer (
        id PRIMARY KEY,
        job_key,
        job_timestamp,
        data
    );`,
    () => db.close()
  );
}

export function get(command, params = []) {
  return new Promise((resolve, reject) => {
    const db = open();

    db.get(command, params, (err, row) => {
      db.close();
      err ? reject(err) : resolve(row);
    });
  });
}

export function run(command, params = []) {
  const db = open();
  db.run(command, params, () => db.close());
}
