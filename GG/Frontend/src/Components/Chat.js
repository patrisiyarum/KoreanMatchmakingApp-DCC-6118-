import { useState, useEffect, useRef } from 'react';
import './Chat.css';
import Conversation from './Conversation';
import ChatBox from './ChatBox';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import { handleChatApi } from '../Services/userService';
import { io } from 'socket.io-client';
import Navbar from './NavBar';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [search] = useSearchParams();
  const senderId = search.get('senderid');
  const socket = useRef();
  const [sendMessage, setSendMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [receivedMessage, setReceivedMessage] = useState(null);
  const navigate = useNavigate();
  const id = search.get('id');

  useEffect(() => {
    const getChats = async () => {
      if (!senderId) return;
      try {
        const data = await handleChatApi(senderId);
        const list = data?.chatsData;
        setChats(Array.isArray(list) ? list : []);
      } catch (error) {
        console.log(error);
        setChats([]);
      }
    };
    getChats();
  }, [senderId]);

  useEffect(() => {
    if (!senderId) return;
    const s = io('ws://localhost:8800');
    socket.current = s;
    s.emit('new-user-add', senderId);
    s.on('get-users', (users) => {
      setOnlineUsers(users);
    });
    const onReceive = (data) => setReceivedMessage(data);
    s.on('recieve-message', onReceive);
    return () => {
      s.off('recieve-message', onReceive);
      s.disconnect();
      socket.current = null;
    };
  }, [senderId]);

  useEffect(() => {
    if (sendMessage !== null) {
      socket.current?.emit('send-message', sendMessage);
    }
  }, [sendMessage]);

  const checkOnlineStatus = (chat) => {
    const s = chat?.senderId ?? chat?.senderID;
    const r = chat?.receiverId ?? chat?.receiverID;
    if (s == null || r == null || senderId == null) return false;
    const member = String(senderId) === String(s) ? r : s;
    const online = onlineUsers.find((u) => String(u.userId) === String(member));
    return Boolean(online);
  };

  const handleBack = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id: id || senderId }).toString(),
    });
  };

  return (
    <div className="lm-chat-page">
      <Navbar id={senderId || id} />
      <div className="lm-chat-layout">
        <aside className="lm-chat-sidebar">
          <header className="lm-chat-sidebar-head">
            <h1 className="lm-chat-sidebar-title">
              Chats <span className="lm-chat-sidebar-title-ko" lang="ko">채팅</span>
            </h1>
            <p className="lm-chat-sidebar-sub">
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}{' '}
              <span className="lm-chat-sidebar-sub-ko" lang="ko">· 대화</span>
            </p>
          </header>
          <div className="lm-chat-list" role="list">
            {(chats || []).length === 0 ? (
              <p className="lm-chat-list-empty">No conversations yet. Connect with a partner first.</p>
            ) : (
              (chats || []).map((chat) => {
                const cid = chat?.id ?? chat?.chatId;
                const isActive = currentChat && (currentChat.id === cid || currentChat.chatId === cid);
                return (
                  <button
                    key={cid ?? `${chat.senderId}-${chat.receiverId}`}
                    type="button"
                    className="lm-chat-list-item"
                    role="listitem"
                    onClick={() => setCurrentChat(chat)}
                  >
                    <Conversation
                      data={chat}
                      currentUserId={senderId}
                      online={checkOnlineStatus(chat)}
                      active={isActive}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="lm-chat-main">
          <ChatBox
            chat={currentChat}
            currentUser={senderId}
            setSendMessage={setSendMessage}
            receivedMessage={receivedMessage}
          />
        </section>
      </div>

      <button type="button" className="lm-chat-back-dashboard" onClick={handleBack}>
        Dashboard
      </button>
    </div>
  );
};

export default Chat;
