import axios from 'axios';
import { http } from './http';
import { getApiBase } from './apiBase';

export type PostcardRow = {
  id: number;
  senderId: number;
  receiverId: number;
  message: string | null;
  backgroundRef: string;
  /** Parsed array of sticker keys — the backend getter deserialises the TEXT column */
  stickerRefs: string[];
  /** Parsed array of /uploads/... image paths */
  imageUrls: string[];
  /** 'background' = dim overlay on front face | 'attachment' = flip carousel on back */
  imagePlacement: 'background' | 'attachment';
  sentAt: string;
  readAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RecentMediaRow = {
  id: number;
  userId: number;
  assetType: 'sticker' | 'background';
  assetRef: string;
  lastUsedAt: string;
};

export type LimitStatus = {
  sentToday: number;
  limit: number;
  remaining: number;
  resetsAt: string | null;
};

type SendPayload = {
  message: string;
  backgroundRef: string;
  stickerRefs: string[];
  imageUrls: string[];
  imagePlacement: 'background' | 'attachment';
};

// POST /api/v1/postcards
export async function sendPostcard(
  senderId: string,
  receiverId: string,
  payload: SendPayload
): Promise<PostcardRow | null> {
  const res = await http.post<{ postcardData?: PostcardRow }>('/api/v1/postcards', {
    senderId: Number(senderId),
    receiverId: Number(receiverId),
    ...payload,
  });
  return res?.postcardData ?? null;
}

// GET /api/v1/postcards/received/:userId
export async function getReceivedPostcards(userId: string): Promise<PostcardRow[]> {
  const res = await http.get<{ postcards?: PostcardRow[] }>(
    `/api/v1/postcards/received/${userId}`
  );
  return Array.isArray(res?.postcards) ? res.postcards : [];
}

// GET /api/v1/postcards/sent/:userId
export async function getSentPostcards(userId: string): Promise<PostcardRow[]> {
  const res = await http.get<{ postcards?: PostcardRow[] }>(
    `/api/v1/postcards/sent/${userId}`
  );
  return Array.isArray(res?.postcards) ? res.postcards : [];
}

// PUT /api/v1/postcards/:postcardId/read
export async function markPostcardRead(
  postcardId: number,
  userId: string
): Promise<boolean> {
  try {
    await http.put(`/api/v1/postcards/${postcardId}/read`, { userId: Number(userId) });
    return true;
  } catch {
    return false;
  }
}

// GET /api/v1/postcards/limit/:senderId/:receiverId
export async function getPostcardLimitStatus(
  senderId: string,
  receiverId: string
): Promise<LimitStatus | null> {
  try {
    const res = await http.get<{ limitStatus?: LimitStatus }>(
      `/api/v1/postcards/limit/${senderId}/${receiverId}`
    );
    return res?.limitStatus ?? null;
  } catch {
    return null;
  }
}

// POST /api/upload/postcard  (mirrors uploadProfileImage in profileApi.ts)
export async function uploadPostcardImage(userId: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('userId', userId);
  const { data } = await axios.post<{ imageUrl: string }>(
    `${getApiBase()}/api/upload/postcard`,
    fd,
    { withCredentials: true }
  );
  return data.imageUrl;
}

// DELETE /api/v1/postcards/:postcardId
export async function deletePostcard(
  postcardId: number,
  userId: string
): Promise<boolean> {
  try {
    await http.delete(`/api/v1/postcards/${postcardId}`, { data: { userId: Number(userId) } });
    return true;
  } catch {
    return false;
  }
}

// GET /api/v1/postcards/recent-media/:userId
export async function getRecentMedia(userId: string): Promise<RecentMediaRow[]> {
  try {
    const res = await http.get<{ recentMedia?: RecentMediaRow[] }>(
      `/api/v1/postcards/recent-media/${userId}`
    );
    return Array.isArray(res?.recentMedia) ? res.recentMedia : [];
  } catch {
    return [];
  }
}
