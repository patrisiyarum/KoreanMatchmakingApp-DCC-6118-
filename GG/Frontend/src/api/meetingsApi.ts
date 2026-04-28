import { http } from './http';

export type CreateMeetingBody = {
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  topic?: string;
  zoom_link?: string;
};

export type MeetingRow = {
  id: number;
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  topic?: string | null;
  zoom_link?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ZoomMeetingResponse = {
  message?: string;
  meetingId?: number | string;
  joinUrl?: string;
  startUrl?: string;
  password?: string | null;
};

export type AgoraTokenResponse = {
  appId: string;
  channelName: string;
  uid: number;
  token?: string | null;
  expiresAt: number;
  mode?: 'token' | 'appIdOnly';
  warning?: string | null;
};

export async function createMeetingApi(body: CreateMeetingBody) {
  return http.post<{ message?: string; id?: number }>('/api/v1/createMeeting', body);
}

export type DeleteMeetingBody = {
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
};

export async function deleteMeetingApi(body: DeleteMeetingBody) {
  return http.delete<{ message?: string; affectedRows?: number }>(
    '/api/v1/deleteMeeting',
    { data: body }
  );
}

export async function getMeetingsForUserApi(userId: string): Promise<MeetingRow[]> {
  const res = await http.get<MeetingRow[] | { meetings?: MeetingRow[] }>(`/api/v1/meetings/${userId}`);
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.meetings) ? res.meetings : [];
}

export async function createZoomMeetingApi(body: {
  topic: string;
  start_time_iso: string;
  timezone: string;
  duration_minutes: number;
}) {
  return http.post<ZoomMeetingResponse>('/api/v1/zoom/create-meeting', body);
}

export async function createAgoraTokenApi(body: {
  channelName: string;
  uid: number;
}) {
  return http.post<AgoraTokenResponse>('/api/v1/agora/token', body);
}
