// src/components/modals/GroupProfileModal.jsx
import React, { useState, useEffect } from "react";
import { X, Trash2, Pencil, UserMinus, UserCheck } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useChatStore as useContactStore } from "../../store/useChatStore"; // to fetch all users
import { useGroupStore } from "../../store/useGroupStore"; // ← NEW

import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

const GroupProfileModal = ({ group, isOpen, onClose }) => {
    const { authUser } = useAuthStore();
    const { setSelectedChat, getGroups } = useChatStore(); // so we can refresh sidebar after delete
    const { users, getUsers } = useContactStore(); // fetch all contacts
    const { fetchGroups } = useGroupStore(); 
    const [localName, setLocalName] = useState(group.name);
    const [isRenaming, setIsRenaming] = useState(false);

    // For adding new members:
    const [nonMembers, setNonMembers] = useState([]);
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // For updating group image:
    const [newGroupImage, setNewGroupImage] = useState(null);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    // Check if current user is an admin
    const isAdmin =
        Array.isArray(group.admins) &&
        group.admins.some((adm) => adm._id === authUser._id);

    // Whenever `group` prop changes, reset localName & clear selections
    useEffect(() => {
        setLocalName(group.name);
        setSelectedToAdd([]);
        setNewGroupImage(null);
    }, [group.name, group._id]);

    // Whenever modal opens, fetch contacts and compute “nonMembers”
    useEffect(() => {
        if (!isOpen) return;

        // First, fetch full contact list (other users)
        getUsers();

        // We’ll recalc `nonMembers` whenever `users` or `group.members` changes
    }, [isOpen, getUsers]);

    // Recompute nonMembers whenever `users` or `group.members` updates
    useEffect(() => {
        if (!isOpen) return;
        const nm = users.filter((u) => !group.members.some((m) => m._id === u._id));
        setNonMembers(nm);
    }, [users, group.members, isOpen]);

    if (!isOpen) return null;

    // ── Handlers ───────────────────────────────────────────────────

    const handleRename = async () => {
        if (!localName.trim() || localName.trim() === group.name) return;
        setIsRenaming(true);
        try {
            const res = await axiosInstance.put(`/groups/${group._id}/rename`, {
                name: localName.trim(),
            });
            // Update the selected chat to reflect the new name
            setSelectedChat("group", res.data);
            toast.success("Group renamed");
        } catch (err) {
            console.error("Rename failed:", err);
            toast.error("Rename failed");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!isAdmin) return;
        try {
            const res = await axiosInstance.delete(`/groups/${group._id}/${userId}`);
            setSelectedChat("group", res.data);
            await fetchGroups();
            toast.success("Member removed");
        } catch (err) {
            console.error("Remove member failed:", err);
            toast.error("Failed to remove member");
        }
    };

    const handlePromote = async (memberId) => {
        if (!isAdmin) return;
        try {
            const res = await axiosInstance.put(`/groups/${group._id}/admins/add`, {
                userIdToMakeAdmin: memberId,
            });
            setSelectedChat("group", res.data);
            toast.success("Promoted to admin");
        } catch (err) {
            console.error("Promote failed:", err);
            toast.error("Failed to promote");
        }
    };

    const handleDemote = async (memberId) => {
        if (!isAdmin) return;
        try {
            const res = await axiosInstance.put(`/groups/${group._id}/admins/remove`, {
                userIdToRemoveAdmin: memberId,
            });
            setSelectedChat("group", res.data);
            toast.success("Demoted from admin");
        } catch (err) {
            console.error("Demote failed:", err);
            toast.error("Failed to demote");
        }
    };

    const handleDeleteGroup = async () => {
        if (!isAdmin) return;
        if (!window.confirm("Delete this group for everyone?")) return;
        try {
            await axiosInstance.delete(`/groups/${group._id}`);
            onClose();

            // Clear selection and refresh sidebar
            useChatStore.getState().setSelectedChat(null);

            await fetchGroups();
            toast.success("Group deleted");
        } catch (err) {
            console.error("Delete group failed:", err);
            toast.error("Failed to delete group");
        }
    };

    const handleAddMembers = async () => {
        if (!isAdmin || selectedToAdd.length === 0) return;
        setIsAdding(true);
        try {
            const res = await axiosInstance.put(`/groups/${group._id}/add`, {
                newMemberIds: selectedToAdd,
            });
            setSelectedChat("group", res.data);
            toast.success("Member(s) added");
            setSelectedToAdd([]);
        } catch (err) {
            console.error("Add members failed:", err);
            toast.error("Failed to add members");
        } finally {
            setIsAdding(false);
        }
    };

    const toggleAddSelection = (userId) => {
        setSelectedToAdd((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleGroupImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setNewGroupImage(file);
    };

    const handleUpdateImage = async () => {
        if (!isAdmin || !newGroupImage) return;
        setIsUpdatingImage(true);
        try {
            const formData = new FormData();
            formData.append("groupPic", newGroupImage);
            const res = await axiosInstance.put(
                `/groups/${group._id}/update-pic`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            // Update the selected chat’s data to include new groupPic
            setSelectedChat("group", res.data);
            toast.success("Group image updated");
            setNewGroupImage(null);
        } catch (err) {
            console.error("Update group image failed:", err);
            toast.error("Failed to update image");
        } finally {
            setIsUpdatingImage(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Group Info</h3>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* ── Group Picture & Rename ─────────────────────────────── */}
                <div className="mt-4 text-center">
                    <img
                        src={group.groupPic || "/avatar.png"}
                        alt={group.name}
                        className="mx-auto rounded-full size-24 object-cover"
                    />
                    {isAdmin ? (
                        <div className="mt-2 flex gap-2 justify-center">
                            <input
                                type="text"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                className="input input-bordered w-full max-w-xs"
                                disabled={isRenaming}
                            />
                            <button
                                className={`btn btn-primary btn-sm flex items-center gap-1 ${isRenaming ? "loading" : ""
                                    }`}
                                onClick={handleRename}
                                disabled={isRenaming || localName.trim() === group.name}
                            >
                                <Pencil size={16} /> Rename
                            </button>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-base-content/70">Admins can rename</p>
                    )}
                </div>

                {/* ── Update Group Image ────────────────────────────────── */}
                {isAdmin && (
                    <div className="mt-4 px-2">
                        <label className="block mb-1 text-sm font-medium">Update Group Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleGroupImageChange}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <button
                            className={`btn btn-secondary btn-sm mt-2 w-full ${isUpdatingImage || !newGroupImage ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            onClick={handleUpdateImage}
                            disabled={isUpdatingImage || !newGroupImage}
                        >
                            {isUpdatingImage ? "Updating…" : "Update Image"}
                        </button>
                    </div>
                )}

                {/* ── Member List ───────────────────────────────────────── */}
                <h4 className="mt-6 font-semibold">Members</h4>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-2 px-2">
                    {group.members.map((member) => {
                        const isMemberAdmin =
                            Array.isArray(group.admins) &&
                            group.admins.some((adm) => adm._id === member._id);

                        return (
                            <div
                                key={member._id}
                                className="flex items-center justify-between py-2 border-b"
                            >
                                <div className="flex items-center gap-2">
                                    <img
                                        src={member.profilePic || "/avatar.png"}
                                        alt={member.fullName}
                                        className="size-8 rounded-full object-cover"
                                    />
                                    <span>{member.fullName}</span>
                                    {isMemberAdmin && (
                                        <span className="ml-2 badge badge-sm badge-primary">Admin</span>
                                    )}
                                </div>

                                {isAdmin && member._id !== authUser._id && (
                                    <div className="flex gap-2">
                                        {isMemberAdmin ? (
                                            <button
                                                className="btn btn-xs btn-outline bg-yellow-100 hover:bg-yellow-200 flex items-center gap-1"
                                                onClick={() => handleDemote(member._id)}
                                            >
                                                <UserMinus size={14} /> Demote
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-xs btn-outline bg-green-100 hover:bg-green-200 flex items-center gap-1"
                                                onClick={() => handlePromote(member._id)}
                                            >
                                                <UserCheck size={14} /> Promote
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-xs btn-error flex items-center gap-1"
                                            onClick={() => handleRemoveMember(member._id)}
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Add Members Section ─────────────────────────────────── */}
                {isAdmin && (
                    <>
                        <h4 className="mt-6 font-semibold">Add Members</h4>
                        {nonMembers.length === 0 ? (
                            <p className="text-sm text-zinc-500 px-2">No more users to add.</p>
                        ) : (
                            <div className="mt-2 max-h-40 overflow-y-auto space-y-2 px-2">
                                {nonMembers.map((user) => (
                                    <label
                                        key={user._id}
                                        className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-base-200"
                                        onClick={() => toggleAddSelection(user._id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedToAdd.includes(user._id)}
                                            readOnly
                                        />
                                        <img
                                            src={user.profilePic || "/avatar.png"}
                                            alt={user.fullName}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <span>{user.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 flex justify-end px-2">
                            <button
                                className={`btn btn-primary flex items-center gap-2 ${isAdding || selectedToAdd.length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                    }`}
                                onClick={handleAddMembers}
                                disabled={isAdding || selectedToAdd.length === 0}
                            >
                                {isAdding ? (
                                    <>
                                        <span className="loading loading-spinner" /> Adding…
                                    </>
                                ) : (
                                    "Add Selected"
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Delete Group ───────────────────────────────────────── */}
                {isAdmin && (
                    <div className="mt-6 text-right px-2 pb-4">
                        <button
                            className="btn btn-sm btn-error flex items-center gap-1"
                            onClick={handleDeleteGroup}
                        >
                            <Trash2 size={16} /> Delete Group
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupProfileModal;
