import express from "express";
import { authorizeZoom, zoomCallback, createMeeting } from '../controllers/zoom.controller.js';

const router = express.Router();

// Step 1: Redirect to Zoom Authorization
router.get('/authorize', authorizeZoom);

// Step 2: Handle OAuth Callback
router.get('/callback', zoomCallback);

// Step 3: Create a Meeting
router.post('/create-meeting', createMeeting);

export default router;