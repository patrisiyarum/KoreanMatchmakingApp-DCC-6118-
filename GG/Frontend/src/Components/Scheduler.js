import React, { useEffect, useState } from 'react';
import './Scheduler.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import Navbar from './NavBar';
import MeetingCalendar from './MeetingCalendar';

import { 
  handleGetTrueFriendsList, 
  handleCreateMeeting, 
  handleGetTrueUserAvailability,
  handleGetMeetings,
  handleDeleteMeeting      
} from '../Services/userService';

const Scheduler = () => {
  const [friends, setFriends] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [scheduleFriendId, setScheduleFriendId] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState([]);

  const getFriendName = (userId) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "Unknown User";
    return `${friend.firstName} ${friend.lastName}`;
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const payload = await handleGetTrueFriendsList(id);
        setFriends(Array.isArray(payload?.friendsList) ? payload.friendsList : []);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setFriends([]);
      }
    };

    if (id) fetchFriends();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    handleGetMeetings(id)
      .then(res => {
        const list = res?.data || res;
        setMeetings(Array.isArray(list) ? list : []);
      })
      .catch(err => console.error("Failed to fetch meetings:", err));
  }, [id]);

  const handleBack = () => {
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString(),
    });
  };

  const formatSlotLabel = (slot) => {
    if (!slot) return "";
    const fmt = (t) => {
      const parts = String(t || "0:0").split(":");
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };
    const day = slot.dayOfWeek || slot.day_of_week || "";
    const start = slot.startTime || slot.start_time || slot.start;
    const end = slot.endTime || slot.end_time || slot.end;
    return `${day} ${fmt(start)} – ${fmt(end)}`;
  };

  const handleScheduleFromCalendar = async () => {
    if (!selectedSlotData || !scheduleFriendId) return;

    setScheduleError("");
    setSuggestedSlots([]);
    setScheduleLoading(true);

    try {
      const data = await handleGetTrueUserAvailability(scheduleFriendId);
      const slots = data?.availability || data?.slots || (Array.isArray(data) ? data : []);

      const parseTime = (t) => {
        const parts = String(t || "0:0").split(":");
        return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
      };

      const ourStart = parseTime(selectedSlotData.startTime);
      const ourEnd = parseTime(selectedSlotData.endTime);

      const overlapping = slots.find((s) => {
        const day = (s.day_of_week || "").toLowerCase();
        const targetDay = (selectedSlotData.dayOfWeek || "").toLowerCase();
        if (!day.startsWith(targetDay.slice(0, 3)) && !targetDay.startsWith(day.slice(0, 3))) return false;

        const slotStart = parseTime(s.start_time || s.startTime || s.start);
        const slotEnd = parseTime(s.end_time || s.endTime || s.end);
        return ourStart < slotEnd && ourEnd > slotStart;
      });

      if (!overlapping) {
        setScheduleError(slots.length === 0
          ? "Friend has not set their availability yet. Ask them to add availability in their profile."
          : "Friend is not available at this time.");
        setSuggestedSlots(slots.slice(0, 8));
        setScheduleLoading(false);
        return;
      }

      setSuggestedSlots([]);
      await handleCreateMeeting(
        id,
        scheduleFriendId,
        selectedSlotData.dayOfWeek,
        selectedSlotData.startTime,
        selectedSlotData.endTime
      );

      const friend = friends.find((f) => f.id === Number(scheduleFriendId));
      alert(`Meeting scheduled with ${friend?.firstName || "friend"}!`);

      const res = await handleGetMeetings(id);
      const list = res?.data || res;
      setMeetings(Array.isArray(list) ? list : []);

      setSelectedSlotData(null);
      setScheduleFriendId("");
    } catch (err) {
      setScheduleError(err?.response?.data?.error || err?.message || "Failed to schedule meeting.");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCancelMeeting = async (meeting) => {
    try {
      const currentUserId = Number(id);
      const otherUserId =
        meeting.user1_id === currentUserId ? meeting.user2_id : meeting.user1_id;

      const ok = window.confirm(
        `Cancel meeting with ${getFriendName(otherUserId)} on ${
          meeting.day_of_week
        } at ${meeting.start_time}?`
      );
      if (!ok) return;

      await handleDeleteMeeting(
        meeting.user1_id,
        meeting.user2_id,
        meeting.day_of_week,
        meeting.start_time,
        meeting.end_time
      );

      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    } catch (err) {
      console.error('Failed to delete meeting:', err.response?.data || err.message);
      alert('Failed to delete meeting. Check console for details.');
    }
  };

  return (
    <div className="sched-page">
      <Navbar id={id} />

      <div className="sched-center">
        <div className="sched-card sched-card-calendar">
          <h2 className="sched-card-title">Scheduled Meetings</h2>
          {meetings.length === 0 && !selectedSlotData && (
            <p className="sched-subtitle">Click an empty time slot to schedule a meeting</p>
          )}

          {selectedSlotData && (
            <div className="sched-slot-panel">
              <div className="sched-slot-panel-header">
                <span className="sched-slot-panel-title">
                  Schedule for {formatSlotLabel(selectedSlotData)}
                </span>
                <button
                  type="button"
                  className="sched-slot-panel-close"
                  onClick={() => {
                    setSelectedSlotData(null);
                    setScheduleFriendId("");
                    setScheduleError("");
                    setSuggestedSlots([]);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {friends.length === 0 ? (
                <p className="sched-no-slots">No friends added yet. Add friends first.</p>
              ) : (
                <>
                  <label className="sched-dropdown-label">
                    With:
                    <select
                      className="sched-select"
                      value={scheduleFriendId}
                      onChange={(e) => {
                        setScheduleFriendId(e.target.value);
                        setScheduleError("");
                      }}
                    >
                      <option value="">Select a friend...</option>
                      {friends.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.firstName} {f.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                  {scheduleError && (
                    <p className="sched-slot-error">{scheduleError}</p>
                  )}
                  {suggestedSlots.length > 0 && (
                    <div className="sched-suggested">
                      <p className="sched-suggested-title">
                        {getFriendName(Number(scheduleFriendId))} is available at:
                      </p>
                      <div className="sched-suggested-list">
                        {suggestedSlots.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            className="sched-suggested-btn"
                            onClick={() => {
                              const slotData = {
                                dayOfWeek: s.day_of_week || s.day,
                                startTime: s.start_time || s.startTime || s.start || "00:00:00",
                                endTime: s.end_time || s.endTime || s.end || "01:00:00",
                              };
                              setSelectedSlotData(slotData);
                              setSuggestedSlots([]);
                              setScheduleError("");
                            }}
                          >
                            {formatSlotLabel({
                              dayOfWeek: s.day_of_week || s.day,
                              startTime: s.start_time || s.startTime || s.start,
                              endTime: s.end_time || s.endTime || s.end,
                            })}
                          </button>
                        ))}
                      </div>
                      <p className="sched-suggested-hint">Click a time to schedule at that slot instead.</p>
                    </div>
                  )}
                  <div className="sched-slot-actions">
                    <button
                      type="button"
                      className="sched-btn-secondary"
                      onClick={() => {
                        setSelectedSlotData(null);
                        setScheduleFriendId("");
                        setScheduleError("");
                        setSuggestedSlots([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="sched-confirm-btn"
                      disabled={!scheduleFriendId || scheduleLoading}
                      onClick={handleScheduleFromCalendar}
                    >
                      {scheduleLoading ? "Scheduling..." : "Schedule Meeting"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <MeetingCalendar
            meetings={meetings}
            getFriendName={getFriendName}
            currentUserId={id}
            onMeetingClick={handleCancelMeeting}
            onSlotClick={setSelectedSlotData}
            friends={friends}
          />

          <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
