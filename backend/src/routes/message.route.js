// import express from "express"
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { getMessages, getUsersForSideBar, sendMessage } from "../controllers/message.controller.js";
// const router = express.Router();

// router.get("/users",protectRoute,getUsersForSideBar)
// router.get("/:id",protectRoute,getMessages)
// router.post("/send/:id",protectRoute,sendMessage)
// router.get("/group/:id", protectRoute, getMessages); // with ?isGroup=true
// router.post("/group/send/:id", protectRoute, sendMessage); // with isGroup = true in body

// export default router;


import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSideBar, sendMessage } from "../controllers/message.controller.js";
import { isGroupMember } from "../middleware/group.middleware.js";
const router = express.Router();

// Fetch all other users for sidebar
router.get("/users", protectRoute, getUsersForSideBar);

// Fetch direct (1-1) messages by user ID
router.get("/:id", protectRoute, getMessages);

// Send direct (1-1) message by user ID
router.post("/send/:id", protectRoute, sendMessage);

// --- Group chat routes ---
// Fetch group messages by group ID
// (the controller reads ?isGroup=true automatically)
router.get("/group/:id", protectRoute, isGroupMember, getMessages);
router.post("/group/send/:id", protectRoute, isGroupMember, sendMessage);

export default router;
