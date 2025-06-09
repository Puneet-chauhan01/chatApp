// src/App.jsx
import React, { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useCallStore } from './store/useCallStore'
import CallModal from './components/CallModal'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import { Loader } from 'lucide-react'
import { useThemeStore } from './store/useThemeStore'
import { useGroupStore } from './store/useGroupStore'

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore()
  const { handleIncomingCall, endCall } = useCallStore()
  const { theme } = useThemeStore()
  const hasJoined = useRef(false)
 const { groups } = useGroupStore()
  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (!socket) return;
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callEnded", endCall);
    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callEnded", endCall);
    };
  }, [socket, handleIncomingCall, endCall]);
  useEffect(() => {
    if (!socket || hasJoined.current) return;
    const groupIds = groups.map(g => g._id);
    if (groupIds.length) {
      socket.emit('joinGroups', groupIds);
      hasJoined.current = true;
    }
  }, [socket, groups])

  if (isCheckingAuth && !authUser) {
    return <div className="flex items-center justify-center h-screen"><Loader className="animate-spin" /></div>
  }

  return (
    <div data-theme={theme} className="pt-16" >
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      <CallModal />
      <Toaster limit={1} />
    </div>
  )
}

export default App
