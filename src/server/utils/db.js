import path from "path";
import sqlite3 from "sqlite3";

const open = () => new sqlite3.Database(path.join("cache", "cache.db"));

export const init = () => {
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
        data
    );`,
    () => db.close()
  );
};

export const get = (command, params = []) =>
  new Promise((resolve, reject) => {
    const db = open();

    db.get(command, params, (err, row) => {
      db.close();
      err ? reject(err) : resolve(row);
    });
  });

export const run = (command, params = []) => {
  const db = open();
  db.run(command, params, () => db.close());
};
