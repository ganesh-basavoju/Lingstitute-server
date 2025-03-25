import express from "express";
import multer from "multer";
import { uploadToDrive } from "../lib/pdfupload.js";
import { adminLogin, adminSignup, scheduleClass, deleteClass, joinStudent_into_batch, Video_Uploader, fetchAllUsers, deleteFile, uploadPdf, Create_Batch, Delete_Batch, Update_Batch, Get_All_Batches, Get_All_Schedules, Get_User_By_Mail, Delete_User, Get_Students_By_Batch, Remove_From_Batch} from "../controllers/admin.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router=express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, 
});

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.use(adminAuth);
router.post("/upload-drive", adminAuth, upload.single("file"), uploadToDrive);
router.post("/schedule",scheduleClass);
router.get("/schedule",Get_All_Schedules);
router.delete("/schedule", deleteClass);
router.post("/upload-pdf",upload.single("file"), uploadToDrive,uploadPdf);
router.delete("/delete-file", adminAuth,deleteFile);
router.get("/fetch-users",fetchAllUsers);
router.post("/join-students-to-batch", joinStudent_into_batch);
router.post("/video-upload", Video_Uploader);
router.post("/new-branch",Create_Batch);
router.delete("/delete-batch",Delete_Batch);
router.put("/edit-batchname",Update_Batch);
router.get("/get-branches",Get_All_Batches);
router.get("/get-user-by-mail",Get_User_By_Mail);
router.delete("/delete-user",Delete_User);
//
router.post("/get-students-by-batch",Get_Students_By_Batch);

router.delete("/remove-from-batch",Remove_From_Batch);

export default router;