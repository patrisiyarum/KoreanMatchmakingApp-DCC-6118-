import { http } from './http';

export type CreateMeetingBody = {
  user1_id: number;
  user2_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export async function createMeetingApi(body: CreateMeetingBody) {
  return http.post<{ message?: string; id?: number }>('/api/v1/createMeeting', body);
}
