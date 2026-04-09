import React, { useState, useEffect, useMemo } from 'react';
import { handleGetUser } from '../Services/userService';
import { getImageUrl } from '../Services/uploadImageService';
import profileFallback from '../Styles/profilepic.jpg';

function partnerIdFromChat(data, currentUserId) {
  if (!data || currentUserId == null) return null;
  const s = data.senderId ?? data.senderID;
  const r = data.receiverId ?? data.receiverID;
  if (s == null || r == null) return null;
  return String(currentUserId) === String(s) ? r : s;
}

const Conversation = ({ data, currentUserId, online, active }) => {
  const [userData, setUserData] = useState(null);
  const partnerId = useMemo(() => partnerIdFromChat(data, currentUserId), [data, currentUserId]);

  useEffect(() => {
    const getUserData = async () => {
      if (partnerId == null) return;
      try {
        const payload = await handleGetUser(partnerId);
        setUserData(payload && !Array.isArray(payload) ? payload : null);
      } catch (error) {
        console.log(error);
        setUserData(null);
      }
    };
    getUserData();
  }, [partnerId]);

  const displayName = userData
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Partner'
    : '…';
  const imgSrc = userData?.profileImage ? getImageUrl(userData.profileImage) : profileFallback;

  return (
    <div className={`lm-chat-conv${active ? ' lm-chat-conv--active' : ''}`}>
      <div className="lm-chat-conv-avatar-wrap">
        <img src={imgSrc} alt="" className="lm-chat-conv-avatar" />
        {online ? <span className="lm-chat-conv-online" aria-label="Online" /> : null}
      </div>
      <div className="lm-chat-conv-body">
        <div className="lm-chat-conv-name">{displayName}</div>
        <div className={`lm-chat-conv-meta${online ? ' lm-chat-conv-meta--online' : ''}`}>
          {online ? 'Online 온라인' : 'Offline 오프라인'}
        </div>
      </div>
    </div>
  );
};

export default Conversation;
