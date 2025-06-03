
// lib/socket.js

import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import cookie from "cookie"; // Needed to parse the raw cookie header
import Group from "../models/group.model.js"; // Assuming you have a Group model
import Call from "../models/call.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? true  // Allow same origin requests in production
      : ["http://localhost:5173"],
    credentials: true,
  },
});

// In-memory map: { userId: socketId }
const userSocketMap = {};

export function getRecieverSocketId(userId) {
  return userSocketMap[userId];
}

// ── JWT Authentication Middleware for Socket.IO ──
// This will run on each incoming socket connection.
io.use((socket, next) => {
  // 1) Grab the raw Cookie header from the handshake
  const rawCookie = socket.handshake.headers.cookie;
  if (!rawCookie) {
    return next(new Error("Authentication error: no cookie sent"));
  }

  // 2) Parse the rawCookie string into an object, e.g. { jwt: "<token>", ... }
  const parsed = cookie.parse(rawCookie);
  const token = parsed.jwt; // We set this cookie name (“jwt”) in auth.controller
  if (!token) {
    return next(new Error("Authentication error: no token in cookie"));
  }

  // 3) Verify the JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (err) {
    return next(new Error("Authentication error: invalid token"));
  }
});

io.on("connection", (socket) => {
  const { userId } = socket;
  userSocketMap[userId] = socket.id;
  console.log(`✅ User connected: ${userId} (socket ${socket.id})`);

  // Broadcast the updated list of online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ── Group room joining ──
  socket.on("joinGroups", (groupIds) => {
    if (Array.isArray(groupIds)) {
      groupIds.forEach((gid) => socket.join(gid));
      console.log(`🟢 Socket ${socket.id} joined groups:`, groupIds);
    }
  });

  // ── Direct messaging ──
  socket.on("sendMessage", ({ receiverId, message }) => {
    const recSocketId = getRecieverSocketId(receiverId);
    if (recSocketId) {
      io.to(recSocketId).emit("newMessage", message);
    }
  });

  // ── Group messaging ──
  socket.on("sendGroupMessage", async ({ groupId, message }) => {
    // 1) Check if socket.userId is still a member of groupId
    try {
      const group = await Group.findOne({
        _id: groupId,
        members: socket.userId,
      });
      if (!group) {
        // If not a member, silently ignore
        return;
      }
      // 2) Otherwise broadcast to that room
      io.to(groupId).emit("newGroupMessage", message);
    } catch (err) {
      console.error("Error verifying group membership in socket:", err);
      return;
    }
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`🔴 Socket ${socket.id} left group: ${groupId}`);
  });
   socket.on("initiateCall", async ({ targetUserId, callType, isGroup, groupId }) => {
    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create call record in database
      let participants = [userId];
      if (isGroup) {
        const group = await Group.findById(groupId).populate('members');
        participants = group.members.map(m => m._id.toString());
      } else {
        participants.push(targetUserId);
      }
      
      const callRecord = await Call.create({
        callId,
        participants,
        callType,
        isGroup,
        groupId: isGroup ? groupId : undefined,
        initiatedBy: userId,
        status: "initiated"
      });
      
      const callData = {
        callId,
        callerId: userId,
        callerName: socket.userName || "Unknown",
        callType,
        isGroup,
        groupId: isGroup ? groupId : null,
        targetUserId: isGroup ? null : targetUserId
      };

      if (isGroup) {
        socket.to(groupId).emit("incomingCall", callData);
      } else {
        const targetSocketId = getRecieverSocketId(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("incomingCall", callData);
        }
      }
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  });

  socket.on("acceptCall", async ({ callId, targetUserId }) => {
    try {
      // Update call status to connecting
      await Call.findOneAndUpdate(
        { callId },
        { status: "connecting" }
      );
      
      const targetSocketId = getRecieverSocketId(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("callAccepted", { callId, acceptedBy: userId });
      }
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  });

  socket.on("callStarted", async ({ callId }) => {
    try {
      // Update call to active status
      await Call.findOneAndUpdate(
        { callId },
        { 
          status: "active",
          startedAt: new Date()
        }
      );
    } catch (error) {
      console.error("Error updating call to active:", error);
    }
  });

  socket.on("rejectCall", async ({ callId, targetUserId }) => {
    try {
      // Update call status to rejected
      await Call.findOneAndUpdate(
        { callId },
        { 
          status: "rejected",
          endedAt: new Date(),
          endReason: "rejected"
        }
      );
      
      const targetSocketId = getRecieverSocketId(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("callRejected", { callId, rejectedBy: userId });
      }
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  });

  socket.on("endCall", async ({ callId, participants, reason = "completed" }) => {
    try {
      // Update call status to ended with duration
      const call = await Call.findOne({ callId });
      if (call) {
        const endedAt = new Date();
        let duration = 0;
        
        if (call.startedAt) {
          duration = Math.floor((endedAt - call.startedAt) / 1000);
        }
        
        await Call.findOneAndUpdate(
          { callId },
          { 
            status: "ended",
            endedAt,
            duration,
            endReason: reason
          }
        );
      }
      
      // Notify other participants
      participants.forEach(participantId => {
        const socketId = getRecieverSocketId(participantId);
        if (socketId && socketId !== socket.id) {
          io.to(socketId).emit("callEnded", { callId, endedBy: userId });
        }
      });
    } catch (error) {
      console.error("Error ending call:", error);
    }
  });

  // WebRTC signaling
  socket.on("webrtc-offer", ({ offer, targetUserId, callId }) => {
    const targetSocketId = getRecieverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-offer", {
        offer,
        callerId: userId,
        callId
      });
    }
  });

  socket.on("webrtc-answer", ({ answer, targetUserId, callId }) => {
    const targetSocketId = getRecieverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-answer", {
        answer,
        callerId: userId,
        callId
      });
    }
  });

  socket.on("webrtc-ice-candidate", ({ candidate, targetUserId, callId }) => {
    const targetSocketId = getRecieverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", {
        candidate,
        callerId: userId,
        callId
      });
    }
  });


  // ── Disconnection ──
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log(`❌ User disconnected: ${userId} (socket ${socket.id})`);
  });

  socket.on("error", (err) =>
    console.error(`❗ Socket error (${socket.id}):`, err.message)
  );
});

export { io, app, server };

function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}