import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export const useWebRTC = () => {
  const [localStream, setLocalStream]   = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callType, setCallType]         = useState(null)

  const pc        = useRef(null)
  const iceQueue  = useRef([])
  const callInfo  = useRef(null)
  const { socket }= useAuthStore()

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

  // Initialize or reset RTCPeerConnection
  const initPeer = useCallback(() => {
    if (pc.current) {
      // Clean up old connection
      pc.current.onicecandidate         = null
      pc.current.ontrack                = null
      pc.current.onconnectionstatechange= null
      pc.current.onsignalingstatechange = null
      pc.current.onnegotiationneeded    = null
      pc.current.close()
    }

    // Create new PC
    pc.current = new RTCPeerConnection(iceConfig)
    iceQueue.current = []

    pc.current.onicecandidate = ({ candidate }) => {
      if (candidate && callInfo.current) {
        socket.emit('webrtc-ice-candidate', {
          callId:    callInfo.current.callId,
          candidate,
          targetUserId: callInfo.current.peerId
        })
      }
    }

    pc.current.ontrack = ({ streams }) => {
      setRemoteStream(streams[0])
    }

    pc.current.onsignalingstatechange = () => {
      // Drain queued ICE candidates
      if (pc.current.signalingState === 'stable') {
        iceQueue.current.forEach(c =>
          pc.current.addIceCandidate(new RTCIceCandidate(c))
        )
        iceQueue.current = []
      }
    }

    pc.current.onconnectionstatechange = () => {
      if (pc.current.connectionState === 'connected') {
        setIsCallActive(true)
      }
    }

    // Perfect Negotiation Pattern
    pc.current.onnegotiationneeded = async () => {
      if (pc.current.signalingState !== 'stable') return
      try {
        const offer = await pc.current.createOffer()
        await pc.current.setLocalDescription(offer)
        socket.emit('webrtc-offer', {
          callId: callInfo.current.callId,
          offer,
          targetUserId: callInfo.current.peerId
        })
      } catch (err) {
        console.error('Negotiation error:', err)
      }
    }
  }, [socket])

  // Open local media and add tracks
  const openLocalStream = async (useVideo) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: useVideo
    })
    setLocalStream(stream)
    stream.getTracks().forEach(track => {
      if (pc.current && pc.current.signalingState !== 'closed') {
        pc.current.addTrack(track, stream)
      }
    })
    return stream
  }

  // Start an outgoing call
  const startCall = async ({ callId, peerId, type }) => {
    callInfo.current = { callId, peerId }
    setCallType(type)
    initPeer()
    await openLocalStream(type === 'video')
    // onnegotiationneeded will fire automatically
  }

  // Answer an incoming call
  const answerCall = async ({ callId, callerId, callType }) => {
    callInfo.current = { callId, peerId: callerId }
    setCallType(callType)
    initPeer()
    await openLocalStream(callType === 'video')
    socket.emit('acceptCall', { callId, targetUserId: callerId })
    // then wait for onoffer→answer
  }

  // End the call and clean up
  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    setIsCallActive(false)
    callInfo.current = null

    if (pc.current) {
      pc.current.onicecandidate         = null
      pc.current.ontrack                = null
      pc.current.onconnectionstatechange= null
      pc.current.onsignalingstatechange = null
      pc.current.onnegotiationneeded    = null
      pc.current.close()
      pc.current = null
    }
  }

  // Socket signaling handlers
  useEffect(() => {
    if (!socket) return

    const onOffer = async ({ callId, offer, callerId }) => {
      if (callInfo.current?.callId !== callId) return
      if (!pc.current) initPeer()
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
      if (callInfo.current?.callId !== callId) return
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const onIce = ({ callId, candidate }) => {
      if (callInfo.current?.callId !== callId) return
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
