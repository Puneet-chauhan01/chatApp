// src/hooks/useWebRTC.js
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export const useWebRTC = () => {
  const [localStream,   setLocalStream]   = useState(null)
  const [remoteStream,  setRemoteStream]  = useState(null)
  const [isCallActive,  setIsCallActive]  = useState(false)
  const [callType,      setCallType]      = useState(null)

  const pc           = useRef(null)
  const iceQueue     = useRef([])
  const callDetails  = useRef(null)
  const { socket }   = useAuthStore()
  const pcInitialized= useRef(false)    // ← guard to avoid multiple PCs

  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls:       'turn:openrelay.metered.ca:80',
        username:   'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  }

  // Initialize RTC once per call
  const initPeer = useCallback(() => {
    if (pcInitialized.current) return   // ← only once
    pcInitialized.current = true

    // Clean up any existing connection
    if (pc.current) {
      pc.current.close()
    }

    pc.current = new RTCPeerConnection(iceConfig)
    iceQueue.current = []

    pc.current.onicecandidate = ({ candidate }) => {
      if (candidate && callDetails.current) {
        socket.emit('webrtc-ice-candidate', {
          callId:    callDetails.current.callId,
          candidate,
          targetUserId: callDetails.current.peerId
        })
      }
    }

    pc.current.ontrack = ({ streams }) => {
      setRemoteStream(streams[0])
    }

    pc.current.onsignalingstatechange = () => {
      if (pc.current.signalingState === 'stable') {
        // add queued ICE
        iceQueue.current.forEach(cand =>
          pc.current.addIceCandidate(new RTCIceCandidate(cand))
        )
        iceQueue.current = []
      }
    }

    pc.current.onconnectionstatechange = () => {
      if (pc.current.connectionState === 'connected') {
        setIsCallActive(true)
      }
    }

    // Perfect negotiation
    pc.current.onnegotiationneeded = async () => {
      if (pc.current.signalingState !== 'stable') return
      const offer = await pc.current.createOffer()
      await pc.current.setLocalDescription(offer)
      socket.emit('webrtc-offer', {
        callId: callDetails.current.callId,
        offer,
        targetUserId: callDetails.current.peerId
      })
    }
  }, [socket])

  // Get and attach local media
  const openLocalStream = async wantVideo => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: wantVideo
    })
    setLocalStream(stream)
    stream.getTracks().forEach(track => {
      if (pc.current && pc.current.signalingState !== 'closed') {
        pc.current.addTrack(track, stream)
      }
    })
    return stream
  }

  // Outgoing
  const startCall = async ({ callId, peerId, callType }) => {
    callDetails.current = { callId, peerId }
    setCallType(callType)
    initPeer()
    await openLocalStream(callType === 'video')
    // onnegotiationneeded fires automatically
  }

  // Answer
  const answerCall = async ({ callId, callerId, callType }) => {
    callDetails.current = { callId, peerId: callerId }
    setCallType(callType)
    initPeer()
    await openLocalStream(callType === 'video')
    socket.emit('acceptCall', { callId, targetUserId: callerId })
    // remote offer arrives, then we answer in onOffer below
  }

  // Hang up
  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    setIsCallActive(false)
    callDetails.current = null
    pcInitialized.current = false
    if (pc.current) {
      pc.current.close()
      pc.current = null
    }
  }

  // Signaling
  useEffect(() => {
    if (!socket) return

    const onOffer = async ({ callId, offer, callerId }) => {
      if (callDetails.current?.callId !== callId) return
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.current.createAnswer()
      await pc.current.setLocalDescription(answer)
      socket.emit('webrtc-answer', {
        callId,
        answer,
        targetUserId: callerId
      })
    }

    const onAnswer = async ({ callId, answer }) => {
      if (callDetails.current?.callId !== callId) return
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const onIce = ({ callId, candidate }) => {
      if (callDetails.current?.callId !== callId) return
      if (pc.current.remoteDescription) {
        pc.current.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        iceQueue.current.push(candidate)
      }
    }

    socket.on('webrtc-offer', onOffer)
    socket.on('webrtc-answer', onAnswer)
    socket.on('webrtc-ice-candidate', onIce)

    return () => {
      socket.off('webrtc-offer', onOffer)
      socket.off('webrtc-answer', onAnswer)
      socket.off('webrtc-ice-candidate', onIce)
    }
  }, [socket, initPeer])

  return {
    localStream,
    remoteStream,
    isCallActive,
    callType,
    startCall,
    answerCall,
    endCall,
    localVideoRef:  el => el && (el.srcObject = localStream),
    remoteVideoRef: el => el && (el.srcObject = remoteStream),
    toggleAudio:   () => {
      const t = localStream?.getAudioTracks()?.[0]
      if (t) t.enabled = !t.enabled
    },
    toggleVideo:   () => {
      const t = localStream?.getVideoTracks()?.[0]
      if (t) t.enabled = !t.enabled
    }
  }
}
