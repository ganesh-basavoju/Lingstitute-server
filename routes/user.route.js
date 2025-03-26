import express from "express";
import {registerForSeat, getUserProfile, updateUserProfile} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router=express.Router();


router.post("/registration", registerForSeat);
router.get("/profile",protectRoute, getUserProfile);
router.put("/profile/update",protectRoute, updateUserProfile);

export default router;