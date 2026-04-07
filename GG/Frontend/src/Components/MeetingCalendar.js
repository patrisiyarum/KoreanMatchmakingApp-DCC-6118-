import React, { useState } from 'react';
import { DateTime } from 'luxon';
import './MeetingCalendar.css';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Normalize day name (e.g. "Sun" -> "Sunday")
const normalizeDay = (day) => {
  if (!day) return null;
  const d = String(day).trim();
  const match = DAY_ORDER.find(full => full.toLowerCase().startsWith(d.toLowerCase()));
  return match || d;
};

// Parse time string "11:00:00" or "11:00" to hour (0-23)
const parseHour = (timeStr) => {
  if (!timeStr) return 0;
  const s = String(timeStr).trim();
  const parts = s.split(':');
  return parseInt(parts[0], 10) || 0;
};

// Format time for display
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  const parts = s.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return DateTime.fromObject({ hour: h, minute: m }).toFormat('h:mm a');
};

// Format hour to "HH:00:00"
const toTimeStr = (hour) => `${String(hour).padStart(2, '0')}:00:00`;

function MeetingCalendar({ meetings, getFriendName, currentUserId, onMeetingClick, onSlotClick, friends }) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = DateTime.local();
    return now.startOf('week'); // Sunday
  });

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    weekStart.plus({ days: i })
  );

  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Get day index (0=Sun, 1=Mon, ...)
  const getDayIndex = (dayName) => {
    const normalized = normalizeDay(dayName);
    const idx = DAY_ORDER.findIndex(d => d.toLowerCase() === normalized?.toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  // Get meetings for a specific day and hour slot
  const getMeetingsForSlot = (dayIndex, hour) => {
    return meetings.filter((m) => {
      const mDayIdx = getDayIndex(m.day_of_week);
      const mStartHour = parseHour(m.start_time);
      const mEndHour = parseHour(m.end_time);
      return mDayIdx === dayIndex && hour >= mStartHour && hour < mEndHour;
    });
  };

  const goPrevWeek = () => setWeekStart((d) => d.minus({ weeks: 1 }));
  const goNextWeek = () => setWeekStart((d) => d.plus({ weeks: 1 }));
  const goToday = () => setWeekStart(DateTime.local().startOf('week'));

  const weekLabel = `${weekDates[0].toFormat('MMM d')} – ${weekDates[6].toFormat('MMM d, yyyy')}`;

  return (
    <div className="meeting-calendar">
      <div className="meeting-calendar-header">
        <button type="button" className="meeting-calendar-nav" onClick={goPrevWeek}>
          ‹
        </button>
        <h3 className="meeting-calendar-title">{weekLabel}</h3>
        <button type="button" className="meeting-calendar-nav" onClick={goNextWeek}>
          ›
        </button>
      </div>
      <button type="button" className="meeting-calendar-today" onClick={goToday}>
        Today
      </button>

      <div className="meeting-calendar-grid">
        {/* Header row: empty corner + day headers */}
        <div className="meeting-calendar-row meeting-calendar-header-row">
          <div className="meeting-calendar-time-col" />
          {weekDates.map((date, i) => {
            const isToday = date.hasSame(DateTime.local(), 'day');
            return (
              <div
                key={i}
                className={`meeting-calendar-day-col ${isToday ? 'today' : ''}`}
              >
                <span className="meeting-calendar-day-name">{DAY_ABBREV[i]}</span>
                <span className="meeting-calendar-day-num">{date.day}</span>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="meeting-calendar-row">
            <div className="meeting-calendar-time-col">
              <span className="meeting-calendar-time-label">
                {DateTime.fromObject({ hour, minute: 0 }).toFormat('h a')}
              </span>
            </div>
            {weekDates.map((date, dayIdx) => {
              const isToday = date.hasSame(DateTime.local(), 'day');
              const slotMeetings = getMeetingsForSlot(dayIdx, hour);
              const isFirstHour = slotMeetings.some(
                (m) => parseHour(m.start_time) === hour
              );

              const hasMeeting = isFirstHour && slotMeetings.length > 0;
              const isEmpty = !hasMeeting && onSlotClick && friends?.length > 0;

              return (
                <div
                  key={dayIdx}
                  className={`meeting-calendar-cell ${isToday ? 'today' : ''} ${isEmpty ? 'meeting-calendar-cell-clickable' : ''}`}
                  onClick={isEmpty ? () => {
                    const dayOfWeek = DAY_ORDER[dayIdx];
                    const startTime = toTimeStr(hour);
                    const endTime = toTimeStr(hour + 1);
                    onSlotClick({ dayOfWeek, startTime, endTime });
                  } : undefined}
                  role={isEmpty ? 'button' : undefined}
                  tabIndex={isEmpty ? 0 : undefined}
                  onKeyDown={isEmpty ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const dayOfWeek = DAY_ORDER[dayIdx];
                      const startTime = toTimeStr(hour);
                      const endTime = toTimeStr(hour + 1);
                      onSlotClick({ dayOfWeek, startTime, endTime });
                    }
                  } : undefined}
                >
                  {isFirstHour &&
                    slotMeetings.map((m) => {
                      const otherUser =
                        m.user1_id === Number(currentUserId)
                          ? m.user2_id
                          : m.user1_id;
                      const duration =
                        parseHour(m.end_time) - parseHour(m.start_time);

                      return (
                        <div
                          key={m.id}
                          className="meeting-calendar-event"
                          style={{
                            height: `calc(${duration * 100}% - 4px)`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMeetingClick(m);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onMeetingClick(m);
                            }
                          }}
                        >
                          <span className="meeting-calendar-event-name">
                            {getFriendName(otherUser)}
                          </span>
                          <span className="meeting-calendar-event-time">
                            {formatTime(m.start_time)} – {formatTime(m.end_time)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {meetings.length > 0 && (
        <p className="meeting-calendar-hint">Click a meeting to cancel it</p>
      )}
    </div>
  );
}

export default MeetingCalendar;
