// // src/hooks/useWebRTC.js - COMPLETE SDP ORDER FIX
// import { useEffect, useRef, useState } from 'react';
// import { useAuthStore } from '../store/useAuthStore';

// export const useWebRTC = () => {
//     const [localStream, setLocalStream] = useState(null);
//     const [remoteStream, setRemoteStream] = useState(null);
//     const [isCallActive, setIsCallActive] = useState(false);
//     const [callType, setCallType] = useState(null);

//     const peerConnection = useRef(null);
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const currentCallData = useRef(null);
//     const pendingCandidates = useRef([]);
//     const isCallInProgress = useRef(false);
//     const isNegotiating = useRef(false); // ✅ Prevent multiple negotiations

//     const { socket } = useAuthStore();

//     // Enhanced WebRTC Configuration
//     // src/hooks/useWebRTC.js - ENHANCED TURN SERVERS
//     const rtcConfig = {
//         iceServers: [
//             { urls: 'stun:stun.l.google.com:19302' },
//             { urls: 'stun:stun1.l.google.com:19302' },
//             { urls: 'stun:stun2.l.google.com:19302' },
//             // ✅ Add more reliable TURN servers for production
//             {
//                 urls: 'turn:openrelay.metered.ca:80',
//                 username: 'openrelayproject',
//                 credential: 'openrelayproject'
//             },
//             {
//                 urls: 'turn:openrelay.metered.ca:443',
//                 username: 'openrelayproject',
//                 credential: 'openrelayproject'
//             },
//             {
//                 urls: 'turn:openrelay.metered.ca:443?transport=tcp',
//                 username: 'openrelayproject',
//                 credential: 'openrelayproject'
//             },
//             // ✅ Add backup TURN servers
//             {
//                 urls: 'turn:relay.backups.cz',
//                 username: 'webrtc',
//                 credential: 'webrtc'
//             },
//             {
//                 urls: 'turn:relay.backups.cz:443',
//                 username: 'webrtc',
//                 credential: 'webrtc'
//             }
//         ]
//     };


//     // ✅ ENHANCED Initialize peer connection with complete cleanup
//     const initializePeerConnection = () => {
//         // ✅ CRITICAL: Complete cleanup to prevent SDP order errors
//         if (peerConnection.current) {
//             peerConnection.current.onicecandidate = null;
//             peerConnection.current.ontrack = null;
//             peerConnection.current.onconnectionstatechange = null;
//             peerConnection.current.oniceconnectionstatechange = null;
//             peerConnection.current.onnegotiationneeded = null;
//             peerConnection.current.onsignalingstatechange = null;

//             // Close and nullify
//             peerConnection.current.close();
//             peerConnection.current = null;

//             console.log('🧹 Cleaned up previous peer connection');
//         }

//         console.log('🔧 Initializing new peer connection');
//         peerConnection.current = new RTCPeerConnection(rtcConfig);
//         pendingCandidates.current = [];
//         isNegotiating.current = false;

//         // ✅ Enhanced signaling state tracking
//         peerConnection.current.onsignalingstatechange = () => {
//             const state = peerConnection.current.signalingState;
//             console.log('📊 Signaling state:', state);

//             if (state === 'stable') {
//                 isNegotiating.current = false;
//                 console.log('✅ Negotiation completed, connection stable');
//             }
//         };

//         // ✅ Prevent multiple negotiations
//         peerConnection.current.onnegotiationneeded = async () => {
//             if (isNegotiating.current) {
//                 console.log('⚠️ Negotiation already in progress, skipping');
//                 return;
//             }

//             try {
//                 isNegotiating.current = true;
//                 console.log('🔄 Negotiation needed, creating offer...');

//                 const offer = await peerConnection.current.createOffer();
//                 await peerConnection.current.setLocalDescription(offer);

//                 if (currentCallData.current && socket) {
//                     socket.emit('webrtc-offer', {
//                         offer,
//                         targetUserId: currentCallData.current.targetUserId,
//                         callId: currentCallData.current.callId
//                     });
//                 }
//             } catch (error) {
//                 console.error('❌ Error in negotiation:', error);
//                 isNegotiating.current = false;
//             }
//         };

