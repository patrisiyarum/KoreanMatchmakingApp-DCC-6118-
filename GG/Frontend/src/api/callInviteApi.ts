import { http } from './http';

export type CallInviteRow = {
  id: number;
  callerId: number;
  calleeId: number;
  channelId: string;
  status: 'ringing' | 'accepted' | 'declined' | 'cancelled' | 'missed';
  createdAt?: string;
  respondedAt?: string | null;
  caller?: { id: number; firstName?: string; lastName?: string; profileImage?: string | null };
};

export async function createCallInvite(callerId: string, calleeId: string, channelId: string): Promise<CallInviteRow | null> {
  try {
    const res = await http.post<{ invite?: CallInviteRow }>('/api/v1/call-invite', {
      callerId: Number(callerId),
      calleeId: Number(calleeId),
      channelId,
    });
    return res?.invite ?? null;
  } catch {
    return null;
  }
}

export async function getIncomingInvite(userId: string): Promise<CallInviteRow | null> {
  try {
    const res = await http.get<{ invite: CallInviteRow | null }>(`/api/v1/call-invite/incoming/${userId}`);
    return res?.invite ?? null;
  } catch {
    return null;
  }
}

export async function acceptCallInvite(inviteId: number, userId: string): Promise<boolean> {
  try {
    await http.post(`/api/v1/call-invite/${inviteId}/accept`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function declineCallInvite(inviteId: number, userId: string): Promise<boolean> {
  try {
    await http.post(`/api/v1/call-invite/${inviteId}/decline`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

export async function cancelCallInvite(inviteId: number, userId: string): Promise<boolean> {
  try {
    await http.post(`/api/v1/call-invite/${inviteId}/cancel`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}
