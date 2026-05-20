'use client';

import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function LampGlowBackground({ className }: LiveBalanceBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,color-mix(in_oklch,var(--accent)_36%,transparent)_0%,transparent_52%)] opacity-65" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_112%,color-mix(in_oklch,var(--secondary)_24%,transparent)_0%,transparent_52%)] opacity-55" />

      <div
        className="absolute left-1/2 -top-24 h-120 w-170 -translate-x-1/2 rounded-full opacity-35 blur-[90px]"
        style={{
          background: 'conic-gradient(from -45deg at 50% 0%, var(--accent), var(--secondary), var(--warning), var(--accent))',
          animation: 'lb-lamp-spin-a 16s linear infinite',
          willChange: 'transform, opacity',
        }}
      />

      <div
        className="absolute left-1/2 -top-10 h-65 w-110 -translate-x-1/2 rounded-full opacity-30 blur-[60px]"
        style={{
          background: 'conic-gradient(from 90deg at 50% 0%, var(--danger), var(--accent), var(--secondary), var(--danger))',
          animation: 'lb-lamp-spin-b 9s linear infinite',
          willChange: 'transform, opacity',
        }}
      />

      <div
        className="absolute bottom-0 left-1/2 h-55 w-150 -translate-x-1/2 rounded-full opacity-24 blur-[80px]"
        style={{
          background: 'conic-gradient(from 180deg at 50% 100%, var(--secondary), var(--accent), var(--warning), var(--secondary))',
          animation: 'lb-lamp-spin-c 14s linear infinite reverse',
          willChange: 'transform, opacity',
        }}
      />

      <div
        className="absolute left-0 top-1/3 h-45 w-55 rounded-full opacity-22 blur-[70px]"
        style={{
          background: 'radial-gradient(circle, color-mix(in oklch, var(--warning) 70%, transparent), transparent)',
          animation: 'lb-lamp-drift-x 7s ease-in-out infinite alternate',
          willChange: 'transform, opacity',
        }}
      />

      <div
        className="absolute right-0 top-2/3 h-45 w-55 rounded-full opacity-22 blur-[70px]"
        style={{
          background: 'radial-gradient(circle, color-mix(in oklch, var(--danger) 70%, transparent), transparent)',
          animation: 'lb-lamp-drift-y 8s ease-in-out infinite alternate-reverse',
          willChange: 'transform, opacity',
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-px opacity-25"
        style={{
          background: 'linear-gradient(to right, transparent, color-mix(in oklch, var(--accent) 55%, transparent), color-mix(in oklch, var(--secondary) 55%, transparent), transparent)',
        }}
      />

      <style>{`
        @keyframes lb-lamp-spin-a {
          from { transform: translateX(-50%) rotate(0deg) scale(0.98); opacity: 0.32; }
          to   { transform: translateX(-50%) rotate(360deg) scale(1.04); opacity: 0.42; }
        }
        @keyframes lb-lamp-spin-b {
          from { transform: translateX(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes lb-lamp-spin-c {
          from { transform: translateX(-50%) rotate(0deg) scale(0.96); opacity: 0.16; }
          to   { transform: translateX(-50%) rotate(360deg) scale(1.06); opacity: 0.3; }
        }
        @keyframes lb-lamp-drift-x {
          from { transform: translate3d(-38px, -10px, 0) scale(0.95); opacity: 0.16; }
          to   { transform: translate3d(38px, 12px, 0) scale(1.06); opacity: 0.32; }
        }
        @keyframes lb-lamp-drift-y {
          from { transform: translate3d(34px, 16px, 0) scale(0.94); opacity: 0.14; }
          to   { transform: translate3d(-34px, -18px, 0) scale(1.08); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
