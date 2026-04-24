import { http } from './http';

export type UserBadgeRow = {
  id: number;
  name: string;
  description?: string;
  icon?: string | null;
  tier?: string | null;
  category?: string | null;
  earnedAt?: string | null;
};

export async function getUserBadges(userId: string): Promise<UserBadgeRow[]> {
  try {
    const res = await http.get<{ badges?: UserBadgeRow[] }>(`/api/badges/user/${userId}`);
    return Array.isArray(res?.badges) ? res.badges : [];
  } catch {
    return [];
  }
}
