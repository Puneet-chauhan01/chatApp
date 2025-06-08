// backend/controllers/rtc.controller.js

import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

export const getAgoraToken = async (req, res) => {
  const { channelName } = req.body
  const account         = req.user._id.toString()  // string account
  const role            = RtcRole.PUBLISHER
  const expireTime      = Math.floor(Date.now()/1000) + 3600

  const token = RtcTokenBuilder.buildTokenWithAccount(
    process.env.AGORA_APP_ID,
    process.env.AGORA_APP_CERTIFICATE,
    channelName,
    account,
    role,
    expireTime
  )

  res.status(200).json({ 
    appId:       process.env.AGORA_APP_ID,
    token,
    channelName,
    uid: account          // pass this back as uid
  })
}
