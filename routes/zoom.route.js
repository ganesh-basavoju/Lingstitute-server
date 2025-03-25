import express from "express";
import {
  authorizeZoom,
  zoomCallback,
  createMeeting,
  checkAuth,
} from "../controllers/zoom.controller.js";

const router = express.Router();

// Step 1: Redirect to Zoom Authorization
router.get("/authorize", authorizeZoom);

// Step 2: Handle OAuth Callback
router.get("/callback", zoomCallback);

// Step 3: Create a Meeting
router.post("/create-meeting", createMeeting);

// Step 4: Check Zoom Authorization
router.get("/check-auth", checkAuth);

export default router;
