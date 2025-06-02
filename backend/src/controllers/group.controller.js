// src/controllers/group.controller.js

import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId, io } from "../lib/socket.js";

/**
 * GET /api/groups
 * Get groups the user is part of
 */
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("getUserGroups error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/groups
 * Create a new group (creator becomes first admin)
 */
export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    let memberIdsRaw = req.body.memberIds;

    // 1) Parse memberIds from string to array
    let memberIds;
    try {
      memberIds = JSON.parse(memberIdsRaw);
    } catch {
      return res.status(400).json({ message: "memberIds must be a JSON array" });
    }

    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Name and memberIds are required" });
    }

    // 2) Handle optional group picture
    let groupPic = "";
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResp = await cloudinary.uploader.upload(fileStr);
      groupPic = uploadResp.secure_url;
    }

    // 3) Create the group document (creator automatically added to members + admins)
    const group = await Group.create({
      name,
      members: [req.user._id, ...memberIds],
      admins: [req.user._id],       // ← creator is first admin
      groupPic,
      createdBy: req.user._id,
    });

    // 4) Add this new group ID to each user’s `groups` array
    await User.updateMany(
      { _id: { $in: group.members } },
      { $addToSet: { groups: group._id } }
    );

    // 5) Populate before sending back
    const populated = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    res.status(201).json(populated);
  } catch (error) {
    console.error("createGroup error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/groups/:groupId/add
 * Add members to a group (admin only)
 */
export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newMemberIds } = req.body;
    if (!Array.isArray(newMemberIds)) {
      return res.status(400).json({ message: "newMemberIds must be an array" });
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: newMemberIds } } },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Update each new user's `groups` array
    await User.updateMany(
      { _id: { $in: newMemberIds } },
      { $addToSet: { groups: group._id } }
    );

    // Return updated group with populated member/admin info
    const updatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("addMembers error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/groups/:groupId/:userId
 * Remove a member from group (admin only)
 */
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // 1) Pull “userId” out of group.members
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId, admins: userId } }, // also remove from admins if present
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });

    // 2) Pull the group ID from that user’s `groups[]`
    await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

    // 3) Re‐populate before returning
    const updatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    // 4) Notify the removed user’s socket that they were kicked
    const kickedSocketId = getRecieverSocketId(userId.toString());
    if (kickedSocketId) {
      io.to(kickedSocketId).emit("removedFromGroup", { groupId });
    }

    // 5) Return the updated group to the admin who made the call
    return res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("removeMember error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/groups/:groupId/rename
 * Rename group (admin only)
 */
export const renameGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const group = await Group.findByIdAndUpdate(
      groupId,
      { name },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("renameGroup error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/groups/:groupId/update-pic
 * Update a group’s picture (admin only)
 */
export const updateGroupPic = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "groupPic file is required" });
    }

    // 1) Upload new image to Cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;
    const uploadResp = await cloudinary.uploader.upload(fileStr);
    const newPicUrl = uploadResp.secure_url;

    // 2) Update DB
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { groupPic: newPicUrl },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("updateGroupPic error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/groups/:groupId
 * Delete a group and its messages (admin only)
 */
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Delete related messages
    await Message.deleteMany({ groupId });

    // Pull group ID out of every user’s `groups` array
    await User.updateMany({ groups: group._id }, { $pull: { groups: group._id } });

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    console.error("deleteGroup error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/groups/:groupId/admins/add
 * Promote a member to admin (admin only)
 */
export const addAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToMakeAdmin } = req.body;

    // 1) Ensure the user is already a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.map((m) => m.toString()).includes(userIdToMakeAdmin)) {
      return res.status(400).json({ message: "User must be a member first" });
    }

    // 2) Add to admins array if not already present
    if (!group.admins.map((a) => a.toString()).includes(userIdToMakeAdmin)) {
      group.admins.push(userIdToMakeAdmin);
      await group.save();
    }

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("addAdmin error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/groups/:groupId/admins/remove
 * Demote an admin back to normal member (admin only)
 */
export const removeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToRemoveAdmin } = req.body;

    // 1) Remove from admins array
    const updated = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { admins: userIdToRemoveAdmin } },
      { new: true }
    )
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName");

    if (!updated) return res.status(404).json({ message: "Group not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("removeAdmin error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
