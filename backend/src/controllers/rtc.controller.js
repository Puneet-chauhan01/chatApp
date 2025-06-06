// backend/controllers/rtc.controller.js
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

export const getAgoraToken = (req, res) => {
  const { channelName } = req.body;
  const uid = req.user._id.toString();    // use your user ID
  const appId = process.env.AGORA_APP_ID;
  const appCert = process.env.AGORA_APP_CERTIFICATE;
  const expireTime = 3600;                 // 1 hour

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    Math.floor(Date.now()/1000) + expireTime
  );

  return res.status(200).json({ appId, token, channelName, uid });
};
