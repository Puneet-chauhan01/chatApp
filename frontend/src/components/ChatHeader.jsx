
// src/components/ChatHeader.jsx
import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import AddMembersModal from "./modals/AddMembersModal";
import GroupProfileModal from "./modals/GroupProfileModal";
import { ArrowLeft } from "lucide-react";
const ChatHeader = () => {
  const { onlineUsers, authUser } = useAuthStore();
  const { selectedChat, setSelectedChat } = useChatStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

if (!selectedChat || !selectedChat.data) return null;

  const { type, data } = selectedChat;
  console.log("ChatHeader rendering", selectedChat);

  // Now check whether current user is in data.admins
  const isGroupAdmin =
    type === "group" &&
    Array.isArray(data.admins) &&
    data.admins.some((adm) => adm._id === authUser._id);

  const handleAvatarClick = () => {
    if (type === "group") {
      setIsProfileModalOpen(true);
    }
  };
  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <button
            onClick={handleBack}
            className="lg:hidden btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft size={18} />
          </button>
        {/* Left side: avatar + name (clicking avatar opens the “GroupProfileModal”) */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {type === "user" ? (
                <img src={data?.profilePic || "/avatar.png"} alt={data?.fullName} />
              ) : data?.groupPic ? (
                <img src={data.groupPic} alt={data.name} />
              ) : (
                <div className="size-10 bg-primary text-primary-content rounded-full flex items-center justify-center">
                  {data?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium">{type === "user" ? data.fullName : data.name}</h3>
            <p className="text-sm text-base-content/70">
              {type === "user"
                ? onlineUsers.includes(data._id)
                  ? "Online"
                  : "Offline"
                : `${data.members.length} members`}
            </p>
          </div>
        </div>

        {/* Right side: show “Add Members” button only if current user is an admin */}
        <div className="flex items-center gap-2">
          {isGroupAdmin && type === "group" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-sm btn-outline"
              title="Add Members"
            >
              <UserPlus size={18} />
            </button>
          )}
          <button onClick={() => setSelectedChat(null)} className="btn btn-sm btn-ghost">
            <X />
          </button>
        </div>
      </div>

      {/*  “AddMembersModal” (only if group and admin) */}
      {type === "group" && isGroupAdmin && (
        <AddMembersModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          group={data}
        />
      )}

      {/*  “GroupProfileModal” opens whenever user clicks the avatar */}
      {type === "group" && (
        <GroupProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          group={data}
        />
      )}
    </div>
  );
};

export default ChatHeader;
