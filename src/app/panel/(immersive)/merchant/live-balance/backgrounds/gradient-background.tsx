'use client';

import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

export function GradientBackground({ className }: LiveBalanceBackgroundProps) {
	return (
		<div
			className={cn(
				'absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklch,var(--background)_82%,white)_0%,color-mix(in_oklch,var(--accent)_10%,white)_52%,color-mix(in_oklch,var(--success)_12%,var(--background))_100%)] dark:bg-[linear-gradient(135deg,color-mix(in_oklch,var(--background)_90%,black)_0%,color-mix(in_oklch,var(--accent)_18%,var(--background))_55%,color-mix(in_oklch,var(--success)_12%,black)_100%)]',
				className
			)}
		>
			<div className="absolute -left-[10%] top-[5%] h-[55vh] w-[55vh] animate-first rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent)_42%,transparent)_0%,transparent_68%)] opacity-80 blur-[80px] dark:bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent)_80%,transparent)_0%,transparent_65%)] dark:opacity-100" />
			<div className="absolute right-[-5%] top-[8%] h-[48vh] w-[48vh] animate-second rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--success)_38%,transparent)_0%,transparent_68%)] opacity-75 blur-[72px] dark:bg-[radial-gradient(circle,color-mix(in_oklch,var(--success)_72%,transparent)_0%,transparent_65%)] dark:opacity-100" />
			<div className="absolute bottom-[-5%] left-[28%] h-[58vh] w-[58vh] animate-fourth rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--warning)_32%,transparent)_0%,transparent_70%)] opacity-70 blur-[88px] dark:bg-[radial-gradient(circle,color-mix(in_oklch,var(--warning)_68%,transparent)_0%,transparent_65%)] dark:opacity-100" />
			<div className="absolute right-[20%] bottom-[15%] h-[35vh] w-[35vh] animate-third rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--danger)_22%,transparent)_0%,transparent_72%)] opacity-65 blur-3xl dark:bg-[radial-gradient(circle,color-mix(in_oklch,var(--danger)_55%,transparent)_0%,transparent_65%)] dark:opacity-90" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
		</div>
	);
}
