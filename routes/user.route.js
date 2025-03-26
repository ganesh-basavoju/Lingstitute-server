import express from "express";
import {registerForSeat, getUserProfile, updateUserProfile} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { Uploadmiddleware } from "../middleware/Imageuploader.js";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });


const router=express.Router();


router.post("/profile/update",protectRoute,upload.single("image"),Uploadmiddleware,updateUserProfile);
router.post("/registration", registerForSeat);
router.get("/profile",protectRoute, getUserProfile);
router.put("/profile/update",protectRoute, updateUserProfile);

export default router;