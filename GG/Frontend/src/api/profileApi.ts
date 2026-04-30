import axios from 'axios';
import { getApiBase } from './apiBase';
import { http } from './http';

export type UserAccountRow = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string | null;
};

export type ProfileRow = {
  id: number;
  native_language?: string;
  target_language?: string;
  target_language_proficiency?: string;
  bio?: string | null;
  learning_goal?: string | null;
  communication_style?: string | null;
  commitment_level?: number | null;
  age?: number | null;
  gender?: string | null;
  profession?: string | null;
  mbti?: string | null;
  zodiac?: string | null;
  default_time_zone?: string | null;
  visibility?: string | null;
};

export type ProfileOptions = {
  learningGoals: string[];
  communicationStyles: string[];
  commitmentLevel: { min: number; max: number; default: number };
};

export type UserGameStats = {
  gamesPlayed: number;
  termMatching: number;
  grammarQuiz: number;
  pronunciation: number;
  perfectRounds: number;
};

export type UserGameStatsPayload = {
  xp?: number;
  level?: number;
  xpToNext?: number;
  gameActivity?: UserGameStats | null;
};

export async function fetchUserAccount(userId: string): Promise<UserAccountRow | null> {
  try {
    const data = await http.get<UserAccountRow>(`/api/getUser/${userId}`);
    return data && typeof data === 'object' && 'id' in data ? data : null;
  } catch {
    return null;
  }
}

export async function fetchUserProfilePayload(userId: string): Promise<ProfileRow | null> {
  try {
    const res = await http.get<{ message?: string; data?: ProfileRow }>(
      `/api/v1/getUserProfile/${userId}`
    );
    return res?.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchUserGameStats(userId: string): Promise<UserGameStatsPayload | null> {
  try {
    return await http.get<UserGameStatsPayload>(
      `/api/games/user-stats/${userId}?t=${Date.now()}`
    );
  } catch {
    return null;
  }
}

export async function fetchProfileOptions(): Promise<ProfileOptions | null> {
  try {
    const res = await http.get<{ data?: ProfileOptions }>(
      '/api/v1/profile-customization-options'
    );
    return res?.data ?? null;
  } catch {
    return null;
  }
}

export async function createProfile(body: Record<string, unknown>) {
  return http.post<{
    errorCode: number;
    message?: string;
  }>('/api/v1/create-profile', body) as Promise<{ errorCode: number; message?: string }>;
}

export async function updateProfile(body: Record<string, unknown>) {
  return http.put<{
    errorCode: number;
    message?: string;
  }>('/api/v1/update-profile', body) as Promise<{ errorCode: number; message?: string }>;
}

export async function uploadProfileImage(userId: string, file: File) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('userId', userId);
  const { data } = await axios.post<{ profileImage: string }>(
    `${getApiBase()}/api/upload/profile`,
    fd,
    { withCredentials: true }
  );
  return data;
}

export async function deleteUserAccount(userId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = (await http.delete<{ message?: string }>(`/api/v1/delete-user/${userId}`)) as
      | { message?: string }
      | undefined;
    return { ok: true, message: res?.message };
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return { ok: false, message: err.response?.data?.message || err.message || 'Delete failed' };
  }
}

export async function removeProfileImage(userId: string) {
  const { data } = await axios.delete<{ message?: string }>(
    `${getApiBase()}/api/upload/profile`,
    {
      withCredentials: true,
      data: { userId },
    }
  );
  return data;
}

export type GameType = 'term-matching' | 'grammar-quiz' | 'pronunciation-drill';
 
export type SubmitGameResultPayload = {
  userId: string;
  gameType: GameType;
  score: number;
  totalQuestions: number;
};
 
export type SubmitGameResultResponse = {
  errorCode: number;
  message?: string;
  xpAwarded?: number;
  totalXp?: number;
  level?: number;
  xpToNext?: number;
  newBadges?: Array<{
    id: number;
    name: string;
    description?: string;
    icon?: string | null;
    tier?: string | null;
  }>;
};
 
export async function submitGameResult(
  payload: SubmitGameResultPayload
): Promise<SubmitGameResultResponse> {
  try {
    const res = await http.post<SubmitGameResultResponse>('/api/games/submit', payload);
    return res ?? { errorCode: 1, message: 'No response from server' };
  } catch {
    return { errorCode: 1, message: 'Failed to submit game result' };
  }
}