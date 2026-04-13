import { getApiBase } from '@/api/apiBase';

export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBase()}${path}`;
}
