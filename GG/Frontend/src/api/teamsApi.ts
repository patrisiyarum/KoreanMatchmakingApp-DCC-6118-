import { http } from './http';

export type TeamMemberUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  xp?: number;
  level?: number;
};

export type TeamMemberRow = {
  id?: number;
  teamId: number;
  userId: number;
  role: string;
  user?: TeamMemberUser;
};

export type TeamRow = {
  id: number;
  name: string;
  logo?: string;
  inviteCode?: string;
  totalXP?: number;
  ownerID?: number;
  members?: TeamMemberRow[];
};

export type TeamInviteRow = {
  id: number;
  teamId: number;
  inviterId: number;
  inviteeId: number;
  status: 'pending' | 'accepted' | 'declined';
  team?: TeamRow;
  Team?: TeamRow;
  inviter?: { id: number; firstName?: string; lastName?: string };
  Inviter?: { id: number; firstName?: string; lastName?: string };
};

export type TeamMatchResponse = {
  matched: boolean;
  message?: string;
  team?: TeamRow;
  opponent?: TeamRow;
};

export async function fetchMyTeam(userId: string): Promise<{
  team: TeamRow | null;
  myRole?: string;
} | null> {
  try {
    return await http.get<{ team: TeamRow | null; myRole?: string }>(
      `/api/teams/my-team/${userId}`
    );
  } catch {
    return null;
  }
}

export async function createTeam(userId: string, teamName: string, logo?: string) {
  return http.post<{ team: TeamRow; inviteCode: string }>('/api/teams/create', {
    userId: Number(userId),
    teamName,
    logo: logo || '🏆',
  }) as Promise<{ team: TeamRow; inviteCode: string }>;
}

export async function sendTeamInvite(ownerId: string, inviteeId: string) {
  return http.post<{ invite?: { id: number }; team?: TeamRow; error?: string }>('/api/teams/send-invite', {
    inviterId: Number(ownerId),
    inviteeId: Number(inviteeId),
  });
}

export async function getPendingTeamInvites(userId: string): Promise<TeamInviteRow[]> {
  try {
    const res = await http.get<{ invites?: TeamInviteRow[] }>(`/api/teams/invites/${userId}`);
    const rows = Array.isArray(res?.invites) ? res.invites : [];
    return rows.map((row) => ({
      ...row,
      team: row.team ?? row.Team,
      inviter: row.inviter ?? row.Inviter,
    }));
  } catch {
    return [];
  }
}

export async function acceptTeamInvite(inviteId: number, userId: string): Promise<{ team?: TeamRow } | null> {
  try {
    return await http.post<{ team?: TeamRow }>(`/api/teams/invites/${inviteId}/accept`, {
      userId: Number(userId),
    });
  } catch {
    return null;
  }
}

export async function declineTeamInvite(inviteId: number, userId: string): Promise<boolean> {
  try {
    await http.post(`/api/teams/invites/${inviteId}/decline`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function findTeamMatch(userId: string): Promise<TeamMatchResponse | null> {
  try {
    return await http.get<TeamMatchResponse>(`/api/teams/matchmake/${userId}`);
  } catch {
    return null;
  }
}

export type CurrentMatchResponse = TeamMatchResponse & { waiting?: boolean };

export async function getCurrentTeamMatch(userId: string): Promise<CurrentMatchResponse | null> {
  try {
    return await http.get<CurrentMatchResponse>(`/api/teams/current-match/${userId}`);
  } catch {
    return null;
  }
}

export async function endTeamMatch(userId: string): Promise<boolean> {
  try {
    await http.post('/api/teams/end-match', { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function leaveTeam(userId: string): Promise<boolean> {
  try {
    await http.delete('/api/teams/leave', { data: { userId: Number(userId) } });
    return true;
  } catch {
    return false;
  }
}
