import express from "express";
import * as blastController from "../controllers/blast-controller.js";

const router = express.Router();

router
  .route("/blast/search")
  .post(blastController.initSearch)
  .get(blastController.getPrimers);

export default router;
