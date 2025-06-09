// // src/components/CallModal.jsx
// import React, { useEffect } from 'react'
// import { Phone, PhoneOff } from 'lucide-react'
// import { useCallStore }    from '../store/useCallStore'
// import AgoraCall           from './AgoraCall'

// const CallModal = () => {
//   const {
//     incomingCall,
//     currentCall,
//     isCallModalOpen,
//     setCallModalOpen,
//     acceptCall,
//     rejectCall
//   } = useCallStore()

//   // When user accepts or initiates, set currentCall → AgoraCall mounts
//   const onAccept = () => { incomingCall && acceptCall(incomingCall); };
//   const onReject = () => {
//     incomingCall && rejectCall(incomingCall);
//     setCallModalOpen(false);
//   };

//   if (!isCallModalOpen) return null

//   // 1) Incoming: Accept or Reject
//   if (incomingCall && !currentCall) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
//         <div className="bg-white p-6 rounded-lg text-center w-80">
//           <h2 className="text-2xl font-bold mb-2">
//             {incomingCall.isGroup ? 'Group Call' : 'Incoming Call'}
//           </h2>
//           <p className="mb-4 text-gray-600">
//             {incomingCall.isGroup
//               ? `Group ${incomingCall.callType} call`
//               : `${incomingCall.callerName} is calling`}
//           </p>
//           <div className="flex justify-center space-x-6">
//             <button onClick={onReject} className="btn btn-error btn-circle btn-lg">
//               <PhoneOff size={24}/>
//             </button>
//             <button onClick={onAccept} className="btn btn-success btn-circle btn-lg">
//               <Phone size={24}/>
//             </button>
//           </div>
//         </div>
//       </div>
//     )
//   }


//   // 3) Active: render Agora UIKit
//   if (currentCall) {
//     return <AgoraCall />
//   }

//   return null
// }

// export default CallModal


// src/components/CallModal.jsx
import React from "react"
import { Phone, PhoneOff } from "lucide-react"
import { useCallStore }    from "../store/useCallStore"
import AgoraCall           from "./AgoraCall"

const CallModal = () => {
  const {
    incomingCall,
    currentCall,
    isCallModalOpen,
    setCallModalOpen,
    acceptCall,
    rejectCall,
    endCall
  } = useCallStore()

  if (!isCallModalOpen) return null

  // Shared backdrop + centering
  const Overlay = ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {children}
    </div>
  )

  // 1) Ringing UI
  if (incomingCall && !currentCall) {
    return (
      <Overlay>
        <div className="bg-white p-6 rounded-lg text-center w-80">
          <h2 className="text-2xl font-bold mb-2">
            {incomingCall.isGroup ? "Group Call" : "Incoming Call"}
          </h2>
          <p className="mb-4 text-base-content/70">
            {incomingCall.isGroup
              ? `Group ${incomingCall.callType} call`
              : `${incomingCall.callerName} is calling`}
          </p>
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => { rejectCall(incomingCall); setCallModalOpen(false) }}
              className="btn btn-error btn-circle btn-lg"
            >
              <PhoneOff size={24}/>
            </button>
            <button
              onClick={() => acceptCall(incomingCall)}
              className="btn btn-success btn-circle btn-lg"
            >
              <Phone size={24}/>
            </button>
          </div>
        </div>
      </Overlay>
    )
  }

  // 2) Active call UI
  if (currentCall) {
    return (
      <Overlay>
        <div className="bg-black rounded-lg overflow-hidden w-full max-w-3xl h-[75vh]">
          <AgoraCall callbacks={{ EndCall: () => endCall() }}/>
        </div>
      </Overlay>
    )
  }

  return null
}

export default CallModal
