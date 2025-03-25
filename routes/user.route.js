import express from "express";
import multer from "multer";
import registerForSeat from "../controllers/user.controller.js";

const router=express.Router();


router.post("/registration", registerForSeat);


export default router;