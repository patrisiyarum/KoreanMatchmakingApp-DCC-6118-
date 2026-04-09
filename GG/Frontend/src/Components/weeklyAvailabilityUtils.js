/** Shared weekly grid constants — keep in sync with AvailabilityPicker / backend slot shape. */

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const generateTimeSlots = () => {
  const slots = [];
  for (let totalMin = 8 * 60; totalMin < 21 * 60; totalMin += 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const endTotalMin = totalMin + 60;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;
    const ampm = h < 12 ? 'am' : 'pm';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
    const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    slots.push({ label, start, end });
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

export const normalizeTimeKey = (t) => (t == null ? '' : String(t).trim().slice(0, 5));

export function slotsToKeySet(slots) {
  const set = new Set();
  if (!Array.isArray(slots)) return set;
  slots.forEach((slot) => {
    const dayIndex = DAY_NAMES.indexOf(slot.day_of_week);
    if (dayIndex === -1) return;
    const startHHMM = normalizeTimeKey(slot.start_time);
    const timeIndex = TIME_SLOTS.findIndex((ts) => ts.start === startHHMM);
    if (timeIndex === -1) return;
    set.add(`${dayIndex}-${timeIndex}`);
  });
  return set;
}

export function keySetToSlots(set) {
  return Array.from(set).map((slotKey) => {
    const [dayIndex, timeIndex] = slotKey.split('-').map(Number);
    const { start, end } = TIME_SLOTS[timeIndex];
    return {
      day_of_week: DAY_NAMES[dayIndex],
      start_time: start,
      end_time: end,
    };
  });
}
