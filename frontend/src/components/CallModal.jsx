

// export default CallModal;
import React, { useEffect } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { useCallStore } from '../store/useCallStore'
import { useWebRTC } from '../hooks/useWebRTC'

const CallModal = () => {
  const {
    incomingCall,
    currentCall,
    isCallModalOpen,
    setCallModalOpen,
    acceptCall,
    rejectCall,
    endCall: storeEndCall,
  } = useCallStore()

  const {
    localStream,
    remoteStream,
    isCallActive,
    callType,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall: rtcEndCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC()

  // Kick off WebRTC once user accepts or for outgoing
  useEffect(() => {
    if (!isCallModalOpen || !currentCall || isCallActive) return
    if (currentCall.callerId) {
      answerCall(currentCall)
    } else {
      startCall(currentCall)
    }
  }, [currentCall, isCallModalOpen, isCallActive, answerCall, startCall])

  const onAccept = () => {
    if (!incomingCall) return
    acceptCall(incomingCall)
  }

  const onReject = () => {
    if (!incomingCall) return
    rejectCall(incomingCall)
    setCallModalOpen(false)
  }

  const onHangUp = () => {
    rtcEndCall()
    storeEndCall()
    setCallModalOpen(false)
  }

  if (!isCallModalOpen) return null

  // 1) Incoming call: show only Accept/Reject
  if (incomingCall && !currentCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg text-center w-80">
          <h2 className="text-2xl font-bold mb-2">
            {incomingCall.isGroup ? 'Group Call' : 'Incoming Call'}
          </h2>
          <p className="mb-4 text-gray-600">
            {incomingCall.isGroup
              ? `Group ${incomingCall.callType} call`
              : `${incomingCall.callerName} is calling`}
          </p>
          <div className="flex justify-center space-x-6">
            <button
              onClick={onReject}
              className="btn btn-error btn-circle btn-lg"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={onAccept}
              className="btn btn-success btn-circle btn-lg"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2) Connecting: show spinner + Hang Up
  if (currentCall && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg text-center w-80">
          <h2 className="text-xl font-bold mb-2">
            {currentCall.callerId ? 'Answering Call' : 'Calling…'}
          </h2>
          <p className="mb-4 text-gray-600">
            {callType === 'video' ? 'Video Call' : 'Voice Call'} – Connecting...
          </p>
          <button onClick={onHangUp} className="btn btn-error btn-lg">
            Hang Up
          </button>
        </div>
      </div>
    )
  }

  // 3) Active call: show media + controls
  if (isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg w-full max-w-3xl h-4/5 flex flex-col">
          <header className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {currentCall.isGroup ? 'Group Call' : 'Call'}{' '}
              <span className="text-sm text-gray-500">
                ({callType === 'video' ? 'Video' : 'Audio'})
              </span>
            </h2>
            <button
              onClick={onHangUp}
              className="btn btn-error btn-sm"
            >
              End Call
            </button>
          </header>

          <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
            {callType === 'video' ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 w-40 h-32 bg-black rounded-md overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Phone size={64} />
                </div>
              </div>
            )}
          </div>

          <footer className="mt-4 flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className="btn btn-circle btn-lg bg-gray-200 hover:bg-gray-300"
            >
              {localStream?.getAudioTracks()[0]?.enabled ? (
                <Mic size={24} />
              ) : (
                <MicOff size={24} />
              )}
            </button>
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className="btn btn-circle btn-lg bg-gray-200 hover:bg-gray-300"
              >
                {localStream?.getVideoTracks()[0]?.enabled ? (
                  <Video size={24} />
                ) : (
                  <VideoOff size={24} />
                )}
              </button>
            )}
          </footer>
        </div>
      </div>
    )
  }

  return null
}

export default CallModal
