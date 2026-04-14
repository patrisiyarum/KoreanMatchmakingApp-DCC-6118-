import { http } from './http';

export type TeamVsQuestRow = {
  questId: number;
  title: string;
  description: string;
  gameType: string | null;
  goal: number;
  xpReward: number;
  leader: 'team' | 'opponent' | 'tied';
  team: {
    progress: number;
    completed: boolean;
    completedAt?: string | null;
    percent: number;
  };
  opponent: {
    progress: number;
    completed: boolean;
    completedAt?: string | null;
    percent: number;
  };
};

export type TeamVsBoard = {
  team?: { id: number; name: string; totalXP: number };
  opponentTeam?: { id: number; name: string; totalXP: number };
  quests: TeamVsQuestRow[];
};

export async function getTeamVsBoard(teamId: number, opponentTeamId: number): Promise<TeamVsBoard | null> {
  try {
    return await http.get<TeamVsBoard>(`/api/quests/team-vs/${teamId}/${opponentTeamId}`);
  } catch {
    return null;
  }
}

export async function incrementTeamQuestProgress(userId: string, gameType: string): Promise<boolean> {
  try {
    await http.post('/api/quests/team/increment', {
      userId: Number(userId),
      gameType,
    });
    return true;
  } catch {
    return false;
  }
}
