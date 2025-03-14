import express from "express";
import multer from "multer";
import { uploadToDrive } from "../lib/pdfupload.js";
import { adminLogin, adminSignup, scheduleClass, deleteClass, joinStudent_into_batch, Video_Uploader, fetchAllUsers, deleteFile, uploadPdf} from "../controllers/admin.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router=express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, 
});

router.post("/upload-drive", adminAuth, upload.single("file"), uploadToDrive);
router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.post("/schedule", adminAuth, scheduleClass);
router.delete("/delete/:id", adminAuth, deleteClass);
router.post("/upload-pdf", adminAuth,uploadPdf);
router.delete("/delete-file", adminAuth,deleteFile);
router.get("/fetch-users", adminAuth,fetchAllUsers);
router.post("/create-batch", adminAuth,joinStudent_into_batch);
router.post("/video-upload", adminAuth, Video_Uploader);


export default router;