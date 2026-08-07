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
      className={cn('h-1.5 w-full rounded-full bg-surface border border-border/50 overflow-hidden', className)}
    >
      <div
        className="h-full rounded-full transition-all duration-500 overflow-hidden"
        style={{ width: `${displayWidth}%`, backgroundColor: color ?? 'var(--accent)' }}
      />
    </div>
  );
}
