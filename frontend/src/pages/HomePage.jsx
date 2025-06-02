// import React from 'react'
// import  {useChatStore}  from '../store/useChatStore.js';
// import  ChatContainer  from '../components/ChatContainer';
// import NochatSelected from '../components/NochatSelected';
// import  Sidebar  from '../components/Sidebar';
// const HomePage = () => {
//   const { selectedUser } = useChatStore();
//   return (
//     <div>
//       <div className="h-screen bg-base-200">
//         <div className="flex items-center justify-center pt-20 px-4">
//           <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
//             <div className="flex h-full rounded-lg overflow-hidden">
//               <Sidebar/>
//               {!selectedUser ? <NochatSelected/>: <ChatContainer/>}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default HomePage
import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";

import Sidebar from "../components/Sidebar";

const HomePage = () => {
  const { isCheckingAuth, authUser, socket, checkAuth } = useAuthStore();
  const { selectedChat } = useChatStore();
  const { groups, fetchGroups } = useGroupStore();

  // 1) On mount, ensure we check authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2) Also fetch all user groups once the user is authenticated
  useEffect(() => {
    if (authUser) {
      fetchGroups();
    }
  }, [authUser, fetchGroups]);

  // 3) Once we have both a connected socket and a groups list, join each group room
  useEffect(() => {
    if (socket && Array.isArray(groups) && groups.length > 0) {
      const groupIds = groups.map((g) => g._id);
      socket.emit("joinGroups", groupIds);
      console.log("Emitted joinGroups for:", groupIds);
    }
  }, [socket, groups]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedChat ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
