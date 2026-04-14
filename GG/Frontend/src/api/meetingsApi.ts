import { http } from './http';

export type CreateMeetingBody = {
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export type MeetingRow = {
  id: number;
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function createMeetingApi(body: CreateMeetingBody) {
  return http.post<{ message?: string; id?: number }>('/api/v1/createMeeting', body);
}

export async function getMeetingsForUserApi(userId: string): Promise<MeetingRow[]> {
  const res = await http.get<MeetingRow[] | { meetings?: MeetingRow[] }>(`/api/v1/meetings/${userId}`);
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.meetings) ? res.meetings : [];
}
