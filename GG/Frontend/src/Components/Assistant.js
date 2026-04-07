import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./Assistant.css";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Navbar from './NavBar';
import {
  handleChatWithAssistant,
  handleSaveConversation,
  handleLoadConversationFromDB,
  handleClearConversation,
  handleGetConversation,
  handleGetAllAIChats
} from "../Services/aiAssistantService";
import { handleUserDashBoardApi } from "../Services/dashboardService";
import { handleGetUserPreferencesApi } from "../Services/findFriendsService";

export default function Assistant() {
  const [search] = useSearchParams();
  const idFromUrl = search.get("id");
  const chatIdFromUrl = search.get("chatId");
  const navigate = useNavigate();
  const location = useLocation();
  const [processedAlerts] = useState(new Set());

  const [userId, setUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your language exchange assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const highlightGoals = (text) => {
    return text.replace(
      /Goals for Improvement:/gi,
      `<span class="highlight-goals">Goals for Improvement:</span>`
    );
  };

  useEffect(() => {
    if (chatIdFromUrl) {
      setChatId(chatIdFromUrl);
      setInput(`Please summarize my practice session.`);
    }
  }, [chatIdFromUrl]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        if (idFromUrl) {
          const numericId = parseInt(idFromUrl);
          if (!isNaN(numericId)) {
            try {
              const userData = await handleUserDashBoardApi(numericId);
              if (userData && userData.user) { setUserId(numericId); return; }
            } catch { setError("User not found."); return; }
          }
        }
        const prefs = await handleGetUserPreferencesApi();
        if (!prefs?.data?.length) setError("User ID is required in the URL.");
      } catch { setError("Failed to fetch user information."); }
    };
    fetchUserId();
  }, [idFromUrl]);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      try {
        const result = await handleGetAllAIChats(userId);
        const chats = result.chats || [];
        const formatted = chats.map(chat => {
          let arr = chat.conversation;
          if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { arr = []; } }
          if (Array.isArray(arr)) { /* ok */ }
          else if (arr && typeof arr === "object") {
            if (arr.conversation) {
              const inner = arr.conversation;
              if (inner && !Array.isArray(inner) && inner.messages) arr = inner.messages;
              else if (Array.isArray(inner)) arr = inner;
              else arr = [];
            } else if (arr.messages && Array.isArray(arr.messages)) arr = arr.messages;
            else arr = [];
          } else arr = [];
          if (!Array.isArray(arr)) arr = [];
          const first = arr.find(m => m.role === "user") || arr[0];
          return {
            id: chat.id,
            timestamp: chat.createdAt,
            title: first?.content?.slice(0, 40) || "Conversation",
            messages: arr.map(msg => ({ role: msg.role, text: msg.content }))
          };
        });
        setHistory(formatted);
      } catch {}
    };
    fetchHistory();
  }, [userId]);

  const loadConversation = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await handleGetConversation(userId);
      if (response.conversation && response.conversation.length > 0) {
        setMessages(response.conversation.map(msg => ({ role: msg.role, text: msg.content })));
      }
    } catch (err) {
      if (err.response?.status !== 404) setError("Failed to load conversation.");
    }
  }, [userId]);

  useEffect(() => { if (userId) loadConversation(); }, [userId, loadConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const slotsAdded = search.get("slotsAdded");
    if (!slotsAdded) return;
    const sig = `slots:${slotsAdded}`;
    if (processedAlerts.has(sig)) return;
    window.alert(`You added ${slotsAdded} to your availability.`);
    processedAlerts.add(sig);
    const params = new URLSearchParams(location.search);
    params.delete("slotsAdded");
    const newSearch = params.toString();
    window.history.replaceState({}, "", `${location.pathname}${newSearch ? `?${newSearch}` : ""}`);
  }, [search, location.pathname, processedAlerts]);

  const loadConversationFromHistory = async chat => {
    if (!chat?.messages || !userId) return;
    try { await handleLoadConversationFromDB(chat.id, userId); } catch {}
    setMessages(chat.messages);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    const isAudio = !!audioBlob;
    if (!isAudio && !trimmedInput) return;
    if (isAudio) setInput("");
    setError(null);
    setIsLoading(true);
    const userMsg = isAudio ? { role: "user", text: "[Sent Audio Message]" } : { role: "user", text: trimmedInput };
    setMessages(m => [...m, userMsg]);
    setAudioBlob(null);
    try {
      let response;
      if (isAudio) response = await handleChatWithAssistant(null, audioBlob, userId, chatId);
      else response = await handleChatWithAssistant(trimmedInput, null, userId, chatId);
      setMessages(m => [...m, { role: "assistant", text: response.reply || "I'm sorry, I couldn't process that." }]);
      if (!isAudio) setInput("");
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message;
      const isConfigError = err?.response?.status === 503;
      const text = isConfigError
        ? `Sorry! ${errMsg}`
        : "Sorry! There was a backend error. Please try again.";
      setMessages(m => [...m, { role: "assistant", text }]);
    } finally { setIsLoading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      setAudioBlob(null);
      setInput("");
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
        sendMessage({ preventDefault: () => {} });
      };
      mr.onerror = () => { setIsRecording(false); stream.getTracks().forEach(t => t.stop()); };
      mr.start();
      setIsRecording(true);
      setError(null);
    } catch { setError("Please allow microphone access."); setIsRecording(false); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => { isRecording ? stopRecording() : startRecording(); };

  const handleSave = async () => {
    if (!userId) return;
    try {
      await handleSaveConversation(userId);
      const updated = await handleGetAllAIChats(userId);
      if (updated?.chats) {
        const formatted = updated.chats.map(chat => {
          let arr = chat.conversation;
          if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { arr = []; } }
          if (!Array.isArray(arr)) {
            if (arr?.conversation?.messages) arr = arr.conversation.messages;
            else if (arr?.conversation && Array.isArray(arr.conversation)) arr = arr.conversation;
            else if (arr?.messages) arr = arr.messages;
            else arr = [];
          }
          if (!Array.isArray(arr)) arr = [];
          const first = arr.find(m => m.role === "user") || arr[0];
          return {
            id: chat.id, timestamp: chat.createdAt,
            title: first?.content?.slice(0, 40) || "Conversation",
            messages: arr.map(msg => ({ role: msg.role, text: msg.content }))
          };
        });
        setHistory(formatted);
      }
      alert("Conversation saved!");
    } catch { alert("Failed to save conversation."); }
  };

  const handleClear = async () => {
    if (!userId || !window.confirm("Clear conversation?")) return;
    try {
      await handleClearConversation(userId);
      setMessages([{ role: "assistant", text: "Hi! I'm your language exchange assistant. How can I help you today?" }]);
      setAudioBlob(null);
      alert("Conversation cleared.");
    } catch { alert("Failed to clear conversation."); }
  };

  return (
    <div className="ast-page">
      <Navbar id={idFromUrl} />
      <div className="ast-center">

        <div className="ast-sidebar">
          <h3 className="ast-sidebar-title">Conversations</h3>
          {history.length === 0 && <p className="ast-sidebar-empty">No previous conversations</p>}
          {history.map(chat => (
            <div key={chat.id} className="ast-sidebar-item" onClick={() => loadConversationFromHistory(chat)}>
              <strong>{chat.title}</strong>
              <p className="ast-timestamp">{new Date(chat.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="ast-card">
          <div className="ast-header">
            <span className="ast-header-title">Chat Assistant</span>
            <span className="ast-header-meta">{userId ? `User ID: ${userId}` : ""}</span>
          </div>

          {error && <div className="ast-alert ast-alert-warning">{error}</div>}
          {isRecording && <div className="ast-alert ast-alert-recording">Recording... Click again to stop.</div>}
          {audioBlob && !isRecording && <div className="ast-alert ast-alert-audio">Audio recorded! Hit Send.</div>}

          <div className="ast-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ast-msg-row ${m.role === "user" ? "ast-user" : "ast-bot"}`}>
                <div className="ast-msg-bubble">
                  <ReactMarkdown>{highlightGoals(m.text)}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ast-msg-row ast-bot">
                <div className="ast-msg-bubble">Thinking...</div>
              </div>
            )}
          </div>

          <form className="ast-inputbar" onSubmit={sendMessage}>
            <button
              type="button"
              className={`ast-mic-btn ${isRecording ? 'ast-recording' : ''}`}
              onClick={toggleRecording}
              disabled={isLoading}
            >
              {isRecording ? "Stop" : "Record"}
            </button>
            <input
              className="ast-input"
              value={input}
              onChange={(e) => { setInput(e.target.value); setAudioBlob(null); }}
              placeholder="Message Chat Assistant..."
              disabled={isLoading || isRecording}
            />
            <button
              type="submit"
              className="ast-send-btn"
              disabled={isLoading || (!input.trim() && !audioBlob)}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="ast-footer">
            <button className="back-to-dashboard" onClick={() => navigate(`/Dashboard?id=${userId}`)}>Dashboard</button>
            <button className="ast-footer-btn ast-btn-avail" onClick={() => navigate(`/AvailabilityPicker?id=${userId}&returnTo=Assistant`)}>
              Select Availability
            </button>
            <button className="ast-footer-btn ast-btn-save" onClick={handleSave}>
              Save to History
            </button>
            <button className="ast-footer-btn ast-btn-clear" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
