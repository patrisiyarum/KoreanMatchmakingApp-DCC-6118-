import { User } from '../types';
import { generateAvatar } from '../utils/generateAvatar';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UserAvatarProps {
  user: Pick<User, 'id' | 'name' | 'nativeLanguage' | 'avatar'>;
  size?: Size;
  className?: string;
}

const SIZE: Record<Size, { box: string; emoji: string; face: string }> = {
  sm: { box: 'w-8 h-8', emoji: 'text-xl', face: 'text-xs' },
  md: { box: 'w-12 h-12', emoji: 'text-3xl', face: 'text-sm' },
  lg: { box: 'w-16 h-16', emoji: 'text-5xl', face: 'text-base' },
  xl: { box: 'w-20 h-20', emoji: 'text-5xl', face: 'text-lg' },
  '2xl': { box: 'w-28 h-28', emoji: 'text-6xl', face: 'text-2xl' },
};

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizing = SIZE[size];
  const hasEmoji = !!user.avatar && user.avatar.trim().length > 0;

  if (hasEmoji) {
    return (
      <div
        className={`${sizing.box} ${sizing.emoji} flex items-center justify-center leading-none ${className}`}
        aria-label={`${user.name}'s avatar`}
      >
        {user.avatar}
      </div>
    );
  }

  const a = generateAvatar(user);

  return (
    <div
      className={`${sizing.box} ${sizing.face} rounded-full flex items-center justify-center select-none overflow-hidden font-semibold ${className}`}
      style={{ backgroundColor: a.bgColor, color: a.fgColor }}
      role="img"
      aria-label={`${user.name}'s generated avatar`}
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
