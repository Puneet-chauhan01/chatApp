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
      <Toaster />
    </>
  )
}
export default App;