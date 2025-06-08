// src/store/useCallStore.js
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';
import { axiosInstance } from "../lib/axios";
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
    console.log("📞[client] Incoming call:", callData);
    toast.remove()
    const toastId = `incoming-${callData.callId}`
    if (!toast.isActive(toastId)) {
      toast.success(
        `📞 ${callData.isGroup ? 'Group Call' : `${callData.callerName} is calling`}`,
        {
          id: toastId,
          position: 'top-center',
          duration: 5000
        }
      )
    }
    // Set incoming call data and open modal
    set({
      incomingCall: callData,
      isCallModalOpen: true,
      // currentCall: callData // Also set as current call
    });

    // Show a simple toast notification (not for interaction)


  },
initiateCall: async ({ targetUserId, callerName, callType, isGroup, groupId }) => {
    const callId = `call_${Date.now()}`;
    const { socket } = useAuthStore.getState();
    // 1) Create DB record
    await axiosInstance.post('/calls/initiate', {
      callId, targetUserId, callType, isGroup, groupId
    }).catch(console.error);

    // 2) Signal callee
    socket?.emit("callUser", {
      callId,
      callerId: useAuthStore.getState().authUser._id,
      callerName,
      targetUserId,
      callType,
      isGroup,
      groupId,
    });

    // 3) Open your own UI
    set({ currentCall: { callId, callerId: useAuthStore.getState().authUser._id, targetUserId, callType, isGroup, groupId }, isCallModalOpen: true });
  },
  acceptCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();
    const { callId, callerId } = incomingCall;

    socket?.emit("acceptCall", { callId, callerId });
    set({ currentCall: incomingCall, incomingCall: null });
  },

  rejectCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();
    const { callId, callerId } = incomingCall;

    socket?.emit("rejectCall", { callId, callerId });
    set({ incomingCall: null, isCallModalOpen: false });
  },

  endCall: () => {
    const { currentCall } = get();
    const { socket } = useAuthStore.getState();
    if (currentCall) {
      const participants = currentCall.isGroup
        ? currentCall.participants
        : [currentCall.targetUserId || currentCall.callerId];
      socket?.emit("endCall", { callId: currentCall.callId, participants });
      set({ currentCall: null, incomingCall: null, isCallModalOpen: false });
    }
  }
  // acceptCall: async (callData) => {
  //   console.log("✅ Accepting call:", callData);
  //   const { socket } = useAuthStore.getState();
  //   if (socket) {
  //     socket.emit('acceptCall', {
  //       callId: callData.callId,
  //       targetUserId: callData.callerId
  //     });
  //   }

  //   try {
  //     await axiosInstance.post('/api/calls/initiate', {
  //       callId: callData.callId,
  //       targetUserId: callData.callerId,
  //       callType: callData.callType,
  //       isGroup: callData.isGroup,
  //       groupId: callData.groupId
  //     })
  //   } catch (err) {
  //     console.error('Error initiating call record:', err)
  //   }

  //   set({
  //     incomingCall: null,
  //     currentCall: callData,
  //     isCallModalOpen: true
  //   });
  // },

  // rejectCall: (callData) => {
  //   console.log("❌ Rejecting call:", callData);
  //   const { socket } = useAuthStore.getState();
  //   if (socket) {
  //     socket.emit('rejectCall', {
  //       callId: callData.callId,
  //       targetUserId: callData.callerId
  //     });
  //   }
  //   set({
  //     incomingCall: null,
  //     currentCall: null,
  //     isCallModalOpen: false,

  //   });
  // },

  // endCall: () => {
  //   const { currentCall } = get();
  //   const { socket } = useAuthStore.getState();

  //   if (currentCall && socket) {
  //     socket.emit('endCall', {
  //       callId: currentCall.callId,
  //       participants: currentCall.isGroup
  //         ? currentCall.participants
  //         : [currentCall.targetUserId || currentCall.callerId]
  //     });
  //   }

  //   set({
  //     currentCall: null,
  //     incomingCall: null,
  //     isCallModalOpen: false
  //   });
  
}));
