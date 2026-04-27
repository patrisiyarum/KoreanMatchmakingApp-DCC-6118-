import { http } from './http';

export type ChallengeRow = {
  id: number;
  challengerId: number;
  challengedId: number;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'expired';
  challengerScore?: number | null;
  challengedScore?: number | null;
  winnerId?: number | null;
  gameType?: string | null;
  completedAt?: string | null;
  challenger?: { id: number; firstName?: string; lastName?: string };
  challenged?: { id: number; firstName?: string; lastName?: string };
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

export async function getChallengesForUser(userId: string): Promise<ChallengeRow[]> {
  try {
    const res = await http.get<{ challenges?: ChallengeRow[] }>(`/api/challenges/user/${userId}`);
    return Array.isArray(res?.challenges) ? res.challenges : [];
  } catch {
    return [];
  }
}

export async function createChallengeApi(
  challengerId: string,
  challengedId: string,
  gameType = 'vocab',
  difficulty = 'Beginner'
): Promise<ChallengeRow | null> {
  try {
    const res = await http.post<{ challenge?: ChallengeRow }>('/api/challenges', {
      challengerId: Number(challengerId),
      challengedId: Number(challengedId),
      gameType,
      difficulty,
    });
    return res?.challenge ?? null;
  } catch {
    return null;
  }
}

export async function acceptChallengeApi(challengeId: string, userId: string): Promise<boolean> {
  try {
    await http.put(`/api/challenges/${challengeId}/accept`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function deleteChallengeApi(challengeId: string, userId: string): Promise<boolean> {
  try {
    await http.delete(`/api/challenges/${challengeId}`, { data: { userId: Number(userId) } });
    return true;
  } catch {
    return false;
  }
}

export async function declineChallengeApi(challengeId: string, userId: string): Promise<boolean> {
  try {
    await http.put(`/api/challenges/${challengeId}/decline`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function submitChallengeScoreApi(
  challengeId: string,
  userId: string,
  score: number
): Promise<boolean> {
  try {
    await http.post(`/api/challenges/${challengeId}/submit-score`, { userId: Number(userId), score });
    return true;
  } catch {
    return false;
  }
}
