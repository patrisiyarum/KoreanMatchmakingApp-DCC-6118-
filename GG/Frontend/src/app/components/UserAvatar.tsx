import { useState } from 'react';
import { generateAvatar } from '../utils/generateAvatar';
import { publicAssetUrl } from '../utils/profileImage';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UserAvatarProps {
  /** Stable identifier used to seed the generated avatar (e.g. user id). */
  seed: string | number;
  /** Display name; used for accessibility. */
  name?: string;
  /** Server path or URL to a real photo. If present, rendered instead of the generated face. */
  profileImage?: string | null;
  /** When 'Korean' (case-insensitive) the face uses Hangul jamo; otherwise ASCII. */
  nativeLanguage?: string | null;
  size?: Size;
  className?: string;
}

const SIZE: Record<Size, { box: string; face: string }> = {
  sm: { box: 'w-8 h-8', face: 'text-xs' },
  md: { box: 'w-10 h-10', face: 'text-sm' },
  lg: { box: 'w-14 h-14', face: 'text-base' },
  xl: { box: 'w-20 h-20', face: 'text-xl' },
  '2xl': { box: 'w-24 h-24', face: 'text-2xl' },
};

export function UserAvatar({
  seed,
  name,
  profileImage,
  nativeLanguage,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const sizing = SIZE[size];
  const [imgFailed, setImgFailed] = useState(false);
  const photoSrc = imgFailed ? null : publicAssetUrl(profileImage);
  const ariaLabel = name ? `${name}'s avatar` : 'Profile avatar';

  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt=""
        aria-label={ariaLabel}
        onError={() => setImgFailed(true)}
        className={`${sizing.box} rounded-full object-cover border border-neutral-200 ${className}`}
      />
    );
  }

  const a = generateAvatar(seed, nativeLanguage);

  return (
    <div
      className={`${sizing.box} ${sizing.face} rounded-full flex items-center justify-center select-none overflow-hidden font-semibold ${className}`}
      style={{ backgroundColor: a.bgColor, color: a.fgColor }}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className="flex flex-col items-center leading-none"
        style={{ transform: `rotate(${a.tiltDeg}deg)` }}
      >
        <div className="flex" style={{ gap: `${a.eyeGapEm}em` }}>
          <span>{a.eyeChar}</span>
          <span>{a.eyeChar}</span>
        </div>
        <div style={{ marginTop: `${a.mouthOffsetPx}px` }}>{a.mouthChar}</div>
      </div>
    </div>
  );
}
