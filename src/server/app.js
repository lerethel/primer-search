import express from "express";
import path from "path";
import blastRouter from "./routes/blast-router.js";
import ensemblRouter from "./routes/ensembl-router.js";
import indexRouter from "./routes/index-router.js";
import * as db from "./utils/db.js";

const port = process.env.PORT || 3000;

const serverReadyMessage =
  "PrimerSearch has been activated. " +
  `Follow this link to use it: http://localhost:${port}/.`;

const closeMessage =
  "\nYou can minimize this window, but DO NOT close it while using the app.";

const app = express();
db.init();

app.use(
  express.static(path.join(import.meta.dirname, "..", "client", "public"))
);
app.use(express.json());
app.use(blastRouter);
app.use(ensemblRouter);
app.use(indexRouter);

app.use((req, res) => res.status(404).end());
app.use((error, req, res) => res.status(500).end());

app.listen(port, () =>
  console.log(
    process.env.SKIP_CLOSE_MESSAGE
      ? serverReadyMessage
      : serverReadyMessage + closeMessage
  )
);
