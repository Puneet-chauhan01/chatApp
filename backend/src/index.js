import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { server as socketServer } from "./lib/socket.js";
import app from "./app.js"; // This ensures routes and middlewares are attached

dotenv.config();
const PORT = process.env.PORT || 5000;

socketServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});