'use client';

export function MobileDashboardSkeleton() {
	return (
		<div className="flex flex-col gap-3 pb-24">
			<div className="h-28 animate-pulse rounded-xl bg-surface" />
			<div className="h-52 animate-pulse rounded-2xl bg-amber-500/10" />
			<div className="flex gap-2">
				<div className="h-9 flex-1 animate-pulse rounded-xl bg-surface" />
				<div className="h-9 w-24 animate-pulse rounded-xl bg-surface" />
			</div>
			<div className="grid grid-cols-2 gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="h-20 animate-pulse rounded-xl bg-surface"
						style={{ animationDelay: `${i * 40}ms` }}
					/>
				))}
			</div>
			<div className="h-48 animate-pulse rounded-xl bg-surface" />
			<div className="h-48 animate-pulse rounded-xl bg-surface" />
			<div className="h-44 animate-pulse rounded-xl bg-surface" />
		</div>
	);
}
