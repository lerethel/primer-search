import express from "express";
import * as indexController from "../controllers/index-controller.js";

const router = express.Router();

router.get("^/$|/index(.html)?", indexController.getIndex);
router.get("/*", indexController.getNotFound);

export default router;
