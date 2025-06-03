// backend/models/call.model.js
import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  callType: { type: String, enum: ["audio", "video"], required: true },
  isGroup: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number }, // in seconds
  status: { 
    type: String, 
    enum: ["initiated", "connecting", "active", "ended", "missed", "rejected"], 
    default: "initiated" 
  },
  endReason: {
    type: String,
    enum: ["completed", "missed", "rejected", "failed", "network_error"],
    default: "completed"
  }
}, { timestamps: true });

// Index for faster queries
callSchema.index({ participants: 1, createdAt: -1 });
callSchema.index({ groupId: 1, createdAt: -1 });

const Call = mongoose.model("Call", callSchema);
export default Call;
