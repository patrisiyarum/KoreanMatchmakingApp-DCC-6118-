import axios from 'axios';
import { getApiBase } from './apiBase';
import type { User } from '../app/types';

const AVATAR_FALLBACK = ['😊', '🌸', '🎮', '📚', '✨', '🌟', '🦊', '🐱'];

function langToken(raw: string): User['nativeLanguage'] {
  const s = raw.toLowerCase();
  if (s.includes('korean') || s.includes('한국')) return 'Korean';
  return 'English';
}

function profToLevel(p: string | null | undefined): User['level'] {
  const s = (p || '').toLowerCase();
  if (s.includes('advanced') || s.includes('fluent') || s.includes('고급')) return 'Advanced';
  if (s.includes('beginner') || s.includes('elementary') || s.includes('초급')) return 'Beginner';
  return 'Intermediate';
}

export function discoverRowToUser(row: Record<string, unknown>): User {
  const id = String(row.id ?? '');
  const first = String(row.firstName ?? '').trim();
  const last = String(row.lastName ?? '').trim();
  const name = `${first} ${last}`.trim() || 'Partner';
  const interestNames = String(row.interestNames ?? '');
  const interests = interestNames
    ? interestNames.split('||').map((x) => x.trim()).filter(Boolean)
    : [];
  const pic = row.profileImage != null && String(row.profileImage) !== '' ? String(row.profileImage) : null;
  const n = Number(id) || 0;
  const emoji = AVATAR_FALLBACK[n % AVATAR_FALLBACK.length];
  const bioRaw = String(row.bio ?? '').trim();
  return {
    id,
    name,
    nativeLanguage: langToken(String(row.native_language ?? 'English')),
    learningLanguage: langToken(String(row.target_language ?? 'Korean')),
    interests,
    bio: bioRaw || '—',
    level: profToLevel(String(row.target_language_proficiency ?? '')),
    avatar: emoji,
    profileImage: pic,
  };
}

export async function fetchDiscoverUsers(requesterId: string): Promise<User[]> {
  const base = getApiBase();
  const url = `${base}/api/v1/discover-users?requesterId=${encodeURIComponent(requesterId)}`;
  try {
    const { data } = await axios.get<{ data?: Record<string, unknown>[] }>(url, {
      withCredentials: true,
    });
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.map(discoverRowToUser);
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { code?: string; message?: string } } };
    if (err.response?.status === 403) {
      const er = new Error(err.response.data?.message || 'Complete your profile first.') as Error & {
        code?: string;
      };
      er.code = err.response.data?.code || 'PROFILE_INCOMPLETE';
      throw er;
    }
    throw e;
  }
}
