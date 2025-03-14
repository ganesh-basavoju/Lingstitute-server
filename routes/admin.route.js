import express from "express";
import multer from "multer";
import { uploadToDrive } from "../lib/pdfupload";
const router=express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, 
});

router.post("/upload", upload.single("file"), uploadToDrive);





module.exports=router;