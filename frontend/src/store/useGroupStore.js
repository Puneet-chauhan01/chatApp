import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],            // list of all groups user is in
  selectedGroup: null,   // currently selected group for chat
  isGroupsLoading: false,
  isCreatingGroup: false,
  
  // Fetch all groups from backend
  fetchGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups"); // GET /api/groups
      set({ groups: res.data });
    } catch (err) {
      console.error("Error fetching groups:", err);
      toast.error("Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Create a new group
  createGroup: async (formData) => {
    set({ isCreatingGroup: true });
    try {
      // formData should be a FormData object with:
      //   - name (string)
      //   - memberIds (array of ObjectId strings, sent as JSON string)
      //   - optional groupPic (file under key "groupPic")
      const res = await axiosInstance.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Group created!");
      // Append to existing list
      set((state) => ({ groups: [res.data, ...state.groups] }));
      return res.data; // newly created group object
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error(err.response?.data?.message || "Failed to create group");
      return null;
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  // Set currently selected group (deselect user when group chosen)
  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
    // also clear selectedUser in useChatStore
    const { setSelectedUser } = useAuthStore.getState();
    setSelectedUser(null);
  },
}));