//         // Handle ICE candidates
//         peerConnection.current.onicecandidate = (event) => {
//             if (event.candidate && socket && currentCallData.current) {
//                 console.log('🧊 Sending ICE candidate:', event.candidate.type);
//                 socket.emit('webrtc-ice-candidate', {
//                     candidate: event.candidate,
//                     targetUserId: currentCallData.current.targetUserId || currentCallData.current.callerId,
//                     callId: currentCallData.current.callId
//                 });
//             } else if (!event.candidate) {
//                 console.log('🧊 ICE gathering completed');
//             }
//         };

//         // Handle remote stream
//         peerConnection.current.ontrack = (event) => {
//             console.log('🎥 Remote stream received, streams:', event.streams.length);
//             const stream = event.streams[0];
//             setRemoteStream(stream);

//             if (remoteVideoRef.current) {
//                 remoteVideoRef.current.srcObject = stream;
//                 console.log('🎥 Remote stream assigned to element');
//             }
//         };

//         // Enhanced connection state monitoring
//         peerConnection.current.onconnectionstatechange = () => {
//             const state = peerConnection.current.connectionState;
//             console.log('🔗 Connection state changed to:', state);

//             if (state === 'connected') {
//                 setIsCallActive(true);
//                 console.log('✅ Call successfully connected!');
//             } else if (state === 'failed') {
//                 console.log('❌ Call connection failed');
//                 setTimeout(() => {
//                     if (peerConnection.current?.connectionState === 'failed') {
//                         endCall();
//                     }
//                 }, 3000); // Wait 3 seconds before ending on failure
//             } else if (state === 'disconnected') {
//                 console.log('⚠️ Call temporarily disconnected');
//                 // Don't auto-end on temporary disconnection
//             }
//         };

//         // ICE connection state monitoring
//         peerConnection.current.oniceconnectionstatechange = () => {
//             const iceState = peerConnection.current.iceConnectionState;
//             console.log('🧊 ICE connection state:', iceState);

//             if (iceState === 'connected' || iceState === 'completed') {
//                 console.log('✅ ICE connected - media should flow now');
//                 setIsCallActive(true);
//             } else if (iceState === 'failed') {
//                 console.log('❌ ICE connection failed');
//                 setTimeout(() => {
//                     if (peerConnection.current?.iceConnectionState === 'failed') {
//                         endCall();
//                     }
//                 }, 5000); // Wait 5 seconds before ending on ICE failure
//             }
//         };
//     };

//     // Process queued ICE candidates
//     const processQueuedCandidates = async () => {
//         if (!peerConnection.current?.remoteDescription) return;

//         console.log(`📦 Processing ${pendingCandidates.current.length} queued candidates`);

//         for (const candidate of pendingCandidates.current) {
//             try {
//                 await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
//                 console.log('✅ Added queued ICE candidate');
//             } catch (error) {
//                 console.error('❌ Error adding queued candidate:', error);
//             }
//         }

//         pendingCandidates.current = [];
//     };

//     // Enhanced media acquisition
//     const getUserMedia = async (video = true, audio = true) => {
//         try {
//             const constraints = {
//                 video: video ? {
//                     width: { ideal: 640, max: 1280 }, // Lower resolution for stability
//                     height: { ideal: 480, max: 720 },
//                     frameRate: { ideal: 15, max: 30 }
//                 } : false,
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     autoGainControl: true,
//                     sampleRate: 22050 // Lower sample rate for stability
//                 }
//             };

//             console.log('🎤 Requesting media with constraints:', constraints);
//             const stream = await navigator.mediaDevices.getUserMedia(constraints);

//             stream.getTracks().forEach(track => {
//                 console.log(`🎵 Got ${track.kind} track:`, track.label, 'enabled:', track.enabled);
//             });

//             setLocalStream(stream);
//             if (localVideoRef.current) {
//                 localVideoRef.current.srcObject = stream;
//                 localVideoRef.current.muted = true;
//             }

