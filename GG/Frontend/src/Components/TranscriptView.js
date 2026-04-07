import React, { useState, useEffect } from 'react';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleGetTranscripts } from '../Services/transcriptService';
import Navbar from './NavBar';
import './TranscriptView.css';

function TranscriptView() {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const id = search.get("id");

    const [transcripts, setTranscripts] = useState([]);
    const [filteredTranscripts, setFilteredTranscripts] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedSessionId, setExpandedSessionId] = useState(null);

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const response = await handleGetTranscripts(id); 
                let output = [];
                for (const item of response.messageData) {
                    output.push({
                        date: item.createdAt,
                        transcript: item.transcript,
                        sessionId: item.sessionId
                    });
                }
                const sortedData = output.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTranscripts(sortedData);
                setFilteredTranscripts(sortedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching transcripts:', error);
                setLoading(false);
            }
        };
        fetchTranscripts();
    }, [id]);

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setFilterDate(selectedDate);
        setExpandedSessionId(null);

        if (selectedDate) {
            setFilteredTranscripts(transcripts.filter(t => t.date.startsWith(selectedDate)));
        } else {
            setFilteredTranscripts(transcripts);
        }
    };

    const handleToggleTranscript = (sessionId) => {
        setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
    };

    const handleContinueChat = (sessionId) => {
        navigate({
            pathname: "/Assistant",
            search: createSearchParams({ id, chatId: sessionId }).toString(),
        });
    };

    const handleBack = () => {
        navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getPreview = (fullTranscript) => {
        if (!fullTranscript) return "No transcript available.";
        return fullTranscript.length > 100 ? fullTranscript.substring(0, 100).trim() + "..." : fullTranscript;
    };

    return (
        <div className="tv-page">
            <Navbar id={id} />
            <div className="tv-center">
                <div className="tv-card">
                    <h2 className="tv-title">Conversation History</h2>

                    <div className="tv-filter-row">
                        <label className="tv-filter-label" htmlFor="date-filter">Filter by Date:</label>
                        <input
                            type="date"
                            id="date-filter"
                            className="tv-date-input"
                            value={filterDate}
                            onChange={handleDateChange}
                        />
                    </div>

                    <div className="tv-list">
                        {loading ? (
                            <p className="tv-empty">Loading transcripts...</p>
                        ) : filteredTranscripts.length > 0 ? (
                            filteredTranscripts.map((item) => {
                                const isExpanded = expandedSessionId === item.sessionId;
                                return (
                                    <div key={item.sessionId} className="tv-item">
                                        <div className="tv-item-header">
                                            <span>{formatDate(item.date)}</span>
                                            <span>Session {item.sessionId}</span>
                                        </div>

                                        {!isExpanded && (
                                            <p className="tv-preview">{getPreview(item.transcript)}</p>
                                        )}
                                        {isExpanded && (
                                            <div className="tv-full-text">{item.transcript}</div>
                                        )}

                                        <div className="tv-item-actions">
                                            <button
                                                className="tv-btn-outline"
                                                onClick={() => handleToggleTranscript(item.sessionId)}
                                            >
                                                {isExpanded ? 'Hide' : 'Read Full'}
                                            </button>
                                            <button
                                                className="tv-btn-primary"
                                                onClick={() => handleContinueChat(item.sessionId)}
                                            >
                                                Summarize with AI
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="tv-empty">No conversations found for this date.</p>
                        )}
                    </div>

                    <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button>
                </div>
            </div>
        </div>
    );
}

export default TranscriptView;
