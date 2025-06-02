// src/middleware/groupAdmin.middleware.js

import Group from "../models/group.model.js";

export const isGroupAdmin = async (req, res, next) => {
  const groupId = req.params.groupId || req.params.id;
  const userId = req.user._id.toString();

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if current user is listed in admins
    const isAdmin = group.admins
      .map((adm) => adm.toString())
      .includes(userId);

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied: not a group admin" });
    }

    // Attach group document for downstream handlers if needed
    req.group = group;
    next();
  } catch (error) {
    console.error("isGroupAdmin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
