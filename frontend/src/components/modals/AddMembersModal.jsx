// src/components/modals/AddMembersModal.jsx

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

// Use your existing axiosInstance (so the HTTP-only cookie is sent automatically)
import { axiosInstance } from "../../lib/axios";
import { useChatStore } from "../../store/useChatStore";

export default function AddMembersModal({ isOpen, onClose, group }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const { setSelectedChat, selectedChat } = useChatStore();

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        // 1) Fetch ALL users (backend endpoint: GET /api/messages/users)
        const res = await axiosInstance.get("/messages/users");
        const allUsers = res.data; // array of { _id, fullName, profilePic, ... }

        // 2) Extract just the ID strings from group.members.
        //    group.members might look like:
        //      [ "60a1...", "60b2...", ... ]
        //    OR (because you did .populate("members", "fullName profilePic")),
        //      [ { _id: "60a1...", fullName: "...", profilePic: "..." }, … ]
        const memberIds = group.members.map((m) =>
          typeof m === "string" ? m : m._id
        );

        // 3) Filter out everyone whose _id is already in memberIds
        const nonMembers = allUsers.filter((u) => !memberIds.includes(u._id));
        setUsers(nonMembers);
      } catch (err) {
        console.error("Failed to load users", err);
        toast.error("Could not load users list");
      }
    };

    fetchUsers();
    // clear any previous selections when modal re‐opens
    setSelectedIds([]);
  }, [isOpen, group.members]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pick at least one user");
      return;
    }

    try {
      // Backend expects: PUT /api/groups/:groupId/add  with { newMemberIds: [ … ] }
      const res = await axiosInstance.put(
        `/groups/${group._id}/add`,
        { newMemberIds: selectedIds }
      );

      // The updated group (with new members populated) comes back in res.data
      setSelectedChat("group", res.data);

      toast.success("Members added!");
      onClose();
    } catch (err) {
      console.error("Add members failed", err);
      toast.error(err.response?.data?.message || "Could not add members");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* semi‐transparent backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />

      <Dialog.Panel className="relative bg-base-100 rounded-xl p-6 w-[90%] max-w-md mx-auto">
        <Dialog.Title className="text-lg font-semibold mb-4">
          Add Members to "{group.name}"
        </Dialog.Title>

        {/* If there are no non‐members left, show a friendly message */}
        {users.length === 0 ? (
          <p className="text-sm text-zinc-500 mb-4">
            All users are already in this group.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => toggleSelection(user._id)}
                className={`
                  p-2 border rounded cursor-pointer flex items-center gap-2
                  ${
                    selectedIds.includes(user._id)
                      ? "bg-blue-100 border-blue-400"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>{user.fullName}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={users.length === 0 || selectedIds.length === 0}
            className={`btn btn-primary ${
              users.length === 0 || selectedIds.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Add
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
