import React, { useState, useEffect, useRef } from 'react';
import { handleGetUser, getMessages, addMessage } from '../Services/userService';
import './ChatBox.css';
import profileFallback from '../Styles/profilepic.jpg';
import { format } from 'timeago.js';
import InputEmoji from 'react-input-emoji';
import { getImageUrl } from '../Services/uploadImageService';

function partnerIdFromChat(chat, currentUser) {
  if (!chat || currentUser == null) return null;
  const s = chat.senderId ?? chat.senderID;
  const r = chat.receiverId ?? chat.receiverID;
  if (s == null || r == null) return null;
  return String(currentUser) === String(s) ? r : s;
}

const ChatBox = ({ chat, currentUser, setSendMessage, receivedMessage }) => {
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scroll = useRef(null);
  const chatId = chat?.id ?? chat?.chatId;

  useEffect(() => {
    const userId = partnerIdFromChat(chat, currentUser);
    const getUserData = async () => {
      if (userId == null) {
        setUserData(null);
        return;
      }
      try {
        const data = await handleGetUser(userId);
        setUserData(data && !Array.isArray(data) ? data : null);
      } catch (error) {
        console.log(error);
        setUserData(null);
      }
    };
    if (chat) getUserData();
    else setUserData(null);
  }, [chat, currentUser]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId == null) return;
      try {
        const data = await getMessages(chatId);
        const list = data?.chatsData;
        setMessages(Array.isArray(list) ? list : []);
      } catch (error) {
        console.log(error);
        setMessages([]);
      }
    };
    if (chat) fetchMessages();
    else setMessages([]);
  }, [chat, chatId]);

  useEffect(() => {
    if (!chat || !receivedMessage || receivedMessage.chatId !== chatId) return;
    setMessages((prev) => [...prev, receivedMessage]);
  }, [receivedMessage, chat, chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = (newMessage || '').trim();
    if (!chat || chatId == null || !text) return;

    const message = {
      senderId: currentUser,
      text,
      chatId,
    };

    const receiverId = chat.receiverId ?? chat.receiverID;
    setSendMessage([...messages, receiverId]);
    try {
      const data = await addMessage(message);
      if (data?.messageData) {
        setMessages((prev) => [...prev, data.messageData]);
      }
      setNewMessage('');
    } catch {
      console.log('error');
    }
  };

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const displayName = userData
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Partner'
    : '…';
  const headerImg = userData?.profileImage ? getImageUrl(userData.profileImage) : profileFallback;

  return (
    <div className="lm-chatbox">
      {chat ? (
        <>
          <header className="lm-chatbox-header">
            <div className="lm-chatbox-header-main">
              <img src={headerImg} alt="" className="lm-chatbox-header-avatar" />
              <div>
                <h2 className="lm-chatbox-header-name">{displayName}</h2>
                <p className="lm-chatbox-header-sub" lang="ko">
                  Message <span className="lm-chatbox-header-sub-ko">메시지</span>
                </p>
              </div>
            </div>
          </header>

          <div className="lm-chatbox-body">
            {messages.map((message) => {
              const own = String(message.senderId) === String(currentUser);
              return (
                <div
                  key={message.id ?? `${message.createdAt}-${message.text}`}
                  className={own ? 'lm-chat-bubble lm-chat-bubble--own' : 'lm-chat-bubble'}
                >
                  <span className="lm-chat-bubble-text">{message.text}</span>
                  <time className="lm-chat-bubble-time">{format(message.createdAt)}</time>
                </div>
              );
            })}
            <div ref={scroll} />
          </div>

          <form className="lm-chatbox-composer" onSubmit={handleSend}>
            <InputEmoji
              value={newMessage}
              onChange={setNewMessage}
              placeholder="Type a message…"
            />
            <button type="submit" className="lm-chatbox-send">
              Send <span lang="ko">보내기</span>
            </button>
          </form>
        </>
      ) : (
        <div className="lm-chatbox-empty">
          <p className="lm-chatbox-empty-title">Select a chat</p>
          <p className="lm-chatbox-empty-sub" lang="ko">
            Tap a conversation to start · 대화를 선택하세요
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
