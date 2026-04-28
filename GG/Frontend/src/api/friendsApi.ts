import { http } from './http';

export type FriendRow = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string | null;
  nativeLanguage?: string | null;
};

export type FriendRequestIncomingRow = {
  id: number;
  requesterId: number;
  recipientId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'removed';
  createdAt?: string;
  requesterFirstName?: string;
  requesterLastName?: string;
  requesterEmail?: string;
  requesterProfileImage?: string | null;
};

export type FriendRequestOutgoingRow = {
  id: number;
  requesterId: number;
  recipientId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'removed';
  createdAt?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  recipientProfileImage?: string | null;
};

export type LeaderboardEntry = {
  userId: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  xp: number;
  level: number;
  rank: number;
  isMe: boolean;
};

export type LeaderboardResponse = {
  total: number;
  myRank: number | null;
  myXp: number;
  entries: LeaderboardEntry[];
};

export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardResponse | null> {
  try {
    return await http.get<LeaderboardResponse>(`/api/v1/friends-leaderboard/${userId}`);
  } catch {
    return null;
  }
}

export async function getFriendsList(userId: string): Promise<FriendRow[]> {
  try {
    const res = await http.get<{ friendsList?: FriendRow[] }>(`/api/v1/friends/${userId}`);
    return Array.isArray(res?.friendsList) ? res.friendsList : [];
  } catch {
    return [];
  }
}

export async function sendFriendRequest(userId1: string, userId2: string): Promise<{ message?: string }> {
  return http.post<{ message?: string; error?: string }>('/api/v1/addTrueFriend', {
    userId1: Number(userId1),
    userId2: Number(userId2),
  });
}

export async function getFriendRequests(
  userId: string
): Promise<{ incoming: FriendRequestIncomingRow[]; outgoing: FriendRequestOutgoingRow[] }> {
  const res = await http.get<{
    incoming?: FriendRequestIncomingRow[];
    outgoing?: FriendRequestOutgoingRow[];
  }>(`/api/v1/friendRequests/${userId}`);
  return {
    incoming: Array.isArray(res?.incoming) ? res.incoming : [],
    outgoing: Array.isArray(res?.outgoing) ? res.outgoing : [],
  };
}

export async function acceptFriendRequest(requestId: number, userId: string): Promise<{ message?: string }> {
  return http.put<{ message?: string }>(`/api/v1/friendRequests/${requestId}/accept`, {
    userId: Number(userId),
  });
}

export async function rejectFriendRequest(requestId: number, userId: string): Promise<{ message?: string }> {
  return http.put<{ message?: string }>(`/api/v1/friendRequests/${requestId}/reject`, {
    userId: Number(userId),
  });
}
