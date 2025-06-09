
// src/components/ChatContainer.jsx
import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageInput from "./MessageInput";
import NoChatSelected from "./NochatSelected";

const ChatContainer = () => {
  const { authUser } = useAuthStore();
  const {
    messages,
    fetchMessages,
    isMessagesLoading,
    selectedChat,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const messageEndRef = useRef(null);

  // Whenever selectedChat changes, fetch its messages and (re)subscribe
  useEffect(() => {
    if (!selectedChat) return;
    const { type, data } = selectedChat;
    fetchMessages(type, data._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedChat?.data?._id,
    selectedChat?.type,
    fetchMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // Scroll to bottom whenever `messages` changes
  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedChat) return <NoChatSelected />;

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedChat) return <NoChatSelected />;

  const { type, data } = selectedChat; // data = user object or group object

  return (
    <div className="flex-1 flex flex-col h-full overflow-auto md:overflow-hidden ">
      {/* Sticky header pushed below the 4rem-tall navbar */}
      <div>
        <ChatHeader />
      </div>
      <div className="flex-1 space-y-4 md:overflow-y-auto">
        {messages.map((message) => {
          // Determine avatar URL:
          let avatarUrl;
          if (message.senderId === authUser._id) {
            avatarUrl = authUser.profilePic || "/avatar.png";
          } else if (type === "user") {
            // one-to-one chat: data is the other user
            avatarUrl = data?.profilePic || "/avatar.png";
          } else {
            // group chat: data.members must be populated (each member has fullName+profilePic)
            const senderObj = data?.members?.find((m) => m._id === message.senderId);
            avatarUrl = senderObj?.profilePic || "/avatar.png";
          }

          return (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img src={avatarUrl} alt="profile pic" />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {new Date(message.createdAt).toLocaleString()}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>

          );
        })}
      </div>
      <MessageInput isGroup={selectedChat.type === "group"} />
    </div>
  );
};

export default ChatContainer;
