# chatApp
 Realtime Chat app MERN Stack
supports 1-1 chats and group chats and Calling
uses cloudinary,zustand,daisyui,axioa,socket,mongodb,multer
/chat-app
├── backend
│   ├── controllers
│   │   ├── auth.controller.js
│   │   ├── group.controller.js
│   │   ├── message.controller.js
│   │   ├── rtc.controller.js
│   │   └── call.controller.js
│   ├── middleware
│   │   ├── auth.middleware.js
│   │   ├── group.middleware.js
│   │   └── groupAdmin.middleware.js
│   ├── models
│   │   ├── user.model.js
│   │   ├── group.model.js
│   │   ├── call.model.js
│   │   └── message.model.js
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── call.routes.js
│   │   ├── group.routes.js
│   │   └── message.routes.js
│   ├── lib
│   │   ├── db.js
│   │   ├── multer.js
│   │   ├── cloudinary.js
│   │   ├── socket.js          # Socket.IO server + JWT handshake
│   │   └── utils.js
│   └── server.js
│   └── .env
└── frontend
    ├── public
    └── src
        ├── App.jsx
        ├── main.jsx
        ├── lib
        │   └── axios.js
        ├── store
        │   ├── useAuthStore.js
        │   ├── useChatStore.js
        │   ├── useGroupStore.js
        │   ├── useCallStore.js
        │   └── useThemeStore.js
        ├── components
        │   ├── Sidebar.jsx
        │   ├── ChatContainer.jsx
        │   ├── ChatHeader.jsx
        │   ├── MessageInput.jsx
        │   ├── CallModal.jsx
        │   ├── AgoraCall.jsx
        │   ├── AuthImagePattern.jsx
        │   ├── Navbar.jsx
        │   ├── CreateGroupModal.jsx
        │   ├── ChatHeader.jsx
        │   ├── CallButton.jsx
        │   ├── modals
        │   │   ├── AddMembersModal.jsx
        │   │   ├── GroupProfileModal
        │   ├── skeletons
        │   │   ├── MessageSkeleton.jsx
        │   │   ├── SidebarSkeleton.jsx
        ├── constants
        │   ├── index.js
        ├── pages
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── SignUpPage.jsx
        │   ├── ProfilePage.jsx
        │   └── SettingsPage.jsx
