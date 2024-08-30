import express from "express";
import * as ensemblController from "../controllers/ensembl-controller.js";

const router = express.Router();

router.get("/ensembl/sequence", ensemblController.getSequence);
router.get("/ensembl/taxon", ensemblController.getTaxon);

export default router;
