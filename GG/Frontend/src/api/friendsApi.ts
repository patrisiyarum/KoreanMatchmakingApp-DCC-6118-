import { http } from './http';

export type FriendRow = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string | null;
};

export async function getFriendsList(userId: string): Promise<FriendRow[]> {
  try {
    const res = await http.get<{ friendsList?: FriendRow[] }>(`/api/v1/friends/${userId}`);
    return Array.isArray(res?.friendsList) ? res.friendsList : [];
  } catch {
    return [];
  }
}
