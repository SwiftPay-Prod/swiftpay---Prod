import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function LatticeBackground({ className }: LiveBalanceBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--background)_82%,white)_0%,color-mix(in_oklch,var(--secondary)_10%,var(--background))_45%,color-mix(in_oklch,var(--accent)_12%,var(--background))_100%)] dark:bg-[linear-gradient(135deg,color-mix(in_oklch,var(--background)_88%,black)_0%,color-mix(in_oklch,var(--secondary)_18%,black)_48%,color-mix(in_oklch,var(--accent)_18%,black)_100%)]" />

      <div className="absolute inset-0 opacity-60 dark:opacity-80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_8%,transparent)_1px,transparent_1px)] bg-size-[52px_52px] dark:bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_12%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_12%,transparent)_1px,transparent_1px)]" />
      </div>

      <div className="absolute -left-[10%] top-[12%] h-128 w-lg rotate-12 animate-[spin_26s_linear_infinite] rounded-[28%] border border-accent-soft-hover bg-accent/8 blur-[2px] dark:border-accent/24 dark:bg-accent/10" />
      <div className="absolute right-[-8%] top-[18%] h-112 w-md -rotate-6 animate-[spin_20s_linear_reverse_infinite] rounded-[32%] border border-secondary/24 bg-secondary/8 blur-[2px] dark:border-secondary/28 dark:bg-secondary/12" />
      <div className="absolute bottom-[-12%] left-[24%] h-104 w-104 animate-[spin_18s_linear_infinite] rounded-[24%] border border-success/22 bg-success/8 blur-[2px] dark:border-success/28 dark:bg-success/12" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.22)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_22%,rgba(0,0,0,0.16)_100%)]" />
    </div>
  );
}
