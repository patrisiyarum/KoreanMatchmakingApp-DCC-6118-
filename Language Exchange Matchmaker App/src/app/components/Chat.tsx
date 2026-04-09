import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Send } from 'lucide-react';
import { mockMessages, potentialPartners, initialMatches } from '../data/mockData';
import { Message } from '../types';

export function Chat() {
  const { partnerId } = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages[partnerId || ''] || []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const partner = [...potentialPartners, ...initialMatches.map(m => m.user)].find(
    u => u.id === partnerId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'user-1',
      text: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    setTimeout(() => {
      const autoReply: Message = {
        id: `msg-${Date.now() + 1}`,
        senderId: partnerId || '',
        text: 'That\'s great! Let\'s practice more! 더 연습해요! 😊',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1500);
  };

  if (!partner) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Partner not found</p>
          <Link to="/partners" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-white">
      <div className="border-b border-neutral-200 px-4 py-3 flex items-center gap-3 bg-white">
        <Link to="/partners" className="text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-3xl">{partner.avatar}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{partner.name}</h3>
          <p className="text-xs text-neutral-500">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.senderId === 'user-1';

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-neutral-500'}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
