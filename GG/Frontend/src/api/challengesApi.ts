import { http } from './http';

export type ChallengeRow = {
  id: number;
  challengerId: number;
  challengedId: number;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'expired';
};

export async function getIncomingPendingChallenges(userId: string): Promise<ChallengeRow[]> {
  try {
    const res = await http.get<{ challenges?: ChallengeRow[] }>(`/api/challenges/user/${userId}?status=pending`);
    const rows = Array.isArray(res?.challenges) ? res.challenges : [];
    return rows.filter((row) => Number(row.challengedId) === Number(userId));
  } catch {
    return [];
  }
}
