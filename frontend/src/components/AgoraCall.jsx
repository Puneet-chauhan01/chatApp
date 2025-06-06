// src/components/AgoraCall.jsx
import React, { useEffect, useState } from 'react'
import AgoraUIKit from 'agora-react-uikit'
import { axiosInstance } from '../lib/axios'
import { useCallStore } from '../store/useCallStore'

const AgoraCall = () => {
    const { currentCall, endCall: storeEndCall } = useCallStore()
    const [rtcProps, setRtcProps] = useState(null)

    useEffect(() => {
        if (!currentCall) return

        // Fetch a token for the channel (callId)
        axiosInstance.post('/api/calls/token', {
            channelName: currentCall.callId
        }).then(({ data }) => {
            setRtcProps({
                appId: data.appId,
                channel: data.channelName,
                token: data.token
            })
        }).catch(console.error)
    }, [currentCall])


    if (!rtcProps) return null
    const callbacks = {
        EndCall: () => {
            // 3) update ended status
            axios.put(`/api/calls/${currentCall.callId}/status`, {
                status: 'ended'
            }).catch(console.error)

            storeEndCall()
        },
        StartCall: () => {
            // 2) update active status
            axios.put(`/api/calls/${currentCall.callId}/status`, {
                status: 'active'
            }).catch(console.error)
        }
    }

    return <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />

}

export default AgoraCall
