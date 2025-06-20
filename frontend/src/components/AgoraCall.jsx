// // src/components/AgoraCall.jsx
// import React, { useEffect, useState } from 'react';
// import AgoraUIKit from 'agora-react-uikit';
// import { useCallStore } from '../store/useCallStore';
// import axiosInstance from '../lib/axios'; // Ensure this points to your axios instance
// export default function AgoraCall() {
//   const { currentCall, endCall: storeEndCall } = useCallStore();
//   const [rtcProps, setRtcProps] = useState(null);
//   const [rtmProps, setRtmProps]               = useState(null)

//   // src/components/AgoraCall.jsx
// useEffect(() => {
//   if (!currentCall) return
//   axiosInstance.post('/calls/token', { channelName: currentCall.callId })
//     .then(({ data }) => {
//       setRtcProps({
//         appId:   data.appId,
//         channel: data.channelName,
//         token:   data.token,
//         uid:     data.uid        // ← ensure uid is set
//       })
//       setRtmProps({
//           token: data.rtmToken,
//           uid:   data.uid
//         })
//     })
//     .catch(console.error)
// }, [currentCall])


//   if (!rtcProps||!rtmProps) return null;

//   return (
//     <div className="fixed inset-0 bg-black z-50">
//        <AgoraUIKit
//         rtcProps={rtcProps}
//         rtmProps={rtmProps}
//         callbacks={{
//           EndCall: () => {
//             storeEndCall()
//           }
//         }}
//       />
//     </div>
//   );
// }

// src/components/AgoraCall.jsx
import React, { useEffect, useState } from 'react'
import AgoraUIKit from 'agora-react-uikit'
import { axiosInstance } from '../lib/axios'
import { useCallStore }   from '../store/useCallStore'

export default function AgoraCall() {
  const { currentCall, endCall } = useCallStore()
  const [props, setProps]        = useState(null)

  useEffect(() => {
    if (!currentCall) return
    axiosInstance.post('/calls/token', { channelName: currentCall.callId })
      .then(({ data }) =>
        setProps({
          rtcProps: { appId: data.appId, channel: data.channelName, token: data.rtcToken, uid: data.uid },
          rtmProps: { token: data.rtmToken, uid: data.uid }
        })
      )
      .catch(console.error)
  }, [currentCall])

  if (!props) return null

  return (
    <AgoraUIKit
      rtcProps={props.rtcProps}
      rtmProps={props.rtmProps}
      callbacks={{ EndCall: () => endCall() }}
    />
  )
}
