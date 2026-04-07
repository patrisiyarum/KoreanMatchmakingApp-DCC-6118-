import React, { useState } from 'react';
import { useNavigate, useSearchParams, createSearchParams } from 'react-router-dom';
import './AvailabilityPicker.css';
import axios from 'axios';



const AvailabilityPicker = () => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
  const returnTo = search.get('returnTo') || 'Friends';
  
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '8 am', '9 am', '10 am', '11 am', '12 pm', 
    '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', 
    '6 pm', '7 pm', '8 pm'
  ];

  // Handle time slot selection
  const handleSlotClick = (dayIndex, timeIndex) => {
    const slotKey = `${dayIndex}-${timeIndex}`;
    const newSelectedSlots = new Set(selectedSlots);
    
    if (newSelectedSlots.has(slotKey)) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }
    
    setSelectedSlots(newSelectedSlots);
  };
  
  // Handle confirm button 
  const handleConfirm = async () => {
    if (!id) {
      alert("User ID is missing. Cannot save availability.");
      return;
    }
    const availabilityData = Array.from(selectedSlots).map(slot => {
      const [dayIndex, timeIndex] = slot.split('-').map(Number);
      return {
        day: dayNames[dayIndex],
        time: timeSlots[timeIndex],
        dayIndex,
        timeIndex
      };
    });
    const convertTo24Hour = (timeStr) => {
      const [hour, modifier] = timeStr.split(' ');
      let h = parseInt(hour);
      if (modifier === 'pm' && h !== 12) h += 12;
      if (modifier === 'am' && h === 12) h = 0;
      return h.toString().padStart(2,'0') + ':00';
    };
    const backendPayload = availabilityData.map(slot => {
      const time24 = convertTo24Hour(slot.time); // helper to convert '8 am' → '08:00'
      return {
        day_of_week: slot.day,
        start_time: time24,
        end_time: time24
      };
    });
    console.log("Submitting availability for userId:", id, availabilityData);
    await axios.post(`/api/v1/users/${id}/availability`, { slots: backendPayload });
    // Navigate back to Friends (Discover) with selected availability
    //In the event that the user selects a meeting time in the AI chat, they return to the chat not Friend Search
    const returnTo = search.get("returnTo");
    if (returnTo === "Assistant") {
      const slotDescriptions = availabilityData.map(slot => `${slot.day} ${slot.time}`).join(", ");
      navigate(`/Assistant?id=${id}&slotsAdded=${encodeURIComponent(slotDescriptions)}`);
    } else {
      const friendsSub = search.get('friendsSub') || 'discover';
      navigate({
        pathname: '/Friends',
        search: createSearchParams({
          id,
          friendsSub,
          availability: JSON.stringify(availabilityData),
        }).toString(),
      });
    }
  };

  // Handle back button (contextual)
  const handleBack = () => {
    if (returnTo === 'Friends') {
      const friendsSub = search.get('friendsSub') || 'discover';
      navigate({
        pathname: '/Friends',
        search: createSearchParams({ id, friendsSub }).toString(),
      });
      return;
    }
    navigate({
      pathname: `/${returnTo}`,
      search: createSearchParams({ id }).toString(),
    });
  };

  // Global back to dashboard
  const handleBackToDashboard = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id }).toString(),
    });
  };

  return (
    <div className="availability-picker-container">
      <div className="availability-picker">
        <h1 className="page-title">Find Partners</h1>
        
        <div className="calendar-container">
          {/* Days header */}
          <div className="days-header">
            {days.map((day, index) => (
              <div key={index} className="day-header">
                <div className="day-label">{day}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots and calendar grid */}
          <div className="calendar-grid">
            {timeSlots.map((time, timeIndex) => (
              <div key={timeIndex} className="time-row">
                <div className="time-label">{time}</div>
                <div className="time-slots">
                  {days.map((day, dayIndex) => {
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
          <button className="btn-back" onClick={handleBack}>
            Back
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Submit Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPicker;
