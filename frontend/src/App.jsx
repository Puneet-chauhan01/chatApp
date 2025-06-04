import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import { useAuthStore } from './store/useAuthStore';
import { Loader } from "lucide-react"
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/useThemeStore';
import { handleIncomingCall } from './utils/handleIncomingCall';
import CallModal from './components/CallModal';
import { useCallStore } from './store/useCallStore';
const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  console.log("onlineUsers= ", onlineUsers);
  useEffect(() => {
    checkAuth()
  }, []); // ✅ Empty dependency array
  console.log(authUser);
  const { theme } = useThemeStore();
  console.log(theme);

  const { socket, groups } = useAuthStore();
  // Call event listeners
  // src/App.jsx - UPDATED CALL EVENT HANDLERS
  // src/App.jsx
useEffect(() => {
  if (!socket) return

  // Handlers defined once
  const onIncoming = (data) => handleIncomingCall(data)
  const onAccepted = (data) => console.log("✅ Call accepted:", data)
  const onRejected = (data) => console.log("❌ Call rejected:", data)
  const onEnded    = (data) => useCallStore.getState().endCall()
  const onStarted  = ({ callId }) => console.log("🟢 Call started:", callId)

  socket.on("incomingCall",  onIncoming)
  socket.on("callAccepted",  onAccepted)
  socket.on("callRejected",  onRejected)
  socket.on("callStarted",   onStarted)
  socket.on("callEnded",     onEnded)

  return () => {
    socket.off("incomingCall", onIncoming)
    socket.off("callAccepted", onAccepted)
    socket.off("callRejected", onRejected)
    socket.off("callStarted",  onStarted)
    socket.off("callEnded",    onEnded)
  }
}, [socket])  // ← only re-run when `socket` identity changes


  // useEffect(() => {
  //   if (!socket || !Array.isArray(groups)) return;
  //   const ids = groups.map((g) => g._id);
  //   if (ids.length > 0) {
  //     socket.emit("joinGroups", ids);
  //   }
  // }, [socket, groups]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className="size-10 animate-spin" />

      </div>
    )
  }
  return (
    <>
      <div data-theme={theme}>
        <Navbar />
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>

      </div>
      <CallModal />
      <Toaster />
    </>
  )
}
export default App;