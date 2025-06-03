

import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app as socketApp, server as socketServer } from "./lib/socket.js";
import path from "path";
import callRoutes from "./routes/call.route.js";
dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

socketApp.use(express.json());
socketApp.use(cookieParser());
socketApp.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? true  // Allow same origin requests in production
    : "http://localhost:5173",
  credentials: true,
}));

// API routes
socketApp.use("/api/auth", authRoutes);
socketApp.use("/api/messages", messageRoutes);
socketApp.use("/api/groups", groupRoutes);
socketApp.use("/api/calls", callRoutes);


if (process.env.NODE_ENV === "production") {
  socketApp.use(express.static(path.join(__dirname, "../frontend/dist")));
  socketApp.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

socketServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});