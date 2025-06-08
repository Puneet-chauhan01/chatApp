// src/components/CreateGroupModal.jsx

import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  console.log("CreateGroupModal rendered, isOpen:", isOpen);

  const { users, isUsersLoading } = useChatStore();
  const { createGroup, isCreatingGroup } = useGroupStore();

  // Local form state
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]); // array of user._id
  const [groupPicFile, setGroupPicFile] = useState(null);

  // We only want to reset these fields once, when isOpen goes from false -> true.
  const justOpenedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !justOpenedRef.current) {
      // Reset local state now that the modal is open
      setGroupName("");
      setSelectedMembers([]);
      setGroupPicFile(null);
      justOpenedRef.current = true;
    }
    if (!isOpen) {
      // When modal closes, mark as “not just opened”
      justOpenedRef.current = false;
      // return null;
    }
  }, [isOpen]);

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    // Build FormData
    const fd = new FormData();
    fd.append("name", groupName.trim());
    // Send memberIds as JSON string
    fd.append("memberIds", JSON.stringify(selectedMembers));
    if (groupPicFile) {
      fd.append("groupPic", groupPicFile);
    }

    const newGroup = await createGroup(fd);
    if (newGroup) {
      onClose();
    }
  };

  // If isOpen is false, don’t render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. Weekend Buddies"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          {/* Group Picture (optional) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Picture (optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered w-full"
              onChange={(e) => setGroupPicFile(e.target.files[0])}
            />
          </div>

          {/* Select Members */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Members</span>
            </label>
            {isUsersLoading ? (
              <p>Loading users…</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-base-300 rounded-lg p-2">
                {users.map((u) => (
                  <label
                    key={u._id}
                    className="flex items-center gap-2 mb-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedMembers.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                    />
                    <div className="flex items-center gap-2">
                      <img
                        src={u.profilePic || "/avatar.png"}
                        alt={u.fullName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{u.fullName}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isCreatingGroup}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup}
            >
              {isCreatingGroup ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