//             // Add tracks to peer connection
//             if (peerConnection.current) {
//                 stream.getTracks().forEach(track => {
//                     console.log('🎵 Adding track to peer connection:', track.kind);
//                     peerConnection.current.addTrack(track, stream);
//                 });
//             }

//             return stream;
//         } catch (error) {
//             console.error('❌ Error accessing media devices:', error);
//             throw error;
//         }
//     };

//     // ✅ Start a call (outgoing) - Fixed to prevent SDP order errors
//     const startCall = async (targetUserId, type = 'video', isGroup = false, groupId = null) => {
//         if (isCallInProgress.current) {
//             console.log('⚠️ Call already in progress, ignoring new call request');
//             return;
//         }

//         try {
//             console.log('📞 Starting call:', { targetUserId, type, isGroup });

//             isCallInProgress.current = true;
//             setCallType(type);

//             currentCallData.current = {
//                 targetUserId,
//                 callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//                 callType: type,
//                 isGroup,
//                 groupId
//             };

//             // ✅ CRITICAL: Initialize peer connection FIRST
//             initializePeerConnection();
//             await getUserMedia(type === 'video', true);

//             // ✅ Wait for negotiation to complete naturally via onnegotiationneeded
//             // Don't manually create offer here to prevent SDP order issues

//             // Emit call initiation
//             socket.emit('initiateCall', {
//                 targetUserId,
//                 callType: type,
//                 isGroup,
//                 groupId
//             });

//         } catch (error) {
//             console.error('❌ Error starting call:', error);
//             isCallInProgress.current = false;
//             endCall();
//         }
//     };

//     // ✅ Answer a call (incoming) - Fixed peer connection timing
//     const answerCall = async (callData) => {
//         if (isCallInProgress.current) {
//             console.log('⚠️ Call already in progress, cannot answer new call');
//             return;
//         }

//         try {
//             console.log('📞 Answering call:', callData);

//             isCallInProgress.current = true;
//             setCallType(callData.callType);
//             currentCallData.current = callData;

//             // ✅ Initialize peer connection BEFORE any WebRTC operations
//             initializePeerConnection();
//             await getUserMedia(callData.callType === 'video', true);

//             socket.emit('acceptCall', {
//                 callId: callData.callId,
//                 targetUserId: callData.callerId
//             });

//         } catch (error) {
//             console.error('❌ Error answering call:', error);
//             isCallInProgress.current = false;
//             endCall();
//         }
//     };

//     // ✅ End call - Enhanced cleanup
//     const endCall = () => {
//         if (!isCallInProgress.current) {
//             console.log('⚠️ No call in progress to end');
//             return;
//         }

//         console.log('📵 Ending call');

//         // Stop local stream
//         if (localStream) {
//             localStream.getTracks().forEach(track => {
//                 track.stop();
//                 console.log('🛑 Stopped track:', track.kind);
//             });
//             setLocalStream(null);
//         }

//         // ✅ ENHANCED peer connection cleanup
//         if (peerConnection.current) {
//             peerConnection.current.onicecandidate = null;
//             peerConnection.current.ontrack = null;
//             peerConnection.current.onconnectionstatechange = null;
//             peerConnection.current.oniceconnectionstatechange = null;
//             peerConnection.current.onnegotiationneeded = null;
//             peerConnection.current.onsignalingstatechange = null;

//             peerConnection.current.close();
//             peerConnection.current = null;
//         }

//         setRemoteStream(null);
//         setIsCallActive(false);
//         setCallType(null);
//         pendingCandidates.current = [];
//         isCallInProgress.current = false;
//         isNegotiating.current = false;

//         if (currentCallData.current && socket) {
//             socket.emit('endCall', {
//                 callId: currentCallData.current.callId,
//                 participants: [currentCallData.current.targetUserId || currentCallData.current.callerId]
//             });
//         }

//         currentCallData.current = null;
//     };

//     // ✅ Socket event listeners with SDP order error prevention
//     useEffect(() => {
//         if (!socket) return;

//         const handleWebRTCOffer = async ({ offer, callerId, callId }) => {
//             // ✅ Check signaling state before processing offer
//             if (peerConnection.current?.signalingState === 'have-remote-offer') {
//                 console.log('⚠️ Already have remote offer, ignoring duplicate');
//                 return;
//             }

