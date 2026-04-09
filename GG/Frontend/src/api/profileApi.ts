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
