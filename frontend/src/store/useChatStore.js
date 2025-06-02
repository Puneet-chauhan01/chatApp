// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// export const useChatStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },
//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();

//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData)
//       set({ messages: [...messages, res.data] })
//     } catch (error) {
//       toast.error(error.response.data.message);

//     }
//   },

//   subscribeToMessages: () => {
//     const { selectedUser } = get();
//     if (!selectedUser) return;

//     const socket = useAuthStore.getState().socket;

//     socket.on("newMessage", (newMessage) => {
//       const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
//       if (!isMessageSentFromSelectedUser) return;

//       set({
//         messages: [...get().messages, newMessage],
//       });
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     socket.off("newMessage");
//   },

//   setSelectedUser: (selectedUser) => set({ selectedUser }),
// }));

// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────
  users: [],           // all other users (contacts)
  groups: [],          // all groups current user belongs to
  selectedChat: null,  // { type: "user" | "group", data: <object> }
  messages: [],        // messages for the currently selected chat

  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,

  _messageHandler: null, // internal: reference to current socket handler

  // ─── Fetch Contacts ────────────────────────────────────────────
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ─── Fetch Groups ──────────────────────────────────────────────
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // ─── Select a Chat (User or Group) ────────────────────────────
  setSelectedChat: (type, data) => {
    if (type === null) {
      set({ selectedChat: null, messages: [] });
      return;
    }
    // type: "user" or "group", data: userObj or groupObj
    set({ selectedChat: { type, data }, messages: [] });
    get().fetchMessages(type, data._id);
    get().unsubscribeFromMessages();
    get().subscribeToMessages();
  },

  // ─── Fetch Messages for Selected Chat ─────────────────────────
  fetchMessages: async (type, id) => {
    set({ isMessagesLoading: true });
    try {
      const isGroup = type === "group";
      const res = await axiosInstance.get(`/messages/${id}?isGroup=${isGroup}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ─── Send a Message to the Selected Chat ──────────────────────
  sendMessage: async ({ text, image }) => {
    const { selectedChat, messages } = get();
    if (!selectedChat) return;

    const { type, data } = selectedChat;
    const id = data._id;          // user‐id or group‐id
    const isGroup = type === "group";
    const selfId = useAuthStore.getState().authUser?._id;

    // 1) Pre‐check on the client: if group, does the local data.members still include us?
    if (isGroup) {
      if (
        !Array.isArray(data.members) ||
        !data.members.some((m) => m._id === selfId)
      ) {
        toast.error("You are no longer in that group.");
        // Deselect the chat so UI goes back to “no chat selected”
        set({ selectedChat: null, messages: [] });
        // Also refresh sidebar’s group list
        useGroupStore.getState().getGroups();
        return;
      }
    }

    // 2) If that passed, fire off the POST
    try {
      const res = await axiosInstance.post(`/messages/send/${id}`, {
        text,
        image,
        isGroup,
      });
      // Append the newly returned message to our local state
      set({ messages: [...messages, res.data] });
    } catch (error) {
      // 3) If server responded 403 for group sending, it means server‐side membership was revoked
      if (isGroup && error.response?.status === 403) {
        toast.error(error.response.data.message || "You were removed from that group.");
        set({ selectedChat: null, messages: [] });
        useGroupStore.getState().fetchGroups();
        return;
      }

      // toast.error(error.response?.data?.message || "Failed to send message");
    }
  },


  // ─── Subscribe to Real‐Time Messages via Socket.IO ─────────────
  subscribeToMessages: () => {
    const { selectedChat } = get();
    const socket = useAuthStore.getState().socket;
    if (!selectedChat || !socket) return;

    const chatId = selectedChat.data._id;
    const eventName = selectedChat.type === "group" ? "newGroupMessage" : "newMessage";

    const handler = (incoming) => {
      // ── A) Deduplicate by _id: if this message is already in state, skip it
      const exists = get().messages.some((m) => m._id === incoming._id);
      if (exists) {
        return;
      }

      // ── B) If group chat, only accept if incoming.groupId matches this chat
      if (
        selectedChat.type === "group" &&
        incoming.groupId !== chatId
      ) {
        return;
      }

      // ── C) If 1-1 chat, only accept if incoming.senderId === the other user’s ID
      if (
        selectedChat.type === "user" &&
        incoming.senderId !== chatId
      ) {
        return;
      }

      // ── D) Passed all checks → append to state
      set((state) => ({
        messages: [...state.messages, incoming],
      }));
    };


    socket.on(eventName, handler);
    set({ _messageHandler: handler });
  },

  // ─── Unsubscribe from Socket.IO Events ─────────────────────────
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedChat, _messageHandler } = get();
    if (!selectedChat || !socket || !_messageHandler) return;

    const eventName = selectedChat.type === "group" ? "newGroupMessage" : "newMessage";
    socket.off(eventName, _messageHandler);
    set({ _messageHandler: null });
  },
}));
