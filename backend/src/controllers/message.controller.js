import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId, io } from "../lib/socket.js";
import Group from "../models/group.model.js";

export const getUsersForSideBar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("error in getUsersSideBar controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch messages (1-1 or group)
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { isGroup } = req.query;
    const myId = req.user._id;
    let messages;

    if (isGroup === "true") {
      messages = await Message.find({ groupId: id }).sort("createdAt");
    } else {
      messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: id },
          { senderId: id, receiverId: myId },
        ],
      }).sort("createdAt");
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send message (1-1 or group)
export const sendMessage = async (req, res) => {
  try {
    const { text, image, isGroup = false } = req.body;
    const senderId = req.user._id;
    let imageUrl;

    if (image) {
      const uploadResp = await cloudinary.uploader.upload(image);
      imageUrl = uploadResp.secure_url;
    }

    const payload = { senderId, text };
    const targetId = req.params.id;

    if (isGroup) {
      // ─── ① Verify “senderId” is still a member of that group ──────────
      const group = await Group.findById(targetId).select("members");
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      // If user is no longer in group.members → block
      if (!group.members.map((m) => m.toString()).includes(senderId.toString())) {
        return res.status(403).json({ message: "You are no longer in that group." });
      }
      payload.groupId = targetId;
    } else {
      payload.receiverId = targetId;
    }

    const newMessage = await Message.create(payload);

    // ─── ② Emit via Socket.IO ─────────────────────────────────────
    if (isGroup) {
      io.to(targetId).emit("newGroupMessage", newMessage);
    } else {
      const recSocketId = getRecieverSocketId(targetId);
      if (recSocketId) {
        io.to(recSocketId).emit("newMessage", newMessage);
      }
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// export const getMessages = async (req, res) => {
//     try {
//         const { id: userToChatId } = req.params
//         const myId = req.user._id;

//         const messages = await Message.find({
//             $or: [
//                 { senderId: myId, recieverId: userToChatId },
//                 { senderId: userToChatId, recieverId: myId },
//             ]
//         })
//         res.status(200).json(messages)
//     } catch (error) {
//         console.log("error in geMessages controller", error.message);
//         res.status(500).json({ message: "Internal server error" });

//     }
// };


// export const sendMessage = async (req, res) => {
//     try {
//         const { text, image } = req.body;
//         const { id: recieverId } = req.params;
//         const senderId = req.user._id;
//         let imageUrl;
//         if (image) {
//             //uplad base64 image to clooudinary
//             const uploadResponse = await cloudinary.uploader.upload(image);
//             imageUrl = uploadResponse.secure_url;
//         }
//         const newMessage = new Message({
//             senderId,
//             recieverId,
//             text,
//             image: imageUrl,
//         });
//         await newMessage.save();
//         const recieverSocketId = getRecieverSocketId(recieverId);
//         if(recieverSocketId){
//             io.to(recieverSocketId).emit("newMessage",newMessage);
//         }
//         res.status(201).json(newMessage);
//     } catch (error) {
//         console.log("error in sendMessages controller", error.message);
//         res.status(500).json({ message: "Internal server error" });

//     }


