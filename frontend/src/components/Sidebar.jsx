// import React, { useEffect, useState } from 'react'
// import SidebarSkeleton from './skeletons/SidebarSkeleton';
// import { useChatStore } from '../store/useChatStore';
// import { Users } from 'lucide-react';
// import { useAuthStore } from '../store/useAuthStore';

// const Sidebar = () => {
//     const {getUsers,selectedUser,setSelectedUser,users,isUsersLoading} = useChatStore(); 
//     const {onlineUsers} = useAuthStore();
//     const [showOnlineOnly, setShowOnlineOnly] = useState(false);

//     useEffect(()=>{
//     getUsers();
//     },[getUsers]);
//     const filteredUsers = showOnlineOnly ? users.filter(user=>onlineUsers.includes(user._id)):users;
//     if(isUsersLoading) return <SidebarSkeleton/>

//   return (
//     <div>
//          <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
//       <div className="border-b border-base-300 w-full p-5">
//         <div className="flex items-center gap-2">
//           <Users className="size-6" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>
//         {/* TODO: Online filter toggle */}
//         <div className="mt-3 hidden lg:flex items-center gap-2">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-sm"
//             />
//             <span className="text-sm">Show online only</span>
//           </label>
//           <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
//         </div>
//       </div>

//       <div className="overflow-y-auto w-full py-3">
//         {filteredUsers.map((user) => (
//           <button
//             key={user._id}
//             onClick={() => setSelectedUser(user)}
//             className={`
//               w-full p-3 flex items-center gap-3
//               hover:bg-base-300 transition-colors
//               ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
//             `}
//           >
//             <div className="relative mx-auto lg:mx-0">
//               <img
//                 src={user.profilePic || "/avatar.png"}
//                 alt={user.name}
//                 className="size-12 object-cover rounded-full"
//               />
//               {onlineUsers.includes(user._id) && (
//                 <span
//                   className="absolute bottom-0 right-0 size-3 bg-green-500 
//                   rounded-full ring-2 ring-zinc-900"
//                 />
//               )}
//             </div>

//             {/* User info - only visible on larger screens */}
//             <div className="hidden lg:block text-left min-w-0">
//               <div className="font-medium truncate">{user.fullName}</div>
//               <div className="text-sm text-zinc-400">
//                 {onlineUsers.includes(user._id) ? "Online" : "Offline"}
//               </div>
//             </div>
//           </button>
//         ))}

//         {filteredUsers.length === 0 && (
//           <div className="text-center text-zinc-500 py-4">No online users</div>
//         )}
//       </div>
//     </aside>
//     </div>
//   )
// }

// export default Sidebar
// src/components/Sidebar.jsx
// src/components/Sidebar.jsx
// src/components/Sidebar.jsx

import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import { Users as UsersIcon, Users as GroupsIcon, Plus } from "lucide-react";

const Sidebar = () => {
  // 1) Users + selection logic from useChatStore
  const {
    users,
    isUsersLoading,
    getUsers,           // fetch all users
    selectedChat,
    setSelectedChat,
  } = useChatStore();

  // 2) Groups + selection logic from useGroupStore
  const {
    groups,
    isGroupsLoading,
    fetchGroups,
  } = useGroupStore();

  // 3) Auth + onlineUsers from useAuthStore
  const { authUser, onlineUsers } = useAuthStore();

  // Local toggles
  const [viewMode, setViewMode] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // On mount, fetch both lists
  useEffect(() => {
    getUsers();
    fetchGroups();
  }, [getUsers, fetchGroups]);

  // If either is still loading, show skeleton
  if (isUsersLoading || isGroupsLoading) {
    return <SidebarSkeleton />;
  }

  // Filter out ourselves from the “users” list
  const filteredUsers = users.filter((u) => u._id !== authUser._id);

  // Figure out which chat is currently selected
  const selectedUserId =
    selectedChat?.type === "user" ? selectedChat.data._id : null;
  const selectedGroupId =
    selectedChat?.type === "group" ? selectedChat.data._id : null;

  /** 
   * Instead of fetching inside the modal, we fetch here *before* showing it.
   * That way the modal itself never triggers store-updates on mount.
   */
  const openModal = () => {
    getUsers();            // fetch the latest users
    setIsModalOpen(true);  // now show the modal
  };

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* ── Header with “New Group (+)” button ─────── */}
        <div className="border-b border-base-300 w-full p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-6" />
            <span className="hidden lg:block font-medium">Contacts</span>
          </div>
          <button
            className="btn btn-sm btn-circle"
            aria-label="Create new group"
            onClick={openModal}  // fetch users + open
          >
            <Plus size={16} />
          </button>
        </div>

        {/* ── Toggle Buttons: “Contacts” vs “Groups” ───── */}
        <div className="flex border-b border-base-300">
          <button
            className={`flex-1 py-2 text-center ${
              viewMode === "users" ? "bg-base-100 font-semibold" : "hover:bg-base-200"
            }`}
            onClick={() => setViewMode("users")}
          >
            Contacts
          </button>
          <button
            className={`flex-1 py-2 text-center ${
              viewMode === "groups" ? "bg-base-100 font-semibold" : "hover:bg-base-200"
            }`}
            onClick={() => setViewMode("groups")}
          >
            Groups
          </button>
        </div>

        {/* ── List Section ───────────────────────────── */}
        <div className="overflow-y-auto flex-1 py-2">
          {/* Render Contacts */}
          {viewMode === "users" &&
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedChat("user", user)}
                className={`
                  w-full px-4 py-2 flex items-center gap-3
                  hover:bg-base-200 transition-colors
                  ${
                    selectedUserId === user._id
                      ? "bg-base-200 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div className="relative">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-10 rounded-full object-cover"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                  )}
                </div>
                <div className="hidden lg:block truncate text-left">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

          {/* Render Groups */}
          {viewMode === "groups" &&
            groups.map((grp) => (
              <button
                key={grp._id}
                onClick={() => setSelectedChat("group", grp)}
                className={`
                  w-full px-4 py-2 flex items-center gap-3
                  hover:bg-base-200 transition-colors
                  ${
                    selectedGroupId === grp._id
                      ? "bg-base-200 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GroupsIcon className="size-6 text-primary" />
                </div>
                <div className="hidden lg:block text-left truncate">
                  <div className="font-medium">{grp.name}</div>
                  <div className="text-sm text-zinc-400">
                    {grp.members.length}{" "}
                    {grp.members.length === 1 ? "member" : "members"}
                  </div>
                </div>
              </button>
            ))}

          {viewMode === "groups" && groups.length === 0 && (
            <div className="text-center text-zinc-500 py-4">
              You have no groups yet.
            </div>
          )}
        </div>
      </aside>

      {/* ── Create Group Modal ────────────────────────────────── */}
      {isModalOpen && (
        <CreateGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
