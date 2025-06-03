// backend/controllers/call.controller.js
import Call from "../models/call.model.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";

/**
 * GET /api/calls/history
 * Get call history for the authenticated user
 */
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type = 'all' } = req.query;
    
    // Build query filter
    const filter = {
      participants: userId,
      status: { $in: ['ended', 'missed', 'rejected'] } // Only completed calls
    };
    
    if (type !== 'all') {
      filter.callType = type; // 'audio' or 'video'
    }
    
    const calls = await Call.find(filter)
      .populate('participants', 'fullName profilePic')
      .populate('groupId', 'name groupPic')
      .populate('initiatedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Call.countDocuments(filter);
    
    res.status(200).json({
      calls,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total
      }
    });
  } catch (error) {
    console.error("getCallHistory error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/calls/recent
 * Get recent calls (last 24 hours)
 */
export const getRecentCalls = async (req, res) => {
  try {
    const userId = req.user._id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentCalls = await Call.find({
      participants: userId,
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate('participants', 'fullName profilePic')
      .populate('groupId', 'name groupPic')
      .populate('initiatedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json(recentCalls);
  } catch (error) {
    console.error("getRecentCalls error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/calls/initiate
 * Create a new call record when call is initiated
 */
export const initiateCall = async (req, res) => {
  try {
    const { callId, targetUserId, callType, isGroup, groupId } = req.body;
    const initiatedBy = req.user._id;
    
    let participants = [initiatedBy];
    
    if (isGroup) {
      // Get all group members
      const group = await Group.findById(groupId).populate('members');
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      participants = group.members.map(m => m._id);
    } else {
      participants.push(targetUserId);
    }
    
    const callRecord = await Call.create({
      callId,
      participants,
      callType,
      isGroup,
      groupId: isGroup ? groupId : undefined,
      initiatedBy,
      status: "initiated"
    });
    
    res.status(201).json(callRecord);
  } catch (error) {
    console.error("initiateCall error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/calls/:callId/status
 * Update call status (connecting, active, ended, etc.)
 */
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, endReason } = req.body;
    
    const updateData = { status };
    
    if (status === 'active' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    
    if (status === 'ended') {
      updateData.endedAt = new Date();
      if (endReason) updateData.endReason = endReason;
      
      // Calculate duration if call was active
      const existingCall = await Call.findOne({ callId });
      if (existingCall && existingCall.startedAt) {
        updateData.duration = Math.floor((updateData.endedAt - existingCall.startedAt) / 1000);
      }
    }
    
    const updatedCall = await Call.findOneAndUpdate(
      { callId },
      updateData,
      { new: true }
    ).populate('participants', 'fullName profilePic');
    
    if (!updatedCall) {
      return res.status(404).json({ message: "Call not found" });
    }
    
    res.status(200).json(updatedCall);
  } catch (error) {
    console.error("updateCallStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/calls/:callId
 * Delete a call record (admin only or call participant)
 */
export const deleteCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;
    
    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }
    
    // Check if user is a participant
    const isParticipant = call.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await Call.findOneAndDelete({ callId });
    res.status(200).json({ message: "Call deleted successfully" });
  } catch (error) {
    console.error("deleteCall error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
