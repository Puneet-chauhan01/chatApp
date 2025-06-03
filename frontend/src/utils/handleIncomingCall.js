// src/utils/handleIncomingCall.js
import { useCallStore } from '../store/useCallStore';

export const handleIncomingCall = (callData) => {
  useCallStore.getState().handleIncomingCall(callData);
};
