import { http } from './http';
import {
  createProfile,
  fetchProfileOptions,
  fetchUserProfilePayload,
  updateProfile,
} from './profileApi';

export type InterestDto = { id: number; interest_name: string };

export async function fetchInterestCatalog(): Promise<InterestDto[]> {
  const data = await http.get<InterestDto[]>('/api/v1/interests');
  return Array.isArray(data) ? data : [];
}

/** Ensure each label exists in `Interest` and return numeric ids (order matches `names`). */
export async function resolveInterestIds(names: string[]): Promise<number[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const catalog = await fetchInterestCatalog();
  const byName = new Map(catalog.map((i) => [i.interest_name, i.id]));
  const ids: number[] = [];
  for (const name of unique) {
    let id = byName.get(name);
    if (id == null) {
      const created = await http.post<InterestDto>('/api/v1/interests', { interest_name: name });
      id = created.id;
      byName.set(name, id);
    }
    ids.push(id);
  }
  return ids;
}

export async function replaceUserInterestsApi(userId: string, interestIds: number[]) {
  await http.put(`/api/v1/users/${userId}/interests`, { interest_ids: interestIds });
}

export async function fetchUserInterestNames(userId: string): Promise<string[]> {
  const rows = await http.get<InterestDto[]>(`/api/v1/users/${userId}/interests`);
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => r.interest_name).filter(Boolean);
}

/**
 * Persist bio + interest tags for discover / matchmaking (creates a minimal profile if needed).
 */
export async function saveMatchmakingBioAndInterests(
  userId: string,
  bio: string,
  interestNames: string[]
): Promise<{ ok: boolean; message?: string }> {
  const trimmed = interestNames.map((n) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return { ok: false, message: 'Select at least one interest.' };
  }

  const profile = await fetchUserProfilePayload(userId);
  const hasProfile = Boolean(profile?.id);

  if (!hasProfile) {
    const opts = await fetchProfileOptions();
    if (!opts) return { ok: false, message: 'Could not load profile options.' };
    const res = await createProfile({
      id: Number(userId),
      native_language: 'English',
      target_language: 'Korean',
      target_language_proficiency: 'Beginner',
      age: 22,
      gender: 'Other',
      profession: 'Other',
      mbti: 'INTJ',
      zodiac: 'Aries',
      default_time_zone: 'UTC',
      visibility: 'Show',
      learning_goal: opts.learningGoals[0],
      communication_style: opts.communicationStyles[0],
      commitment_level: opts.commitmentLevel.default,
      bio: bio.trim() || undefined,
    });
    if (res.errorCode !== 0) return { ok: false, message: res.message };
  } else {
    const res = await updateProfile({
      id: Number(userId),
      bio: bio.trim(),
    });
    if (res.errorCode !== 0) return { ok: false, message: res.message };
  }

  const interestIds = await resolveInterestIds(trimmed);
  await replaceUserInterestsApi(userId, interestIds);
  return { ok: true };
}

export type WelcomeProfileInput = {
  userId: string;
  firstName: string;
  lastName: string;
  nativeLanguage: string;
  learningLanguage: string;
  proficiency: string;
  interestNames: string[];
  bio: string;
};

/** Save languages + bio + interests from the welcome screen (creates or updates profile + account names). */
export async function saveWelcomeProfile(input: WelcomeProfileInput): Promise<{ ok: boolean; message?: string }> {
  const trimmedInterests = input.interestNames.map((n) => n.trim()).filter(Boolean);
  if (trimmedInterests.length === 0) {
    return { ok: false, message: 'Select at least one interest.' };
  }

  const opts = await fetchProfileOptions();
  if (!opts) return { ok: false, message: 'Could not load profile options.' };

  const profile = await fetchUserProfilePayload(input.userId);
  const hasProfile = Boolean(profile?.id);

  const native = input.nativeLanguage.replace(/\s*한국어\s*$/, '').trim() || input.nativeLanguage;
  const target = input.learningLanguage.replace(/\s*한국어\s*$/, '').trim() || input.learningLanguage;
  const proficiency = mapWelcomeProficiency(input.proficiency);

  if (!hasProfile) {
    const res = await createProfile({
      id: Number(input.userId),
      native_language: native,
      target_language: target,
      target_language_proficiency: proficiency,
      age: 22,
      gender: 'Other',
      profession: 'Other',
      mbti: 'INTJ',
      zodiac: 'Aries',
      default_time_zone: 'UTC',
      visibility: 'Show',
      learning_goal: opts.learningGoals[0],
      communication_style: opts.communicationStyles[0],
      commitment_level: opts.commitmentLevel.default,
      bio: input.bio.trim() || undefined,
    });
    if (res.errorCode !== 0) return { ok: false, message: res.message };
    const nameRes = await updateProfile({
      id: Number(input.userId),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
    });
    if (nameRes.errorCode !== 0) return { ok: false, message: nameRes.message };
  } else {
    const res = await updateProfile({
      id: Number(input.userId),
      native_language: native,
      target_language: target,
      target_language_proficiency: proficiency,
      bio: input.bio.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      learning_goal: profile!.learning_goal ?? opts.learningGoals[0],
      communication_style: profile!.communication_style ?? opts.communicationStyles[0],
      commitment_level: profile!.commitment_level ?? opts.commitmentLevel.default,
      age: profile!.age ?? 22,
      gender: profile!.gender ?? 'Other',
      profession: profile!.profession ?? 'Other',
      mbti: profile!.mbti ?? 'INTJ',
      zodiac: profile!.zodiac ?? 'Aries',
      default_time_zone: profile!.default_time_zone ?? 'UTC',
      visibility: profile!.visibility ?? 'Show',
    });
    if (res.errorCode !== 0) return { ok: false, message: res.message };
  }

  const interestIds = await resolveInterestIds(trimmedInterests);
  await replaceUserInterestsApi(input.userId, interestIds);
  return { ok: true };
}

function mapWelcomeProficiency(label: string): string {
  const s = label.toLowerCase();
  if (s.includes('intermediate')) return 'Intermediate';
  if (s.includes('advanced')) return 'Advanced';
  return 'Beginner';
}
