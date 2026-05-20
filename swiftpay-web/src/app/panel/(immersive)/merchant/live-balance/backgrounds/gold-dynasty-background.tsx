'use client';

import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function GoldDynastyBackground({ className }: LiveBalanceBackgroundProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        'bg-[radial-gradient(circle_at_top,#51411f_0%,#17120a_24%,#090705_55%,#010101_100%)]',
        'dark:bg-[radial-gradient(circle_at_top,#4a3912_0%,#120d07_22%,#050403_58%,#000000_100%)]',
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,247,218,0.05),transparent_18%,transparent_82%,rgba(255,214,102,0.05))]" />
      <div className="absolute inset-0 opacity-35 bg-[linear-gradient(90deg,transparent_0%,rgba(255,206,84,0.05)_18%,transparent_34%,rgba(255,206,84,0.07)_52%,transparent_72%,rgba(255,206,84,0.05)_100%)]" />

      <div className="absolute left-[8%] top-[-10%] h-150 w-150 animate-first rounded-full bg-[radial-gradient(circle,rgba(255,223,129,0.26)_0%,rgba(255,177,41,0.14)_18%,transparent_62%)] blur-[120px]" />
      <div className="absolute right-[-6%] top-[4%] h-120 w-120 animate-second rounded-full bg-[radial-gradient(circle,rgba(255,240,194,0.18)_0%,rgba(255,195,62,0.14)_28%,transparent_68%)] blur-[100px]" />
      <div className="absolute bottom-[-18%] left-[24%] h-110 w-140 animate-third rounded-full bg-[radial-gradient(circle,rgba(255,188,52,0.16)_0%,rgba(255,188,52,0.08)_26%,transparent_72%)] blur-[110px]" />

      <div className="absolute inset-y-0 left-[11%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,214,114,0.45),transparent)] opacity-55" />
      <div className="absolute inset-y-0 left-[29%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,214,114,0.32),transparent)] opacity-45" />
      <div className="absolute inset-y-0 right-[24%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,214,114,0.3),transparent)] opacity-40" />
      <div className="absolute inset-y-0 right-[10%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,214,114,0.44),transparent)] opacity-55" />

      <div className="absolute left-1/2 top-[18%] h-82 w-82 -translate-x-1/2 rounded-full border border-yellow-200/18 bg-[radial-gradient(circle,rgba(255,250,236,0.16)_0%,rgba(255,214,102,0.1)_32%,transparent_66%)] shadow-[0_0_80px_rgba(255,196,61,0.18)]" />
      <div className="absolute left-1/2 top-[18%] h-96 w-96 -translate-x-1/2 rounded-full border border-yellow-300/10 opacity-75" style={{ animation: 'gold-dynasty-rotate-a 30s linear infinite' }} />
      <div className="absolute left-1/2 top-[18%] h-120 w-120 -translate-x-1/2 rounded-full border border-white/6 opacity-60" style={{ animation: 'gold-dynasty-rotate-b 22s linear infinite reverse' }} />

      <div className="absolute inset-0">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={`dynasty-spark-${index}`}
            className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,250,222,0.98)_0%,rgba(255,217,94,0.92)_45%,rgba(255,217,94,0)_75%)] shadow-[0_0_20px_rgba(255,208,80,0.3)]"
            style={{
              width: `${10 + (index % 4) * 4}px`,
              height: `${10 + (index % 4) * 4}px`,
              left: `${8 + (index * 7) % 84}%`,
              top: `${10 + (index * 6) % 76}%`,
              animation: `gold-dynasty-spark ${7.4 + (index % 5) * 1.1}s ease-in-out ${index * 0.28}s infinite`,
              opacity: 0.18 + (index % 3) * 0.08,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-x-[6%] bottom-[8%] h-36 rounded-[2.5rem] border border-yellow-300/10 bg-[linear-gradient(180deg,rgba(255,225,143,0.08),rgba(255,255,255,0.02)_40%,rgba(0,0,0,0.18)_100%)] shadow-[0_-30px_100px_rgba(255,187,54,0.08)] backdrop-blur-[2px]" />

      <style jsx>{`
        @keyframes gold-dynasty-rotate-a {
          from {
            transform: translateX(-50%) rotate(0deg) scale(0.98);
          }
          to {
            transform: translateX(-50%) rotate(360deg) scale(1.02);
          }
        }

        @keyframes gold-dynasty-rotate-b {
          from {
            transform: translateX(-50%) rotate(0deg) scale(1.02);
          }
          to {
            transform: translateX(-50%) rotate(360deg) scale(0.98);
          }
        }

        @keyframes gold-dynasty-spark {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0.1;
          }
          50% {
            transform: translate3d(0, -22px, 0) scale(1.2);
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
