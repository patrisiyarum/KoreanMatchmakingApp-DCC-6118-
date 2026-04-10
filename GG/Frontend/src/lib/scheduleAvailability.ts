/** Grid days (must match backend `day_of_week` strings). */
export const GRID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const GRID_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
] as const;

export type ApiAvailabilitySlot = {
  day_of_week: string;
  start_time: string;
  end_time: string;
};

function hourFromTime(t: string): number {
  const m = String(t).match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : 0;
}

/** End hour exclusive for half-open [start, end) style slots. */
function endHourExclusive(t: string): number {
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const min = parseInt((parts[1] || '0').replace(/\D/g, ''), 10) || 0;
  const sec = parseInt((parts[2] || '0').replace(/\D/g, ''), 10) || 0;
  if (min > 0 || sec > 0) return h + 1;
  return h;
}

/** Build `${Monday}-09:00` keys from API rows. */
export function apiSlotsToGridKeys(slots: ApiAvailabilitySlot[]): Set<string> {
  const set = new Set<string>();
  for (const s of slots) {
    if (!s?.day_of_week) continue;
    const startH = hourFromTime(s.start_time);
    const endEx = endHourExclusive(s.end_time);
    for (let h = startH; h < endEx; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      if ((GRID_HOURS as readonly string[]).includes(label)) {
        set.add(`${s.day_of_week}-${label}`);
      }
    }
  }
  return set;
}

export function gridKeysToApiSlots(keys: Set<string>): ApiAvailabilitySlot[] {
  const out: ApiAvailabilitySlot[] = [];
  for (const day of GRID_DAYS) {
    for (const time of GRID_HOURS) {
      if (!keys.has(`${day}-${time}`)) continue;
      const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
      const nextH = hh + 1;
      out.push({
        day_of_week: day,
        start_time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`,
        end_time: `${String(nextH).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`,
      });
    }
  }
  return out;
}

export function keysFromLegacySlots(
  slots: { day: string; time: string }[]
): Set<string> {
  const set = new Set<string>();
  for (const s of slots) {
    set.add(`${s.day}-${s.time}`);
  }
  return set;
}

/** Map grid label `HH:00` to API `HH:MM:00`. */
export function gridTimeToApi(time: string): string {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10));
  return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`;
}

/** One-hour meeting end from start grid label. */
export function gridTimeEndApi(startTime: string): string {
  const [h] = startTime.split(':').map((x) => parseInt(x, 10));
  return `${String(h + 1).padStart(2, '0')}:00:00`;
}

/** Next calendar date (ISO yyyy-mm-dd) for a weekday name in GRID_DAYS (Monday-first). */
export function nextDateIsoForWeekday(dayName: string): string {
  const idx = GRID_DAYS.indexOf(dayName as (typeof GRID_DAYS)[number]);
  if (idx < 0) return new Date().toISOString().slice(0, 10);
  const jsDow = idx === 6 ? 0 : idx + 1;
  const today = new Date();
  const cur = today.getDay();
  const add = (jsDow - cur + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}
