// src/components/CallModal.jsx - UPDATED VERSION
import React, { useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';

const CallModal = () => {
  const { 
    currentCall, 
    incomingCall,
    isCallModalOpen, 
    setCallModalOpen, 
    acceptCall,
    rejectCall,
    endCall 
  } = useCallStore();

  const {
    localStream,
    remoteStream,
    isCallActive,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall: endWebRTCCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC();

  useEffect(() => {
    if (currentCall && isCallModalOpen && !isCallActive) {
      if (currentCall.callerId) {
        answerCall(currentCall);
      } else {
        startCall(
          currentCall.targetUserId,
          currentCall.callType,
          currentCall.isGroup,
          currentCall.groupId
        );
      }
    }
  }, [currentCall, isCallModalOpen, isCallActive]);

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      rejectCall(incomingCall);
    }
  };

  const handleEndCall = () => {
    endWebRTCCall();
    endCall();
    setCallModalOpen(false);
  };

  if (!isCallModalOpen) return null;

  // Incoming call UI
  if (incomingCall && !currentCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-8 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {incomingCall.callType === 'video' ? (
                <Video size={32} className="text-primary-content" />
              ) : (
                <Phone size={32} className="text-primary-content" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {incomingCall.isGroup ? 'Group Call' : 'Incoming Call'}
            </h2>
            <p className="text-base-content/70">
              {incomingCall.isGroup 
                ? `Group ${incomingCall.callType} call` 
                : `${incomingCall.callerName} is calling`
              }
            </p>
            <p className="text-sm text-base-content/50 mt-1">
              {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
          </div>

          <div className="flex justify-center space-x-6">
            <button
              onClick={handleRejectCall}
              className="btn btn-circle btn-lg btn-error"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={handleAcceptCall}
              className="btn btn-circle btn-lg btn-success"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  if (currentCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-6 w-full max-w-4xl h-3/4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {currentCall.isGroup ? 'Group Call' : 'Call'}
            </h2>
            <div className="text-sm text-base-content/60">
              {isCallActive ? 'Connected' : 'Connecting...'}
            </div>
          </div>

          <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
            {currentCall.callType === 'video' && (
              <>
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            )}

            {/* Audio Call Interface */}
            {currentCall.callType === 'audio' && (
              <>
                {/* Hidden audio elements for audio-only calls */}
                <audio
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
                <audio
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Phone size={48} className="text-primary-content" />
                    </div>
                    <h3 className="text-xl text-white">
                      {currentCall.isGroup ? 'Group Call' : 'Voice Call'}
                    </h3>
                    <p className="text-gray-300">
                      {isCallActive ? 'Connected' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={toggleAudio}
              className="btn btn-circle btn-lg bg-gray-600 hover:bg-gray-500"
            >
              <Mic size={24} />
            </button>

            {currentCall.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className="btn btn-circle btn-lg bg-gray-600 hover:bg-gray-500"
              >
                <Video size={24} />
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="btn btn-circle btn-lg btn-error"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CallModal;
