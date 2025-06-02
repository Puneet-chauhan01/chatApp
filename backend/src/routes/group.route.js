// src/routes/group.routes.js

import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import multer from "multer";
import {
  getUserGroups,
  createGroup,
  addMembers,
  removeMember,
  renameGroup,
  deleteGroup,
  updateGroupPic,
  addAdmin,
  removeAdmin,
} from "../controllers/group.controller.js";
import { isGroupMember } from "../middleware/group.middleware.js";     // existing
import { isGroupAdmin } from "../middleware/groupAdmin.middleware.js"; // new

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get groups the user is part of
router.get("/", protectRoute, getUserGroups);

// Create a new group with optional group picture
router.post("/", protectRoute, upload.single("groupPic"), createGroup);

// Add members (admin only)
router.put("/:groupId/add", protectRoute, isGroupAdmin, addMembers);

// Remove a member (admin only)
router.delete("/:groupId/:userId", protectRoute, isGroupAdmin, removeMember);

// Rename a group (admin only)
router.put("/:groupId/rename", protectRoute, isGroupAdmin, renameGroup);

// Update group picture (admin only)
router.put(
  "/:groupId/update-pic",
  protectRoute,
  isGroupAdmin,
  upload.single("groupPic"),
  updateGroupPic
);

// Delete a group (admin only)
router.delete("/:groupId", protectRoute, isGroupAdmin, deleteGroup);

// Promote a member to admin
router.put("/:groupId/admins/add", protectRoute, isGroupAdmin, addAdmin);

// Demote an admin back to member
router.put("/:groupId/admins/remove", protectRoute, isGroupAdmin, removeAdmin);

export default router;
