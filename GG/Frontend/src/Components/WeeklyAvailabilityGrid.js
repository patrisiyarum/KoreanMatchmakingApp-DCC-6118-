import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './WeeklyAvailabilityGrid.css';
import {
  DAYS_HEADER,
  TIME_SLOTS,
  keySetToSlots,
  slotsToKeySet,
} from './weeklyAvailabilityUtils';

/**
 * Weekly 8am–8pm grid (hourly slots), same layout as AvailabilityPicker.
 * @param {Array<{ day_of_week: string, start_time: string, end_time: string }>} slots
 * @param {(next: Array) => void} onSlotsChange
 * @param {boolean} enableDrag - drag to paint add/remove (default true)
 * @param {string} className - extra class on wrapper
 */
function WeeklyAvailabilityGrid({
  slots = [],
  onSlotsChange,
  enableDrag = true,
  className = '',
}) {
  const keysFromProps = useMemo(() => slotsToKeySet(slots), [slots]);
  const [localKeys, setLocalKeys] = useState(() => keysFromProps);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!dragActive) setLocalKeys(keysFromProps);
  }, [keysFromProps, dragActive]);

  const dragRef = useRef(null);

  const applyKey = useCallback((key, mode, baseSet) => {
    const next = new Set(baseSet);
    if (mode === 'add') next.add(key);
    else next.delete(key);
    return next;
  }, []);

  const finishDrag = useCallback(() => {
    dragRef.current = null;
    document.body.classList.remove('wag-dragging');
    setDragActive(false);
  }, []);

  useEffect(() => {
    const onUp = () => {
      if (!dragRef.current) return;
      const { working } = dragRef.current;
      onSlotsChange(keySetToSlots(working));
      finishDrag();
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [finishDrag, onSlotsChange]);

  const handlePointerDown = (e, dayIndex, timeIndex) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const key = `${dayIndex}-${timeIndex}`;
    const base = slotsToKeySet(slots);
    const startingSelected = base.has(key);
    const mode = startingSelected ? 'remove' : 'add';
    const working = applyKey(key, mode, base);
    setLocalKeys(working);

    if (!enableDrag) {
      onSlotsChange(keySetToSlots(working));
      return;
    }

    setDragActive(true);
    dragRef.current = { mode, working };
    document.body.classList.add('wag-dragging');
  };

  const handlePointerEnter = (dayIndex, timeIndex) => {
    if (!enableDrag || !dragRef.current) return;
    const key = `${dayIndex}-${timeIndex}`;
    const { mode, working: prev } = dragRef.current;
    const next = applyKey(key, mode, new Set(prev));
    dragRef.current = { mode, working: next };
    setLocalKeys(next);
  };

  const displayKeys = dragActive ? localKeys : keysFromProps;

  return (
    <div className={`weekly-availability-grid ${className}`.trim()}>
      <p className="weekly-availability-grid-hint">
        {enableDrag
          ? 'Click or drag across cells to add or remove times.'
          : 'Click cells to toggle.'}
      </p>
      <div className="wag-calendar-container">
        <div className="wag-days-header">
          {DAYS_HEADER.map((day, index) => (
            <div key={index} className="wag-day-header">
              <div className="wag-day-label">{day}</div>
            </div>
          ))}
        </div>

        <div className="wag-calendar-grid">
          {TIME_SLOTS.map((slot, timeIndex) => (
            <div key={timeIndex} className="wag-time-row">
              <div className="wag-time-label">{slot.label}</div>
              <div className="wag-time-slots">
                {DAYS_HEADER.map((_, dayIndex) => {
                  const slotKey = `${dayIndex}-${timeIndex}`;
                  const isSelected = displayKeys.has(slotKey);
                  return (
                    <div
                      key={dayIndex}
                      role="presentation"
                      className={`wag-time-slot ${isSelected ? 'selected' : ''}`}
                      onPointerDown={(e) => handlePointerDown(e, dayIndex, timeIndex)}
                      onPointerEnter={() => handlePointerEnter(dayIndex, timeIndex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeeklyAvailabilityGrid;
export { keySetToSlots, slotsToKeySet };
