import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, createSearchParams } from 'react-router-dom';
import './AvailabilityPicker.css';
import axios from 'axios';

// Generate hourly slots from 8:00 AM to 8:00 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let totalMin = 8 * 60; totalMin < 21 * 60; totalMin += 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const endTotalMin = totalMin + 60;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;
    const ampm = h < 12 ? 'am' : 'pm';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    const label = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
    const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    slots.push({ label, start, end });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityPicker = () => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
  const returnTo = search.get('returnTo') || 'Friends';

  const [selectedSlots, setSelectedSlots] = useState(new Set());

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/v1/users/${id}/availability`)
      .then(res => {
        const existing = res?.data?.availability || res?.data || [];
        if (!Array.isArray(existing) || existing.length === 0) return;
        const preSelected = new Set();
        existing.forEach(slot => {
          const dayIndex = DAY_NAMES.indexOf(slot.day_of_week);
          if (dayIndex === -1) return;
          const startHHMM = (slot.start_time || '').slice(0, 5);
          const timeIndex = TIME_SLOTS.findIndex(ts => ts.start === startHHMM);
          if (timeIndex === -1) return;
          preSelected.add(`${dayIndex}-${timeIndex}`);
        });
        setSelectedSlots(preSelected);
      })
      .catch(() => {});
  }, [id]);

  const handleSlotClick = (dayIndex, timeIndex) => {
    const slotKey = `${dayIndex}-${timeIndex}`;
    const next = new Set(selectedSlots);
    if (next.has(slotKey)) next.delete(slotKey);
    else next.add(slotKey);
    setSelectedSlots(next);
  };

  const handleConfirm = async () => {
    if (!id) {
      alert("User ID is missing. Cannot save availability.");
      return;
    }

    const backendPayload = Array.from(selectedSlots).map(slot => {
      const [dayIndex, timeIndex] = slot.split('-').map(Number);
      const { start, end } = TIME_SLOTS[timeIndex];
      return {
        day_of_week: DAY_NAMES[dayIndex],
        start_time: start,
        end_time: end,
      };
    });

    await axios.post(`/api/v1/users/${id}/availability`, { slots: backendPayload });

    if (returnTo === 'Scheduler') {
      navigate({ pathname: '/Scheduler', search: createSearchParams({ id }).toString() });
    } else if (returnTo === 'Assistant') {
      const descriptions = backendPayload.map(s => `${s.day_of_week} ${s.start_time}`).join(', ');
      navigate(`/Assistant?id=${id}&slotsAdded=${encodeURIComponent(descriptions)}`);
    } else {
      const friendsSub = search.get('friendsSub') || 'discover';
      navigate({
        pathname: '/Friends',
        search: createSearchParams({ id, friendsSub, availability: JSON.stringify(backendPayload) }).toString(),
      });
    }
  };

  const handleBack = () => {
    navigate({ pathname: `/${returnTo}`, search: createSearchParams({ id }).toString() });
  };

  const handleBackToDashboard = () => {
    navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="availability-picker-container">
      <div className="availability-picker">
        <h1 className="page-title">Set Availability</h1>

        <div className="calendar-container">
          <div className="days-header">
            {DAYS.map((day, index) => (
              <div key={index} className="day-header">
                <div className="day-label">{day}</div>
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {TIME_SLOTS.map((slot, timeIndex) => (
              <div key={timeIndex} className="time-row">
                <div className="time-label">{slot.label}</div>
                <div className="time-slots">
                  {DAYS.map((day, dayIndex) => {
                    const slotKey = `${dayIndex}-${timeIndex}`;
                    const isSelected = selectedSlots.has(slotKey);
                    return (
                      <div
                        key={dayIndex}
                        className={`time-slot ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSlotClick(dayIndex, timeIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="button-container">
          <button className="back-to-dashboard" onClick={handleBackToDashboard}>Dashboard</button>
          <button className="btn-back" onClick={handleBack}>Back</button>
          <button className="btn-confirm" onClick={handleConfirm}>Submit Availability</button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPicker;
