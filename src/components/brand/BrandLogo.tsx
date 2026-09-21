import React from 'react';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  markClassName?: string;
  variant?: 'mark' | 'full';
};

const sizeClasses = {
  sm: {
    wrapper: 'gap-2',
    mark: 'w-8 h-8',
    full: 'h-8 w-auto',
    text: 'text-base',
  },
  md: {
    wrapper: 'gap-2.5',
    mark: 'w-9 h-9',
    full: 'h-9 w-auto',
    text: 'text-xl',
  },
  lg: {
    wrapper: 'gap-3',
    mark: 'w-12 h-12',
    full: 'h-12 w-auto',
    text: 'text-2xl',
  },
  xl: {
    wrapper: 'gap-3.5',
    mark: 'w-16 h-16',
    full: 'h-16 w-auto',
    text: 'text-3xl',
  },
};

export function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
  markClassName = '',
  variant = 'mark',
}: BrandLogoProps) {
  const classes = sizeClasses[size];

  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src="/logo-full.png"
          alt="MatchSkill"
          className={`${classes.full} object-contain ${markClassName}`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${classes.wrapper} ${className}`}>
      <span
        className={`${classes.mark} shrink-0 rounded-xl bg-white/90 flex items-center justify-center p-0.5 shadow-2xs border border-sky-100/80 overflow-hidden ${markClassName}`}
        aria-hidden="true"
      >
        <img
          src="/logo-mark.png"
          alt="MatchSkill Mark"
          className="w-full h-full object-contain"
        />
      </span>

      {showText && (
        <span className={`font-black tracking-tight leading-none whitespace-nowrap ${classes.text} ${textClassName}`}>
          <span className="text-slate-950">Match</span>
          <span className="text-sky-600">Skill</span>
        </span>
      )}
    </span>
  );
}
