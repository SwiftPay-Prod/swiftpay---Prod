'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
  'aria-label'?: string;
}

export function ProgressBar({ value, className, color, 'aria-label': ariaLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplayWidth(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn('h-1.5 w-full rounded-full bg-surface-foreground/10 overflow-hidden', className)}
    >
      <div
        className="relative h-full rounded-full transition-all duration-700 overflow-hidden"
        style={{ width: `${displayWidth}%`, backgroundColor: color ?? 'var(--color-accent)' }}
      >
        <div className="absolute inset-y-0 w-1/2 animate-shimmer bg-linear-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
}
