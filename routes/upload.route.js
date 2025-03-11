import express from "express";
import { upload, uploadFileToDrive } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFileToDrive);

export default router;
