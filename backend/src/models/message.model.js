// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//     {
//         senderId:{
//             type:mongoose.Schema.Types.ObjectId,
//             ref:"User",
//             required:true,
//         },
//         recieverId:{
//             type:mongoose.Schema.Types.ObjectId,
//             ref:"User",
//             required:true,
//         },
//         text:{
//             type:String,
//         },image:{
//             type:String,
//         }
        
//     },{timestamps:true}
// );

// const Message = mongoose.model("Message",messageSchema)
// export default Message;

// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For direct 1-to-1 messages
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // For group messages
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
