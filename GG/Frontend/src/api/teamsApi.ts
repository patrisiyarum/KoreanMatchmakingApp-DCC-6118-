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
    return Array.isArray(res?.invites) ? res.invites : [];
  } catch {
    return [];
  }
}
