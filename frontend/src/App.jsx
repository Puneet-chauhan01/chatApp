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
  useEffect(() => {
    if (!socket) return;
    const { endCall, setCurrentCall } = useCallStore.getState();

    const handleIncomingCallEvent = (callData) => {
      console.log("📞 Received incoming call event:", callData);
      handleIncomingCall(callData);
    };

    const handleCallAccepted = (data) => {
      console.log('✅ Call accepted:', data);
      // Don't end call on acceptance
    };

    const handleCallRejected = (data) => {
      console.log('❌ Call rejected:', data);
      // Handle call rejection
    };

    const handleCallEnded = (data) => {
      console.log('📞 Call ended:', data);
      // Only end call if it matches current call
      const { endCall } = useCallStore.getState();
      endCall();
    };

    const onCallStarted = ({ callId }) => {
      console.log('🟢 Call started:', callId);
      // You could e.g. set a flag in your store if you want to show "Active"
    };
    socket.on('callStarted', onCallStarted);

    socket.on('incomingCall', handleIncomingCallEvent);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('incomingCall', handleIncomingCallEvent);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
      socket.off('callStarted', onCallStarted);

    };
  }, [socket, handleIncomingCall]);


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