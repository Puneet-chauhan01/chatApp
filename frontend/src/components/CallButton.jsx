// src/components/CallButton.jsx
import React from 'react';
import { Phone, Video } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useChatStore } from '../store/useChatStore';

const CallButton = () => {
  const { selectedChat } = useChatStore();
  const { setCurrentCall, setCallModalOpen } = useCallStore();

  if (!selectedChat) return null;

  const initiateCall = (callType) => {
    const callData = {
      callId: `call_${Date.now()}`,
      callType,
      isGroup: selectedChat.type === 'group',
      targetUserId: selectedChat.type === 'user' ? selectedChat.data._id : null,
      groupId: selectedChat.type === 'group' ? selectedChat.data._id : null,
      participants: selectedChat.type === 'group' 
        ? selectedChat.data.members.map(m => m._id) 
        : [selectedChat.data._id]
    };

    setCurrentCall(callData);
    setCallModalOpen(true);
  };

  return (
    <div className="flex space-x-2">
      {/* Audio Call Button */}
      <button
        onClick={() => initiateCall('audio')}
        className="btn btn-ghost btn-circle btn-sm"
        title="Voice Call"
      >
        <Phone size={18} />
      </button>

      {/* Video Call Button */}
      <button
        onClick={() => initiateCall('video')}
        className="btn btn-ghost btn-circle btn-sm"
        title="Video Call"
      >
        <Video size={18} />
      </button>
    </div>
  );
};

export default CallButton;
