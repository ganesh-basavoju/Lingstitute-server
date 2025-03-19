import express from "express";
import { Get_Batch } from "../controllers/batches.controllers.js";
const router=express.Router();

router.get("/get-batch",Get_Batch);




export default router;