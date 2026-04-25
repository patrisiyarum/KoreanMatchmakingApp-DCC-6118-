import type { CSSProperties } from 'react';

// ---------------------------------------------------------------------------
// Background catalog
// Each entry has a stable `ref` key stored in the database, a display label,
// a CSS `style` object applied to the postcard canvas, and a `darkText` flag
// that controls whether text / UI elements on the canvas should be dark.
// ---------------------------------------------------------------------------
export const BACKGROUNDS = [
  {
    ref: 'cream',
    label: 'Cream',
    labelKo: '크림',
    style: { background: '#fef9f0' } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'cherry-blossom',
    label: 'Cherry Blossom',
    labelKo: '벚꽃',
    style: {
      background: 'linear-gradient(135deg, #fce4ec 0%, #f48fb1 50%, #ffd6e0 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'hanok',
    label: 'Hanok',
    labelKo: '한옥',
    style: {
      background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a96a 60%, #b07d3a 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'seoul-night',
    label: 'Seoul Night',
    labelKo: '서울 야경',
    style: {
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'haenyeo-sea',
    label: 'Haenyeo Sea',
    labelKo: '해녀 바다',
    style: {
      background: 'linear-gradient(135deg, #e0f7fa 0%, #26c6da 50%, #00838f 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'autumn-ginkgo',
    label: 'Autumn Ginkgo',
    labelKo: '가을 은행',
    style: {
      background: 'linear-gradient(135deg, #fff9c4 0%, #ffb300 60%, #e65100 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'ink-wash',
    label: 'Ink Wash',
    labelKo: '수묵화',
    style: {
      background: 'linear-gradient(135deg, #f5f5f5 0%, #bdbdbd 60%, #757575 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'sunrise',
    label: 'Sunrise',
    labelKo: '일출',
    style: {
      background: 'linear-gradient(135deg, #ffd1d1 0%, #ffab76 50%, #ffecd2 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'royal-blue',
    label: 'Royal Blue',
    labelKo: '로얄 블루',
    style: {
      background: 'linear-gradient(135deg, #e8f0fe 0%, #4285f4 50%, #1a237e 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'lavender',
    label: 'Lavender',
    labelKo: '라벤더',
    style: {
      background: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 50%, #7b1fa2 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'persimmon',
    label: 'Persimmon',
    labelKo: '감',
    style: {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'celadon',
    label: 'Celadon',
    labelKo: '청자',
    style: {
      background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'hanbok-crimson',
    label: 'Hanbok Crimson',
    labelKo: '한복 빨강',
    style: {
      background: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 50%, #991b1b 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'bamboo-forest',
    label: 'Bamboo Forest',
    labelKo: '대숲',
    style: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #16a34a 60%, #14532d 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'hanji',
    label: 'Hanji',
    labelKo: '한지',
    style: {
      background: 'linear-gradient(135deg, #fefce8 0%, #fde68a 55%, #ca8a04 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'moonlight',
    label: 'Moonlight',
    labelKo: '달빛',
    style: {
      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    } as CSSProperties,
    darkText: true,
  },
  {
    ref: 'lotus',
    label: 'Lotus',
    labelKo: '연꽃',
    style: {
      background: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 50%, #be185d 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'jade',
    label: 'Jade',
    labelKo: '비취',
    style: {
      background: 'linear-gradient(135deg, #ccfbf1 0%, #2dd4bf 50%, #0f766e 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'monsoon',
    label: 'Monsoon',
    labelKo: '장마',
    style: {
      background: 'linear-gradient(135deg, #e2e8f0 0%, #64748b 60%, #1e293b 100%)',
    } as CSSProperties,
    darkText: false,
  },
  {
    ref: 'dusk',
    label: 'Dusk',
    labelKo: '황혼',
    style: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 30%, #db2777 65%, #7c3aed 100%)',
    } as CSSProperties,
    darkText: false,
  },
] as const;

export type BackgroundRef = (typeof BACKGROUNDS)[number]['ref'];

export function getBackground(ref: string) {
  return BACKGROUNDS.find((b) => b.ref === ref) ?? BACKGROUNDS[0];
}

// ---------------------------------------------------------------------------
// Sticker catalog
// Korean/East-Asian cultural emoji used as predefined stickers.
// ---------------------------------------------------------------------------
export const STICKERS = [
  { ref: 'cherry-blossom', emoji: '🌸', label: 'Cherry Blossom', labelKo: '벚꽃' },
  { ref: 'lantern',        emoji: '🏮', label: 'Red Lantern',     labelKo: '홍등' },
  { ref: 'dolls',          emoji: '🎎', label: 'Korean Dolls',    labelKo: '인형' },
  { ref: 'ramen',          emoji: '🍜', label: 'Ramen',           labelKo: '라면' },
  { ref: 'chopsticks',     emoji: '🥢', label: 'Chopsticks',      labelKo: '젓가락' },
  { ref: 'bamboo',         emoji: '🎋', label: 'Bamboo',          labelKo: '대나무' },
  { ref: 'moon',           emoji: '🌙', label: 'Moon',            labelKo: '달' },
  { ref: 'butterfly',      emoji: '🦋', label: 'Butterfly',       labelKo: '나비' },
  { ref: 'hibiscus',       emoji: '🌺', label: 'Hibiscus',        labelKo: '무궁화' },
  { ref: 'wind-chime',     emoji: '🎐', label: 'Wind Chime',      labelKo: '풍경' },
  { ref: 'green-tea',      emoji: '🍵', label: 'Green Tea',       labelKo: '녹차' },
  { ref: 'dumpling',       emoji: '🥟', label: 'Dumpling',        labelKo: '만두' },
  { ref: 'wave',           emoji: '🌊', label: 'Wave',            labelKo: '파도' },
  { ref: 'dragon',         emoji: '🐉', label: 'Dragon',          labelKo: '용' },
  { ref: 'heart',          emoji: '❤️', label: 'Heart',           labelKo: '하트' },
  { ref: 'sparkles',       emoji: '✨', label: 'Sparkles',        labelKo: '반짝임' },
  { ref: 'fire',           emoji: '🔥', label: 'Fire',            labelKo: '불꽃' },
  { ref: 'star',           emoji: '⭐', label: 'Star',            labelKo: '별' },
  { ref: 'rainbow',        emoji: '🌈', label: 'Rainbow',         labelKo: '무지개' },
  { ref: 'flower-bouquet', emoji: '💐', label: 'Flowers',         labelKo: '꽃다발' },
] as const;

export type StickerRef = (typeof STICKERS)[number]['ref'];

export function getSticker(ref: string) {
  return STICKERS.find((s) => s.ref === ref);
}

export const MAX_STICKERS = 5;
export const MAX_MESSAGE_LENGTH = 200;
export const SEND_WINDOW_HOURS = 8;
export const LIMIT_ENABLED = true;
