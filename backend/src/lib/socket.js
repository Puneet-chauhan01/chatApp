// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import exp from "constants";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173"],
//   },
// });

// export function getRecieverSocketId(userId) {
//   return userSocketMap[userId];
// }
// const userSocketMap = {};//{userId:socketId}


// io.on("connection", (socket) => {
//     console.log("A user connected", socket.id);
//     const userId = socket.handshake.query.userId;
//     if(userId) userSocketMap[userId]=socket.id;

//     io.emit("getOnlineUsers", Object.keys(userSocketMap));

//     socket.on("disconnect", () => {
//         console.log("user disconnected", socket.id);
//         delete userSocketMap[userId];
//         io.emit("getOnlineUsers", Object.keys(userSocketMap));

//         console.log("userSocketMap",userSocketMap);
//     });

//     socket.on("error", (err) => {
//       console.error(`Socket error on ${socket.id}:`, err);
//   });
// });
// lib/socket.js

import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import cookie from "cookie"; // Needed to parse the raw cookie header
import Group from "../models/group.model.js"; // Assuming you have a Group model
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true, // allows the browser to send the HTTP-only cookie
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
