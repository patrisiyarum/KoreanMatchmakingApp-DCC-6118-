import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, createSearchParams } from 'react-router-dom';
import './AvailabilityPicker.css';
import axios from 'axios';
import WeeklyAvailabilityGrid from './WeeklyAvailabilityGrid';
import { normalizeTimeKey } from './weeklyAvailabilityUtils';

const AvailabilityPicker = () => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
  const returnTo = search.get('returnTo') || 'Friends';

  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/v1/users/${id}/availability`)
      .then((res) => {
        const existing = res?.data?.availability || res?.data || [];
        if (!Array.isArray(existing) || existing.length === 0) return;
        setSlots(
          existing.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: normalizeTimeKey(s.start_time),
            end_time: normalizeTimeKey(s.end_time),
          }))
        );
      })
      .catch(() => {});
  }, [id]);

  const handleConfirm = async () => {
    if (!id) {
      alert('User ID is missing. Cannot save availability.');
      return;
    }

    const backendPayload = slots.map((s) => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    await axios.post(`/api/v1/users/${id}/availability`, { slots: backendPayload });

    if (returnTo === 'Scheduler') {
      navigate({ pathname: '/Scheduler', search: createSearchParams({ id }).toString() });
    } else if (returnTo === 'Assistant') {
      const descriptions = backendPayload.map((s) => `${s.day_of_week} ${s.start_time}`).join(', ');
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

        <WeeklyAvailabilityGrid slots={slots} onSlotsChange={setSlots} enableDrag />

        <div className="button-container">
          <button type="button" className="back-to-dashboard" onClick={handleBackToDashboard}>
            Dashboard
          </button>
          <button type="button" className="btn-back" onClick={handleBack}>
            Back
          </button>
          <button type="button" className="btn-confirm" onClick={handleConfirm}>
            Submit Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPicker;
