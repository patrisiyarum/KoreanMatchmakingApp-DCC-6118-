export interface GeneratedAvatar {
  bgColor: string;
  fgColor: string;
  eyeChar: string;
  mouthChar: string;
  eyeGapEm: number;
  mouthOffsetPx: number;
  tiltDeg: number;
}

const PASTEL_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#FEE2E2', fg: '#991B1B' },
  { bg: '#FED7AA', fg: '#9A3412' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#D9F99D', fg: '#365314' },
  { bg: '#A7F3D0', fg: '#065F46' },
  { bg: '#A5F3FC', fg: '#155E75' },
  { bg: '#BFDBFE', fg: '#1E3A8A' },
  { bg: '#DDD6FE', fg: '#5B21B6' },
  { bg: '#FBCFE8', fg: '#831843' },
];

const HANGUL_EYES = ['ㅇ', 'ㆍ', 'ㆁ', 'ㅎ', 'ㅡ', 'ㅂ', 'ㅍ', 'ㅁ'];
const HANGUL_MOUTHS = ['ㅅ', 'ㅁ', 'ㅂ', 'ㅍ', 'ㅎ', 'ㅗ', 'ㅡ', 'ㅈ'];
const ASCII_EYES = ['o', 'O', '^', '*', '-', '+', '>', '@'];
const ASCII_MOUTHS = ['_', '.', 'v', 'w', 'o', '-', '~', '3'];

function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function uniform01(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt + 1, 2654435761)) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 1_000_000) / 1_000_000;
}

function triangular01(seed: number, saltBase: number): number {
  return (uniform01(seed, saltBase) + uniform01(seed, saltBase + 100)) / 2;
}

function pickFromRange(t: number, min: number, max: number): number {
  return min + t * (max - min);
}

function pickFromList<T>(seed: number, salt: number, list: T[]): T {
  return list[Math.floor(uniform01(seed, salt) * list.length)];
}

export function generateAvatar(
  seed: string | number,
  nativeLanguage?: string | null,
): GeneratedAvatar {
  const seedStr = String(seed || '');
  const seedNum = hash32(seedStr);
  const palette = PASTEL_PALETTE[seedNum % PASTEL_PALETTE.length];
  const useHangul = (nativeLanguage || '').toLowerCase() === 'korean';
  const eyeSet = useHangul ? HANGUL_EYES : ASCII_EYES;
  const mouthSet = useHangul ? HANGUL_MOUTHS : ASCII_MOUTHS;

  return {
    bgColor: palette.bg,
    fgColor: palette.fg,
    eyeChar: pickFromList(seedNum, 1, eyeSet),
    mouthChar: pickFromList(seedNum, 2, mouthSet),
    eyeGapEm: pickFromRange(triangular01(seedNum, 10), 0.05, 0.4),
    mouthOffsetPx: pickFromRange(triangular01(seedNum, 20), -2, 4),
    tiltDeg: pickFromRange(triangular01(seedNum, 30), -6, 6),
  };
}
