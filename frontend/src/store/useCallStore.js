// src/store/useCallStore.js
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';

export const useCallStore = create((set, get) => ({
  // State
  incomingCall: null,
  currentCall: null,
  isCallModalOpen: false,
  
  // Actions
  setIncomingCall: (callData) => set({ incomingCall: callData }),
  setCurrentCall: (callData) => set({ currentCall: callData }),
  setCallModalOpen: (isOpen) => set({ isCallModalOpen: isOpen }),
  
  // Handle incoming call - FIXED VERSION
  handleIncomingCall: (callData) => {
    console.log("📞 Incoming call:", callData);
    
    // Set incoming call data and open modal
    set({ 
      incomingCall: callData, 
      isCallModalOpen: true,
      currentCall: callData // Also set as current call
    });
    
    // Show a simple toast notification (not for interaction)
    toast.success(
      `📞 ${callData.isGroup ? 'Group Call' : `${callData.callerName} is calling`}`,
      {
        duration: 5000,
        position: 'top-center'
      }
    );
  },

  acceptCall: (callData) => {
    console.log("✅ Accepting call:", callData);
    const { socket } = useAuthStore.getState();
    if (socket) {
      socket.emit('acceptCall', {
        callId: callData.callId,
        targetUserId: callData.callerId
      });
    }
    set({ 
      currentCall: callData, 
      incomingCall: null, 
      isCallModalOpen: true 
    });
  },

  rejectCall: (callData) => {
    console.log("❌ Rejecting call:", callData);
    const { socket } = useAuthStore.getState();
    if (socket) {
      socket.emit('rejectCall', {
        callId: callData.callId,
        targetUserId: callData.callerId
      });
    }
    set({ 
      incomingCall: null, 
      isCallModalOpen: false,
      currentCall: null 
    });
  },

  endCall: () => {
    const { currentCall } = get();
    const { socket } = useAuthStore.getState();
    
    if (currentCall && socket) {
      socket.emit('endCall', {
        callId: currentCall.callId,
        participants: currentCall.isGroup 
          ? currentCall.participants 
          : [currentCall.targetUserId || currentCall.callerId]
      });
    }
    
    set({ 
      currentCall: null, 
      incomingCall: null, 
      isCallModalOpen: false 
    });
  }
}));
