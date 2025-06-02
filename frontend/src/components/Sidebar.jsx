
// import React, { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useGroupStore } from "../store/useGroupStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import CreateGroupModal from "./CreateGroupModal";
// import { Users as UsersIcon, Users as GroupsIcon, Plus } from "lucide-react";

// const Sidebar = () => {
//   // 1) Users + selection logic from useChatStore
//   const {
//     users,
//     isUsersLoading,
//     getUsers,           // fetch all users
//     selectedChat,
//     setSelectedChat,
//   } = useChatStore();

//   // 2) Groups + selection logic from useGroupStore
//   const {
//     groups,
//     isGroupsLoading,
//     fetchGroups,
//   } = useGroupStore();

//   // 3) Auth + onlineUsers from useAuthStore
//   const { authUser, onlineUsers } = useAuthStore();

//   // Local toggles
//   const [viewMode, setViewMode] = useState("users");
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // On mount, fetch both lists
//   useEffect(() => {
//     getUsers();
//     fetchGroups();
//   }, [getUsers, fetchGroups]);

//   // If either is still loading, show skeleton
//   if (isUsersLoading || isGroupsLoading) {
//     return <SidebarSkeleton />;
//   }

//   // Filter out ourselves from the “users” list
//   const filteredUsers = users.filter((u) => u._id !== authUser._id);

//   // Figure out which chat is currently selected
//   const selectedUserId =
//     selectedChat?.type === "user" ? selectedChat.data._id : null;
//   const selectedGroupId =
//     selectedChat?.type === "group" ? selectedChat.data._id : null;

//   /** 
//    * Instead of fetching inside the modal, we fetch here *before* showing it.
//    * That way the modal itself never triggers store-updates on mount.
//    */
//   const openModal = () => {
//     getUsers();            // fetch the latest users
//     setIsModalOpen(true);  // now show the modal
//   };

//   return (
//     <>
//       <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
//         {/* ── Header with “New Group (+)” button ─────── */}
//         <div className="border-b border-base-300 w-full p-4 flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <UsersIcon className="size-6" />
//             <span className="hidden lg:block font-medium">Contacts</span>
//           </div>
//           <button
//             className="btn btn-sm btn-circle"
//             aria-label="Create new group"
//             onClick={openModal}  // fetch users + open
//           >
//             <Plus size={16} />
//           </button>
//         </div>

//         {/* ── Toggle Buttons: “Contacts” vs “Groups” ───── */}
//         <div className="flex border-b border-base-300">
//           <button
//             className={`flex-1 py-2 text-center ${
//               viewMode === "users" ? "bg-base-100 font-semibold" : "hover:bg-base-200"
//             }`}
//             onClick={() => setViewMode("users")}
//           >
//             Contacts
//           </button>
//           <button
//             className={`flex-1 py-2 text-center ${
//               viewMode === "groups" ? "bg-base-100 font-semibold" : "hover:bg-base-200"
//             }`}
//             onClick={() => setViewMode("groups")}
//           >
//             Groups
//           </button>
//         </div>

//         {/* ── List Section ───────────────────────────── */}
//         <div className="overflow-y-auto flex-1 py-2">
//           {/* Render Contacts */}
//           {viewMode === "users" &&
//             filteredUsers.map((user) => (
//               <button
//                 key={user._id}
//                 onClick={() => setSelectedChat("user", user)}
//                 className={`
//                   w-full px-4 py-2 flex items-center gap-3
//                   hover:bg-base-200 transition-colors
//                   ${
//                     selectedUserId === user._id
//                       ? "bg-base-200 ring-1 ring-base-300"
//                       : ""
//                   }
//                 `}
//               >
//                 <div className="relative">
//                   <img
//                     src={user.profilePic || "/avatar.png"}
//                     alt={user.fullName}
//                     className="size-10 rounded-full object-cover"
//                   />
//                   {onlineUsers.includes(user._id) && (
//                     <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
//                   )}
//                 </div>
//                 <div className="hidden lg:block truncate text-left">
//                   <div className="font-medium">{user.fullName}</div>
//                   <div className="text-sm text-zinc-400">
//                     {onlineUsers.includes(user._id) ? "Online" : "Offline"}
//                   </div>
//                 </div>
//               </button>
//             ))}

//           {/* Render Groups */}
//           {viewMode === "groups" &&
//             groups.map((grp) => (
//               <button
//                 key={grp._id}
//                 onClick={() => setSelectedChat("group", grp)}
//                 className={`
//                   w-full px-4 py-2 flex items-center gap-3
//                   hover:bg-base-200 transition-colors
//                   ${
//                     selectedGroupId === grp._id
//                       ? "bg-base-200 ring-1 ring-base-300"
//                       : ""
//                   }
//                 `}
//               >
//                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                   <GroupsIcon className="size-6 text-primary" />
//                 </div>
//                 <div className="hidden lg:block text-left truncate">
//                   <div className="font-medium">{grp.name}</div>
//                   <div className="text-sm text-zinc-400">
//                     {grp.members.length}{" "}
//                     {grp.members.length === 1 ? "member" : "members"}
//                   </div>
//                 </div>
//               </button>
//             ))}

//           {viewMode === "groups" && groups.length === 0 && (
//             <div className="text-center text-zinc-500 py-4">
//               You have no groups yet.
//             </div>
//           )}
//         </div>
//       </aside>

//       {/* ── Create Group Modal ────────────────────────────────── */}
//       {isModalOpen && (
//         <CreateGroupModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//         />
//       )}
//     </>
//   );
// };

// export default Sidebar;


// src/components/Sidebar.jsx - RESPONSIVE VERSION
import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import { Users, Plus, X, Menu } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
  const { getUsers, users, isUsersLoading, selectedChat, setSelectedChat } = useChatStore();
  const { groups, fetchGroups, isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getUsers();
    fetchGroups();
  }, [getUsers, fetchGroups]);

  const filteredUsers = showOnlineOnly 
    ? users.filter(user => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading || isGroupsLoading) {
    return (
      <aside className="h-full w-full lg:w-72 bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn btn-circle btn-ghost bg-base-100 shadow-lg"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative lg:translate-x-0 h-full w-80 lg:w-72 bg-base-100 border-r border-base-300 
        flex flex-col transition-all duration-300 z-40
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden btn btn-ghost btn-sm"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-base-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "contacts" 
                  ? "bg-primary text-primary-content" 
                  : "text-base-content hover:bg-base-300"
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "groups" 
                  ? "bg-primary text-primary-content" 
                  : "text-base-content hover:bg-base-300"
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "contacts" && (
            <div className="p-4 space-y-3">
              {/* Online Filter */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">Show online only</span>
                </label>
                <span className="text-xs text-base-content/60">
                  {filteredUsers.length} users
                </span>
              </div>

              {/* User List */}
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedChat("user", user);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedChat?.type === "user" && selectedChat?.data._id === user._id
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {onlineUsers.includes(user._id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{user.fullName}</p>
                    <p className="text-xs opacity-60">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "groups" && (
            <div className="p-4 space-y-3">
              {/* Create Group Button */}
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span className="font-medium">Create New Group</span>
              </button>

              {/* Groups List */}
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => {
                    setSelectedChat("group", group);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedChat?.type === "group" && selectedChat?.data._id === group._id
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <img
                    src={group.groupPic || "/group-avatar.png"}
                    alt={group.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    <p className="text-xs opacity-60">
                      {group.members.length} members
                    </p>
                  </div>
                </button>
              ))}

              {groups.length === 0 && (
                <div className="text-center py-8 text-base-content/60">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No groups yet</p>
                  <p className="text-sm">Create your first group to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