//             if (!peerConnection.current) {
//                 console.log('⚠️ No peer connection when offer received, initializing...');
//                 initializePeerConnection();
//             }

//             try {
//                 console.log('📥 Received WebRTC offer from:', callerId);

//                 // ✅ Check if we can set remote description
//                 if (peerConnection.current.signalingState !== 'stable' &&
//                     peerConnection.current.signalingState !== 'have-local-offer') {
//                     console.log('⚠️ Invalid signaling state for offer:', peerConnection.current.signalingState);
//                     return;
//                 }

//                 await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
//                 console.log('✅ Remote description set from offer');

//                 await processQueuedCandidates();

//                 console.log('📤 Creating answer...');
//                 const answer = await peerConnection.current.createAnswer();
//                 await peerConnection.current.setLocalDescription(answer);

//                 console.log('📤 Sending answer via socket');
//                 socket.emit('webrtc-answer', {
//                     answer,
//                     targetUserId: callerId,
//                     callId
//                 });
//             } catch (error) {
//                 console.error('❌ Error handling WebRTC offer:', error);
//             }
//         };

//         const handleWebRTCAnswer = async ({ answer }) => {
//             if (!peerConnection.current) {
//                 console.log('❌ No peer connection when answer received');
//                 return;
//             }

//             // ✅ Check signaling state before processing answer
//             if (peerConnection.current.signalingState !== 'have-local-offer') {
//                 console.log('⚠️ Invalid signaling state for answer:', peerConnection.current.signalingState);
//                 return;
//             }

//             try {
//                 console.log('📥 Received WebRTC answer');

//                 await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
//                 console.log('✅ Remote description set from answer');

//                 await processQueuedCandidates();
//             } catch (error) {
//                 console.error('❌ Error handling WebRTC answer:', error);
//             }
//         };

//         const handleWebRTCIceCandidate = async ({ candidate }) => {
//             if (!peerConnection.current) {
//                 console.log('❌ No peer connection when ICE candidate received');
//                 return;
//             }

//             try {
//                 if (peerConnection.current.remoteDescription) {
//                     await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
//                     console.log('✅ Added ICE candidate immediately');
//                 } else {
//                     console.log('📦 Queuing ICE candidate (remote description not set)');
//                     pendingCandidates.current.push(candidate);
//                 }
//             } catch (error) {
//                 console.error('❌ Error handling ICE candidate:', error);
//             }
//         };

//         socket.on('webrtc-offer', handleWebRTCOffer);
//         socket.on('webrtc-answer', handleWebRTCAnswer);
//         socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);

//         return () => {
//             socket.off('webrtc-offer', handleWebRTCOffer);
//             socket.off('webrtc-answer', handleWebRTCAnswer);
//             socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
//         };
//     }, [socket]);

//     const toggleVideo = () => {
//         if (localStream) {
//             const videoTrack = localStream.getVideoTracks()[0];
//             if (videoTrack) {
//                 videoTrack.enabled = !videoTrack.enabled;
//                 return videoTrack.enabled;
//             }
//         }
//         return false;
//     };

//     const toggleAudio = () => {
//         if (localStream) {
//             const audioTrack = localStream.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = !audioTrack.enabled;
//                 return audioTrack.enabled;
//             }
//         }
//         return false;
//     };

//     return {
//         localStream,
//         remoteStream,
//         isCallActive,
//         callType,
//         localVideoRef,
//         remoteVideoRef,
//         startCall,
//         answerCall,
//         endCall,
//         toggleVideo,
//         toggleAudio
//     };
// };


