import { http } from './http';
import type { ApiAvailabilitySlot } from '@/lib/scheduleAvailability';

export async function getUserAvailability(userId: string): Promise<ApiAvailabilitySlot[]> {
  try {
    const rows = await http.get<
      { id?: number; day_of_week: string; start_time: string; end_time: string }[]
    >(`/api/v1/users/${userId}/availability`);
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({
      day_of_week: r.day_of_week,
      start_time: normalizeTime(r.start_time),
      end_time: normalizeTime(r.end_time),
    }));
  } catch {
    return [];
  }
}

function normalizeTime(t: string | { toString?: () => string }): string {
  const s = t && typeof t === 'object' && 'toString' in t ? String(t) : String(t);
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return s;
  return `${m[1].padStart(2, '0')}:${m[2].padStart(2, '0')}:${(m[3] || '00').padStart(2, '0')}`;
}

export async function replaceUserAvailability(userId: string, slots: ApiAvailabilitySlot[]) {
  return http.put(`/api/v1/users/${userId}/availability`, { slots }) as Promise<unknown>;
}
