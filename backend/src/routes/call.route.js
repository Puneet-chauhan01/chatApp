// backend/routes/call.routes.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getCallHistory,
  getRecentCalls,
  initiateCall,
  updateCallStatus,
  deleteCall
} from "../controllers/call.controller.js";
import { getAgoraToken } from "../controllers/rtc.controller.js";
const router = express.Router();

// Get call history with pagination
router.get("/history", protectRoute, getCallHistory);

// Get recent calls (last 24 hours)
router.get("/recent", protectRoute, getRecentCalls);

// Create new call record
router.post("/initiate", protectRoute, initiateCall);

// Update call status
router.put("/:callId/status", protectRoute, updateCallStatus);

// Delete call record
router.delete("/:callId", protectRoute, deleteCall);

router.post("/token", protectRoute, getAgoraToken);


export default router;
