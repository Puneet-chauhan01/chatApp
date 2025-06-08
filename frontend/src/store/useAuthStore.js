// import { create } from "zustand"
// import { axiosInstance } from "../lib/axios";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";
// const Base_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api/" : "/";

// export const useAuthStore = create((set, get) => ({
//     authUser: null,
//     isSigningUp: false,
//     isLoggingIn: false,
//     isUpdatingProfile: false,
//     isCheckingAuth: true,
//     onlineUsers: [],
//     socket: null,
//     checkAuth: async () => {
//         try {
//             const res = await axiosInstance.get("auth/check");
//             set({ authUser: res.data })
//             get().connectSocket();

//         } catch (error) {
//             set({ authUser: null });
//             console.log("error in checkauth", error)
//         } finally {
//             set({ isCheckingAuth: false });
//         }
//     },
//     signup: async (data) => {
//         set({ isSigningUp: true });
//         try {
//             // const res = await axiosInstance.post("auth/signup", data);
//             // toast.success("Account created successfully");
//             // set({ authUser: res.data });
//             // get().connectSocket();

//             const res = await axiosInstance.post("auth/signup", data);
//             localStorage.setItem("token", res.data.token); // ✅ Store token
//             set({ authUser: res.data.user }); // adjust if needed
//             toast.success("Account created successfully");
//             get().connectSocket();


//         } catch (error) {
//             toast.error(error.response?.data?.message || "Signup Failed");
//         } finally {
//             set({ isSigningUp: false });
//         }
//     },

//     login: async (data) => {
//         set({ isLoggingIn: true });
//         try {
//             // const res = await axiosInstance.post("auth/login", data);
//             // set({ authUser: res.data });
//             // toast.success("Logged in successfully");
//             // get().connectSocket();

//             const res = await axiosInstance.post("auth/login", data);
//             localStorage.setItem("token", res.data.token); // ✅ Store the token
//             set({ authUser: res.data.user }); // adjust if needed
//             toast.success("Logged in successfully");
//             get().connectSocket();

//         } catch (error) {
//             toast.error(error.response?.data?.message || "Login Failed");
//         } finally {
//             set({ isLoggingIn: false });
//         }
//     },
//     logout: async () => {
//         try {
//             await axiosInstance.post("auth/logout");
//             localStorage.removeItem("token"); // ✅ Remove token on logout
//             set({ authUser: null });
//             toast.success("Logged out successfully");
//             get().disconnectSocket();
//         } catch (error) {
//             toast.error(error.response.data.message);
//         }
//     },
//     updateProfile: async (data) => {
//         set({ isUpdatingProfile: true });
//         try {
//             const res = await axiosInstance.put("/auth/update-profile", data);
//             set((state) => ({
//                 authUser: { ...state.authUser, ...res.data },
//             }));
//             toast.success("Profile updated succesfully");
//         } catch (error) {
//             console.log("error in updateProfile", error);
//             toast.error("error in updateProfile");
//         } finally {
//             set({ isUpdatingProfile: false });
//         }
//     },
//     // connectSocket: () => {
//     //     const { authUser } = get();
//     //     if (!authUser || get().socket?.connected) return;
//     //     const socket = io( Base_URL ,{
//     //         query: {
//     //             userId: authUser._id,
//     //         },
//     //     });
//     //     socket.connect();

//     //     set({ socket: socket });
//     //     socket.on("getOnlineUsers", (userIds) => {
//     //         set({ onlineUsers: userIds });
//     //     });
//     //     console.log("\n onlineussers inside connectsocket",onlineUsers)
//     // },

//     connectSocket: () => {
//         const { authUser } = get();
//         if (!authUser || get().socket?.connected) return;

//         const token = localStorage.getItem("token"); // assuming you store it here
//         if (!token) return;

//         const socket = io(Base_URL, {
//             auth: {
//                 token,
//             },
//         });

//         socket.connect();

//         set({ socket });

//         socket.on("getOnlineUsers", (userIds) => {
//             set({ onlineUsers: userIds });
//             console.log("\n onlineUsers inside connectSocket:", userIds);
//         });

//         socket.on("connect_error", (err) => {
//             console.error("Socket connection error:", err.message);
//         });
//     },

//     disconnectSocket: () => {
//         if (get().socket?.connected) {
//             get().socket.disconnect();
//         }
//     },
// }));
// src/store/useAuthStore.js

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useGroupStore } from "./useGroupStore";
import { useChatStore } from "./useChatStore";
// const SOCKET_URL =
//   import.meta.env.MODE === "development"
//     ? "http://localhost:5001"
//     : "";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;


export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ----------------- CHECK AUTH -----------------
  checkAuth: async () => {
    try {
      // Always call the backend; the server will read the HTTP-only cookie and respond.
      const res = await axiosInstance.get("auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // On error (e.g. no cookie or invalid/expired cookie), we treat as logged out
      set({ authUser: null });
      console.log("❌ error in checkAuth:", error.response?.data || error.message);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ----------------- SIGN UP -----------------
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      // Backend sets JWT cookie and returns { user }
      const res = await axiosInstance.post("auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup Failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ----------------- LOGIN -----------------
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      // Backend sets JWT cookie and returns { user }
      const res = await axiosInstance.post("auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ----------------- LOGOUT -----------------
  logout: async () => {
    try {
      // This clears the server-side cookie
      await axiosInstance.post("auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout Failed");
    }
  },

  // ----------------- UPDATE PROFILE -----------------
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("auth/update-profile", data);
      set((state) => ({
        authUser: { ...state.authUser, ...res.data },
      }));
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("❌ error in updateProfile:", error);
      toast.error("Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ----------------- SOCKET CONNECTION -----------------
  // src/store/useAuthStore.js - FIXED VERSION
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || (socket && socket.connected)) return;

    const socketIo = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketIo.on("connect", () => {
      console.log("✅ Socket connected:", socketIo.id);
      const { groups } = useGroupStore.getState();
      if (Array.isArray(groups) && groups.length > 0) {
        const groupIds = groups.map((g) => g._id);
        socketIo.emit("joinGroups", groupIds);
      }
    });

    socketIo.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socketIo.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // ❌ BUG WAS HERE - using 'socket' instead of 'socketIo'
    // FIXED: Change 'socket.on' to 'socketIo.on'
    socketIo.on("removedFromGroup", ({ groupId }) => {
      const { selectedChat } = useChatStore.getState();
      if (selectedChat?.type === "group" && selectedChat.data._id === groupId) {
        useChatStore.getState().setSelectedChat(null);
      }
      toast.error("You were removed from a group.");
      useGroupStore.getState().fetchGroups();
    });

    socketIo.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    set({ socket: socketIo }); // ✅ Set the socket reference
  },


  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
