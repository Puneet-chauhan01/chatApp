
// // src/components/ChatHeader.jsx
// import React, { useState } from "react";
// import { X, UserPlus, ArrowLeft, Info, PhoneCall } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
// import { useChatStore } from "../store/useChatStore";
// import AddMembersModal from "./modals/AddMembersModal";
// import GroupProfileModal from "./modals/GroupProfileModal";
// import CallButton from "./CallButton";
// import { useCallStore } from "../store/useCallStore";// import { useCallStore } from "../store/useCallStore"; // Uncomment if you need call functionality
// // import axiosInstance from "../utils/axiosInstance"; // Uncomment if you need axios functionality
// // import { useCallHistoryStore } from "../store/useCallHistoryStore"; // Uncomment if you need call history functionality
// // import { useWebRTC } from "../hooks/useWebRTC"; // Uncomment if you need WebRTC functionality

// const ChatHeader = () => {
//   const { onlineUsers, authUser } = useAuthStore();
//   const { selectedChat, setSelectedChat } = useChatStore();
//   const { initiateCall } = useCallStore();

//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
//   if (!selectedChat || !selectedChat.data) return null;

//   const { type, data } = selectedChat;
//   console.log("ChatHeader rendering", selectedChat);
//   const canCallUser =
//     +    type === "user" && onlineUsers.includes(data._id);
//   // Now check whether current user is in data.admins
//   const isGroupAdmin =
//     type === "group" &&
//     Array.isArray(data.admins) &&
//     data.admins.some((adm) => adm._id === authUser._id);

//   const handleAvatarClick = () => {
//     if (type === "group") {
//       setIsProfileModalOpen(true);
//     }
//   };
//   const handleBack = () => {
//     setSelectedChat(null);
//   };

//   return (
//     <div className="p-2.5 border-b border-base-300">
//       <div className="flex items-center justify-between">
//         <button
//           onClick={handleBack}
//           className="lg:hidden btn btn-ghost btn-sm btn-circle"
//         >
//           <ArrowLeft size={18} />
//         </button>
//         {/* Left side: avatar + name (clicking avatar opens the “GroupProfileModal”) */}
//         <div
//           className="flex items-center gap-3 cursor-pointer"
//           onClick={handleAvatarClick}>
//           <div className="avatar">
//             <div className="size-10 rounded-full relative">
//               {type === "user" ? (
//                 <img src={data?.profilePic || "/avatar.png"} alt={data?.fullName} />
//               ) : data?.groupPic ? (
//                 <img src={data.groupPic} alt={data.name} />
//               ) : (
//                 <div className="size-10 bg-primary text-primary-content rounded-full flex items-center justify-center">
//                   {data?.name?.charAt(0).toUpperCase() || "?"}
//                 </div>
//               )}
//             </div>
//           </div>


//           {/* Actions - Add CallButton */}

//           <div>
//             <h3 className="font-medium">{type === "user" ? data.fullName : data.name}</h3>
//             <p className="text-sm text-base-content/70">
//               {type === "user"
//                 ? onlineUsers.includes(data._id)
//                   ? "Online"
//                   : "Offline"
//                 : `${data.members.length} members`}
//             </p>
//           </div>

//         </div>

//         {/* Right side: show “Add Members” button only if current user is an admin */}
//         <div className="flex items-center gap-2">
//           <div className="flex items-center space-x-1">
//             <CallButton />
//             <button className="btn btn-ghost btn-sm btn-circle lg:btn-md">
//               <Info size={16} className="lg:w-5 lg:h-5" />
//             </button>
//           </div>
//           {isGroupAdmin && type === "group" && (
//             <button
//               onClick={() => setIsAddModalOpen(true)}
//               className="btn btn-sm btn-outline"
//               title="Add Members"
//             >
//               <UserPlus size={18} />
//             </button>
//           )}
//           <button onClick={() => setSelectedChat(null)} className="btn btn-sm btn-ghost">
//             <X />
//           </button>
//         </div>
//       </div>

//       {/*  “AddMembersModal” (only if group and admin) */}
//       {type === "group" && isGroupAdmin && (
//         <AddMembersModal
//           isOpen={isAddModalOpen}
//           onClose={() => setIsAddModalOpen(false)}
//           group={data}
//         />
//       )}

