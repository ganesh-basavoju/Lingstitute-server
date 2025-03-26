import express from "express";
import { getDailyNews, getDailyThoughts } from "../controllers/external.controller.js";

const router = express.Router();

router.get("/news", getDailyNews);
router.get("/thoughts", getDailyThoughts);

export default router;
