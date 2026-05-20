import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function ScanlineBackground({ className }: LiveBalanceBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_76%,white)_0%,color-mix(in_oklch,var(--warning)_6%,var(--background))_44%,color-mix(in_oklch,var(--accent)_10%,var(--background))_100%)] dark:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_88%,black)_0%,color-mix(in_oklch,var(--warning)_10%,black)_44%,color-mix(in_oklch,var(--accent)_16%,black)_100%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] bg-size-[100%_8px] opacity-70 dark:opacity-85" />

      <div className="absolute inset-y-0 left-[-25%] w-[45%] animate-[pulse_8s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--accent)_14%,transparent)_45%,transparent_100%)] blur-xl dark:bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--accent)_22%,transparent)_45%,transparent_100%)]" />
      <div className="absolute inset-y-0 right-[-20%] w-[40%] animate-[pulse_10s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--success)_14%,transparent)_45%,transparent_100%)] blur-[28px] dark:bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--success)_18%,transparent)_45%,transparent_100%)]" />

      <div className="absolute left-0 top-[22%] h-px w-full bg-accent/18 shadow-[0_0_24px_color-mix(in_oklch,var(--accent)_28%,transparent)] dark:bg-accent/30" />
      <div className="absolute left-0 top-[58%] h-px w-full bg-success/14 shadow-[0_0_20px_color-mix(in_oklch,var(--success)_28%,transparent)] dark:bg-success/26" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_24%,rgba(255,255,255,0.18)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_24%,rgba(0,0,0,0.18)_100%)]" />
    </div>
  );
}
