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
    wrapper: 'gap-2.5',
    mark: 'w-9 h-9',
    full: 'h-9 w-auto',
    text: 'text-base sm:text-lg',
  },
  md: {
    wrapper: 'gap-3',
    mark: 'w-10 h-10',
    full: 'h-10 w-auto',
    text: 'text-xl sm:text-2xl',
  },
  lg: {
    wrapper: 'gap-3.5',
    mark: 'w-14 h-14',
    full: 'h-14 w-auto',
    text: 'text-2xl sm:text-3xl',
  },
  xl: {
    wrapper: 'gap-4',
    mark: 'w-20 h-20',
    full: 'h-20 w-auto',
    text: 'text-3xl sm:text-4xl',
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
          src="/logo.png"
          alt="MatchSkill"
          className={`${classes.full} object-contain drop-shadow-sm ${markClassName}`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${classes.wrapper} ${className}`}>
      <span
        className={`${classes.mark} shrink-0 flex items-center justify-center overflow-hidden drop-shadow-xs transition-transform duration-200 ${markClassName}`}
        aria-hidden="true"
      >
        <img
          src="/logo.png"
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

