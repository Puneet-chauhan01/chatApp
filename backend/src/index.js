// import express from "express";
// import dotenv from "dotenv"
// import {connectDB} from "./lib/db.js"
// import authRoutes from "./routes/auth.route.js"
// import cookieParser from "cookie-parser"
// import messageRoutes from "./routes/message.route.js"
// import cors from"cors"
// import { app,server } from "./lib/socket.js";
// import path from "path";
// import groupRoutes from "./routes/group.route.js"; // ✅ Add this line



// dotenv.config();
// const PORT = process.env.PORT
// const __dirname = path.resolve();


// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({
//     origin:"http://localhost:5173",
//     credentials:true
// }));
// app.use("/api/auth",authRoutes)
// app.use("/api/messages",messageRoutes);
// app.use("/api/group", groupRoutes);


// if(process.env.NODE_ENV === "production"){
//     app.use(express.static(path.join(__dirname,"../frontend/dist")))
//     app.get("*",(req,res)=>{
//         res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//     })
// }

// server.listen(PORT,()=>{
//     console.log("server running in port PORT:"+PORT)
//     connectDB()
// })


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


dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

socketApp.use(express.json());
socketApp.use(cookieParser());
socketApp.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// API routes
socketApp.use("/api/auth", authRoutes);
socketApp.use("/api/messages", messageRoutes);
socketApp.use("/api/groups", groupRoutes);

// Serve frontend in production
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