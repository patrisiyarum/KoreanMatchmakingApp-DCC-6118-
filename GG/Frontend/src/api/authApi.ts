import { http } from './http';

export type LoginResponse = {
  errorCode: number;
  message?: string;
  id?: number;
  user?: unknown;
};

export function loginApi(email: string, password: string) {
  return http.post<LoginResponse>('/api/login', { email, password }) as unknown as Promise<LoginResponse>;
}

export function registerApi(
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  return http.post<LoginResponse>('/Register', {
    firstName,
    lastName,
    email,
    password,
  }) as unknown as Promise<LoginResponse>;
}
