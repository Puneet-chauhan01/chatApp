# chatApp
 Realtime Chat app MERN Stack
supports 1-1 chats and group chats
uses cloudinary,zustand,daisyui,axioa,socket,mongodb,multer

Project Structure:-
/chat-app
├── backend
│   ├── controllers
│   │   ├── auth.controller.js
│   │   ├── group.controller.js
│   │   ├── message.controller.js
│   │   └── user.controller.js      # (if you have any extra user‐related endpoints)
│   │
│   ├── middleware
│   │   ├── auth.middleware.js      # “protectRoute”, JWT‐verification, attaches req.user
│   │   ├── group.middleware.js     # checks if a user is a member of a particular group
│   │   └── groupAdmin.middleware.js# checks if req.user._id is in group.admins
│   │
│   ├── models
│   │   ├── user.model.js           # { fullName, email, password, profilePic, groups: [ObjectId], … }
│   │   ├── group.model.js          # { name, members: [ObjectId], admins: [ObjectId], groupPic, createdBy }
│   │   └── message.model.js        # { senderId, receiverId?, groupId?, text, image, createdAt }
│   │
│   ├── routes
│   │   ├── auth.routes.js          # /api/auth/*
│   │   ├── group.routes.js         # /api/groups/*    (protected by isGroupAdmin, isGroupMember, etc.)
│   │   └── message.routes.js       # /api/messages/*  (protectedRoute for both user & group endpoints)
│   │
│   ├── lib
│   │   ├── cloudinary.js           # Cloudinary upload helper
│   │   ├── socket.js               # Socket.IO server + JWT handshake logic, getRecieverSocketId, io
│   │   └── utils.js                # generateToken() and any other small helpers
│   │
│   ├── middleware
│   │   └── (see “backend/middleware” above)
│   │
│   ├── server.js                   # Main Express setup, mount authRoutes, groupRoutes, messageRoutes
│   └── index.js                    # (if you prefer, you can have index.js import server.js)
│
└── frontend
    ├── public
    │   └── favicon.ico
    │   └── index.html
    │   └── (any static assets you want)
    │
    ├── src
    │   ├── App.jsx                  # Main React component (router + Toaster)
    │   ├── index.jsx                # ReactDOM.render / createRoot
    │   │
    │   ├── lib
    │   │   └── axios.js             # axiosInstance with baseURL="/api"
    │   │
    │   ├── store
    │   │   ├── useAuthStore.js      # zustand store for authUser, socket, onlineUsers, login/signup
    │   │   ├── useChatStore.js      # zustand store for one‐to‐one & group chat (messages, subscribe, sendMessage)
    │   │   ├── useGroupStore.js     # zustand store for general group list and selection
    │   │   └── useThemeStore.js     # (if you manage light/dark theme, etc.)
    │   │
    │   ├── components
    │   │   ├── ChatContainer.jsx    # renders ChatHeader, message list, MessageInput
    │   │   ├── ChatHeader.jsx       # displays avatar, name/status, “Add Member” + “Close” buttons
    │   │   ├── MessageInput.jsx     # text + image upload input + “Send” button
    │   │   ├── NoChatSelected.jsx   # placeholder when no chat is chosen
    │       ├── Sidebar.jsx           # lists “Contacts” (one‐to‐one) and “Groups”
    │   │   
    │   │   └── skeletons
    │   │       └── MessageSkeleton.jsx   # loading placeholder
    │   │
    │   ├── components/modals
    │   │   ├── GroupProfileModal.jsx    # shows group info, rename, update image, member list, add/promote/remove/delete
    │   │
    │   ├── pages
    │   │   ├── HomePage.jsx          # (renders sidebar + ChatContainer)
    │   │   ├── LoginPage.jsx
    │   │   ├── SignUpPage.jsx
    │   │   ├── ProfilePage.jsx       # user can update profilePic, name, etc.
    │   │   └── SettingsPage.jsx      # any additional settings (theme toggle, etc.)
    │   │
    │   
    ├── package.json
    ├── vite.config.js               # Vite + React plugin configuration
    └── tailwind.config.js           # (if you use Tailwind/daisyUI)




