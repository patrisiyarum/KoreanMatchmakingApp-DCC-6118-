import React, { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import './MeetingCalendar.css';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const minutesToSqlTime = (totalMin) => {
  const t = Math.max(0, Math.min(totalMin, 24 * 60 - 1));
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

// Normalize day name (e.g. "Sun" -> "Sunday")
const normalizeDay = (day) => {
  if (!day) return null;
  const d = String(day).trim();
  const match = DAY_ORDER.find((full) => full.toLowerCase().startsWith(d.toLowerCase()));
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

function MeetingCalendar({
  meetings,
  getFriendName,
  currentUserId,
  onMeetingClick,
  onSlotClick,
  onMeetingMove,
}) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = DateTime.local();
    return now.startOf('week'); // Sunday
  });

  const [dragOverKey, setDragOverKey] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const suppressSlotClickRef = useRef(false);
  const slotPaintRef = useRef(null);
  const [slotPaintRange, setSlotPaintRange] = useState(null);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    weekStart.plus({ days: i })
  );

  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const getDayIndex = (dayName) => {
    const normalized = normalizeDay(dayName);
    const idx = DAY_ORDER.findIndex((d) => d.toLowerCase() === normalized?.toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  const dayNameEqual = (a, b) => getDayIndex(a) === getDayIndex(b);

  const meetingsOverlapExclude = (excludeId, dayName, startM, endM) => {
    for (const o of meetings) {
      if (Number(o.id) === Number(excludeId)) continue;
      if (!dayNameEqual(o.day_of_week, dayName)) continue;
      const os = parseMinutes(o.start_time);
      const oe = parseMinutes(o.end_time);
      if (startM < oe && os < endM) return true;
    }
    return false;
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

  useEffect(() => {
    return () => {
      document.body.classList.remove('mc-slot-painting');
    };
  }, []);

  const weekLabel = `${weekDates[0].toFormat('MMM d')} – ${weekDates[6].toFormat('MMM d, yyyy')}`;

  const cellKey = (dayIdx, hour) => `${dayIdx}-${hour}`;

  const handleDragOverCell = (e, dayIdx, hour) => {
    if (!onMeetingMove || !draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverKey(cellKey(dayIdx, hour));
  };

  const handleDragLeaveCell = (e, dayIdx, hour) => {
    if (!onMeetingMove) return;
    const related = e.relatedTarget;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverKey((k) => (k === cellKey(dayIdx, hour) ? null : k));
  };

  const handleEmptySlotPaintStart = (e, dayIdx, hour) => {
    if (!onSlotClick) return;
    if (e.button !== 0) return;
    e.preventDefault();
    slotPaintRef.current = { dayIdx, anchorHour: hour, endHour: hour };
    setSlotPaintRange({ dayIdx, lo: hour, hi: hour });
    document.body.classList.add('mc-slot-painting');

    const finish = () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      document.body.classList.remove('mc-slot-painting');
      const d = slotPaintRef.current;
      slotPaintRef.current = null;
      setSlotPaintRange(null);
      if (!d || !onSlotClick) return;
      const lo = Math.min(d.anchorHour, d.endHour);
      const hi = Math.max(d.anchorHour, d.endHour);
      const dayOfWeek = DAY_ORDER[d.dayIdx];
      suppressSlotClickRef.current = true;
      window.setTimeout(() => {
        suppressSlotClickRef.current = false;
      }, 400);
      onSlotClick({
        dayOfWeek,
        startTime: toTimeStr(lo),
        endTime: toTimeStr(hi + 1),
      });
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  const handleEmptySlotPaintEnter = (dayIdx, hour, isEmptyCell) => {
    const d = slotPaintRef.current;
    if (!d || !isEmptyCell || d.dayIdx !== dayIdx) return;
    d.endHour = hour;
    const lo = Math.min(d.anchorHour, d.endHour);
    const hi = Math.max(d.anchorHour, d.endHour);
    setSlotPaintRange({ dayIdx, lo, hi });
  };

  const handleDropOnCell = (e, dayIdx, hour) => {
    if (!onMeetingMove) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverKey(null);
    setDraggingId(null);

    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
    } catch {
      return;
    }
    const meeting = payload.meeting;
    if (!meeting?.id) return;

    const newDay = DAY_ORDER[dayIdx];
    const newStartM = hour * 60;
    const dur = Math.max(
      1,
      parseMinutes(meeting.end_time) - parseMinutes(meeting.start_time)
    );
    const newEndM = newStartM + dur;

    if (newEndM > 24 * 60) {
      window.alert('That would end after midnight. Try an earlier start time.');
      return;
    }

    if (
      dayNameEqual(meeting.day_of_week, newDay) &&
      parseMinutes(meeting.start_time) === newStartM
    ) {
      return;
    }

    if (meetingsOverlapExclude(meeting.id, newDay, newStartM, newEndM)) {
      window.alert('That slot overlaps another meeting.');
      return;
    }

    const newStart = minutesToSqlTime(newStartM);
    const newEnd = minutesToSqlTime(newEndM);

    suppressSlotClickRef.current = true;
    window.setTimeout(() => {
      suppressSlotClickRef.current = false;
    }, 400);

    onMeetingMove(meeting, {
      dayOfWeek: newDay,
      startTime: newStart,
      endTime: newEnd,
    });
  };

  return (
    <div className={`meeting-calendar${draggingId ? ' meeting-calendar--dragging' : ''}`}>
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

              const hasMeetingInCell = slotMeetings.length > 0;
              const isEmpty = !hasMeetingInCell && onSlotClick;
              const dropActive = onMeetingMove && draggingId;
              const isDropHover = dropActive && dragOverKey === cellKey(dayIdx, hour);
              const inPaintRange =
                slotPaintRange &&
                slotPaintRange.dayIdx === dayIdx &&
                hour >= slotPaintRange.lo &&
                hour <= slotPaintRange.hi &&
                isEmpty;

              return (
                <div
                  key={dayIdx}
                  className={`meeting-calendar-cell ${isToday ? 'today' : ''} ${isEmpty ? 'meeting-calendar-cell-clickable' : ''}${isDropHover ? ' meeting-calendar-cell--drop-hover' : ''}${inPaintRange ? ' meeting-calendar-cell--slot-paint' : ''}`}
                  onDragOver={(e) => handleDragOverCell(e, dayIdx, hour)}
                  onDragLeave={(e) => handleDragLeaveCell(e, dayIdx, hour)}
                  onDrop={(e) => handleDropOnCell(e, dayIdx, hour)}
                  onPointerEnter={() => handleEmptySlotPaintEnter(dayIdx, hour, isEmpty)}
                  onPointerDown={
                    isEmpty
                      ? (e) => handleEmptySlotPaintStart(e, dayIdx, hour)
                      : undefined
                  }
                  role={isEmpty ? 'button' : undefined}
                  tabIndex={isEmpty ? 0 : undefined}
                  onKeyDown={
                    isEmpty
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (suppressSlotClickRef.current) return;
                            const dayOfWeek = DAY_ORDER[dayIdx];
                            const startTime = toTimeStr(hour);
                            const endTime = toTimeStr(hour + 1);
                            onSlotClick({ dayOfWeek, startTime, endTime });
                          }
                        }
                      : undefined
                  }
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
                          draggable={Boolean(onMeetingMove)}
                          onDragStart={(e) => {
                            if (!onMeetingMove) return;
                            e.stopPropagation();
                            setDraggingId(m.id);
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ meeting: m })
                            );
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverKey(null);
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

      {(onSlotClick || meetings.length > 0) && (
        <p className="meeting-calendar-hint">
          {onSlotClick &&
            'Drag across empty hours to select a range, or click a single hour. '}
          {meetings.length > 0 &&
            (onMeetingMove
              ? 'Drag a meeting block to reschedule, or click it to cancel.'
              : 'Click a meeting to cancel.')}
        </p>
      )}
    </div>
  );
}

export default MeetingCalendar;
