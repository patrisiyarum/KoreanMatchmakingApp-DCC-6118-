import { http } from './http';

export interface TranslateResponse {
  translatedText: string;
}

export interface TranslateErrorResponse {
  error: string;
}

export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const res = (await http.post<TranslateResponse>('/api/v1/translate', {
    text,
    from,
    to,
  })) as unknown as TranslateResponse;
  return res?.translatedText ?? '';
}
