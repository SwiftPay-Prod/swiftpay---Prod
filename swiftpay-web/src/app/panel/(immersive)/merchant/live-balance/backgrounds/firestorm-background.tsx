'use client';

import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function FirestormBackground({ className }: LiveBalanceBackgroundProps) {
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const left = 6 + i * 6.6;
    const duration = 1.8 + (i % 5) * 0.35;
    const delay = (i % 7) * 0.22;
    const size = 4 + (i % 3) * 2;
    return { left, duration, delay, size };
  });

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-background', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklch,var(--warning)_52%,transparent)_0%,transparent_56%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklch,var(--danger)_50%,transparent)_0%,transparent_62%)]" />

      <div
        className="absolute bottom-[-12%] left-[8%] h-[46vh] w-[36vh] rounded-full opacity-90 blur-[52px]"
        style={{
          background:
            'radial-gradient(circle at 50% 75%, color-mix(in oklch, var(--warning) 86%, transparent) 0%, color-mix(in oklch, var(--danger) 62%, transparent) 52%, transparent 78%)',
          animation: 'firestorm-rise-a 2.8s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[36%] h-[56vh] w-[40vh] rounded-full opacity-95 blur-[56px]"
        style={{
          background:
            'radial-gradient(circle at 50% 72%, color-mix(in oklch, var(--danger) 82%, transparent) 0%, color-mix(in oklch, var(--warning) 68%, transparent) 48%, transparent 78%)',
          animation: 'firestorm-rise-b 2.1s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-[-12%] right-[10%] h-[48vh] w-[36vh] rounded-full opacity-90 blur-[52px]"
        style={{
          background:
            'radial-gradient(circle at 50% 74%, color-mix(in oklch, var(--warning) 90%, transparent) 0%, color-mix(in oklch, var(--danger) 58%, transparent) 50%, transparent 80%)',
          animation: 'firestorm-rise-c 3.1s ease-in-out infinite alternate',
        }}
      />

      <div
        className="absolute bottom-[6%] left-1/2 h-[24vh] w-[84vh] -translate-x-1/2 rounded-full opacity-60 blur-[42px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--danger) 62%, transparent) 20%, color-mix(in oklch, var(--warning) 70%, transparent) 50%, color-mix(in oklch, var(--danger) 62%, transparent) 80%, transparent 100%)',
          animation: 'firestorm-flicker 0.8s linear infinite',
        }}
      />

      {sparks.map((spark, idx) => (
        <div
          key={idx}
          className="absolute bottom-[8%] rounded-full"
          style={{
            left: `${spark.left}%`,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            background:
              'radial-gradient(circle, color-mix(in oklch, var(--warning) 88%, white) 0%, color-mix(in oklch, var(--danger) 74%, transparent) 68%, transparent 100%)',
            animation: `firestorm-spark ${spark.duration}s linear ${spark.delay}s infinite`,
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      <div
        className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          background:
            'linear-gradient(to top, color-mix(in oklch, var(--background) 12%, black) 0%, color-mix(in oklch, var(--background) 60%, transparent) 46%, transparent 100%)',
        }}
      />

      <style>{`
        @keyframes firestorm-rise-a {
          from { transform: translateY(10px) scale(0.98); opacity: 0.62; }
          to { transform: translateY(-28px) scale(1.08); opacity: 0.84; }
        }
        @keyframes firestorm-rise-b {
          from { transform: translateY(12px) scale(0.96); opacity: 0.58; }
          to { transform: translateY(-34px) scale(1.12); opacity: 0.88; }
        }
        @keyframes firestorm-rise-c {
          from { transform: translateY(8px) scale(0.98); opacity: 0.6; }
          to { transform: translateY(-24px) scale(1.06); opacity: 0.82; }
        }
        @keyframes firestorm-flicker {
          0% { opacity: 0.34; }
          25% { opacity: 0.56; }
          50% { opacity: 0.42; }
          75% { opacity: 0.68; }
          100% { opacity: 0.36; }
        }
        @keyframes firestorm-spark {
          0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
          10% { opacity: 0.95; }
          60% { opacity: 0.55; }
          100% { transform: translate3d(0, -180px, 0) scale(0.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