//       {/*  “GroupProfileModal” opens whenever user clicks the avatar */}
//       {type === "group" && (
//         <GroupProfileModal
//           isOpen={isProfileModalOpen}
//           onClose={() => setIsProfileModalOpen(false)}
//           group={data}
//         />
//       )}
//     </div>
//   );
// };

// export default ChatHeader;


// src/components/ChatHeader.jsx
import React, { useState } from "react"
import {
  X,
  UserPlus,
  ArrowLeft,
  Info,
  PhoneCall
} from "lucide-react"
import { useAuthStore } from "../store/useAuthStore"
import { useChatStore } from "../store/useChatStore"
import { useCallStore } from "../store/useCallStore"
import AddMembersModal from "./modals/AddMembersModal"
import GroupProfileModal from "./modals/GroupProfileModal"

const ChatHeader = () => {
  const { onlineUsers, authUser }           = useAuthStore()
  const { selectedChat, setSelectedChat }   = useChatStore()
  const { initiateCall }                    = useCallStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  if (!selectedChat?.data) return null
  const { type, data } = selectedChat

  // Only allow 1:1 calls when the other user is online
  const canCallUser = type === "user" && onlineUsers.includes(data._id)

  // Group admin check
  const isGroupAdmin =
    type === "group" &&
    Array.isArray(data.admins) &&
    data.admins.some((adm) => adm._id === authUser._id)

  // Navigate back to chat list
  const handleBack = () => setSelectedChat(null)

  // Trigger call initiation
  const handleCallClick = () => {
    const callId = `call_${Date.now()}`
    initiateCall({
      callId,
      callerName:  authUser.fullName,
      targetUserId: type === "user" ? data._id : undefined,
      callType:     "video",
      isGroup:      type === "group",
      groupId:      type === "group" ? data._id : undefined
    })
  }

  // Open group profile modal
  const handleAvatarClick = () => {
    if (type === "group") setIsProfileModalOpen(true)
  }

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        {/* Mobile “back” button */}
        <button
          onClick={handleBack}
          className="lg:hidden btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft size={18}/>
        </button>

        {/* Avatar + Chat title */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div className="avatar">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {type === "user" ? (
                <img src={data.profilePic || "/avatar.png"} alt={data.fullName}/>
              ) : data.groupPic ? (
                <img src={data.groupPic} alt={data.name}/>
              ) : (
                <div className="w-10 h-10 bg-primary text-primary-content flex items-center justify-center text-xl">
                  {data.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium">
              {type === "user" ? data.fullName : data.name}
            </h3>
            <p className="text-sm text-base-content/70">
              {type === "user"
                ? canCallUser ? "Online" : "Offline"
                : `${data.members.length} members`}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1">
            {/* Call button */}
            {type === "user" && (
              <button
                onClick={handleCallClick}
                disabled={!canCallUser}
                className={`btn btn-ghost btn-circle btn-sm ${
                  !canCallUser
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-base-200"
                }`}
                title={canCallUser ? "Call user" : "User is offline"}
              >
                <PhoneCall size={20}/>
              </button>
            )}
            {type === "group" && (
              <button
                onClick={handleCallClick}
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                title="Start group call"
              >
                <PhoneCall size={20}/>
              </button>
            )}

            {/* Info button */}
            <button className="btn btn-ghost btn-sm btn-circle lg:btn-md">
              <Info size={16}/>
            </button>
          </div>

          {/* Add members (groups only, admins only) */}
          {isGroupAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-sm btn-outline"
              title="Add Members"
            >
              <UserPlus size={18}/>
            </button>
          )}

          {/* Close chat */}
          <button
            onClick={handleBack}
            className="btn btn-sm btn-ghost"
            title="Close chat"
          >
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Group-only modals */}
      {type === "group" && isGroupAdmin && (
        <AddMembersModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          group={data}
        />
      )}
      {type === "group" && (
        <GroupProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          group={data}
        />
      )}
    </div>
  )
}

export default ChatHeader