// src/hooks/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export const useWebRTC = () => {
  const [localStream, setLocalStream]     = useState(null)
  const [remoteStream, setRemoteStream]   = useState(null)
  const [isCallActive, setIsCallActive]   = useState(false)
  const [callType, setCallType]           = useState(null)

  const pc        = useRef(null)
  const pending   = useRef([])
  const callData  = useRef(null)
  const { socket }= useAuthStore()

  // TURN+STUN servers
  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  }

  // Initialize or reset RTCPeerConnection
  const initPeer = useCallback(() => {
    if (pc.current) pc.current.close()
    pc.current = new RTCPeerConnection(iceConfig)
    pending.current = []

    pc.current.ontrack = ({ streams }) => {
      setRemoteStream(streams[0])
    }

    pc.current.onicecandidate = ({ candidate }) => {
      if (candidate && socket && callData.current) {
        socket.emit('webrtc-ice-candidate', {
          callId:    callData.current.callId,
          candidate,
          targetUserId: callData.current.targetUserId
        })
      }
    }

    pc.current.onconnectionstatechange = () => {
      if (pc.current.connectionState === 'connected') {
        setIsCallActive(true)
      }
    }
  }, [socket])

  // Drain queued ICE once remoteDesc is set
  const processPending = useCallback(async () => {
    if (!pc.current.remoteDescription) return
    await Promise.all(pending.current.map(c =>
      pc.current.addIceCandidate(new RTCIceCandidate(c))
    ))
    pending.current = []
  }, [])

  // Share media and attach to local video ref
  const openLocalStream = async (wantVideo) => {
    const constraints = {
      audio: true,
      video: wantVideo
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    setLocalStream(stream)
    stream.getTracks().forEach(t => pc.current.addTrack(t, stream))
    return stream
  }

  // Outgoing call: create offer automatically on peer connect
  const startCall = async ({ callId, targetUserId, type }) => {
    callData.current = { callId, targetUserId, callType: type }
    setCallType(type)

    initPeer()
    await openLocalStream(type === 'video')

    // Wait for ICE gathering & local description
    const offer = await pc.current.createOffer()
    await pc.current.setLocalDescription(offer)
    socket.emit('webrtc-offer', {
      callId,
      targetUserId,
      offer
    })
  }

  // Incoming call: answer the received offer
  const answerCall = async ({ callId, callerId, callType }) => {
    callData.current = { callId, targetUserId: callerId }
    setCallType(callType)

    initPeer()
    await openLocalStream(callType === 'video')

    socket.emit('acceptCall', { callId, targetUserId: callerId })

    // Wait offer→answer exchange via socket listener
  }

  // End call manually
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop())
      setLocalStream(null)
    }
    if (pc.current) pc.current.close()
    setRemoteStream(null)
    setIsCallActive(false)
    callData.current = null
  }

  // Socket signaling handlers
  useEffect(() => {
    if (!socket) return

    const onOffer = async ({ callId, offer, callerId }) => {
      // queue or apply
      if (!pc.current) initPeer()
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
      await processPending()

      const answer = await pc.current.createAnswer()
      await pc.current.setLocalDescription(answer)
      socket.emit('webrtc-answer', { callId, answer, targetUserId: callerId })
    }

    const onAnswer = async ({ callId, answer }) => {
      if (callData.current?.callId !== callId) return
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
      await processPending()
    }

    const onCandidate = ({ callId, candidate }) => {
      if (callData.current?.callId !== callId) return
      if (pc.current.remoteDescription) {
        pc.current.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        pending.current.push(candidate)
      }
    }

    socket.on('webrtc-offer', onOffer)
    socket.on('webrtc-answer', onAnswer)
    socket.on('webrtc-ice-candidate', onCandidate)

    return () => {
      socket.off('webrtc-offer', onOffer)
      socket.off('webrtc-answer', onAnswer)
      socket.off('webrtc-ice-candidate', onCandidate)
    }
  }, [socket, initPeer, processPending])

  return {
    localStream,
    remoteStream,
    isCallActive,
    callType,
    startCall,
    answerCall,
    endCall,
    localVideoRef:   (el) => el && (el.srcObject = localStream),
    remoteVideoRef:  (el) => el && (el.srcObject = remoteStream),
    toggleAudio:    () => {
      const track = localStream?.getAudioTracks()[0]
      if (track) track.enabled = !track.enabled
    },
    toggleVideo:    () => {
      const track = localStream?.getVideoTracks()[0]
      if (track) track.enabled = !track.enabled
    }
  }
}
