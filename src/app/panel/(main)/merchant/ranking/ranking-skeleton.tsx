'use client';

import { Skeleton, Card } from '@heroui/react';

export function RankingContentSkeleton() {
	return (
		<>
			<div className="flex items-end justify-center gap-3 rounded-xl border border-divider bg-surface/40 px-3 py-4 mb-1">
				{[56, 72, 56].map((h, i) => (
					<div key={i} className="flex flex-col items-center gap-1.5 w-24">
						<Skeleton className="w-16 h-16 rounded-full" />
						<Skeleton className="h-4 w-14 rounded-lg" />
						<Skeleton className="h-3 w-10 rounded-lg" />
						<div className="w-full rounded-t-lg" style={{ height: h, background: 'var(--surface)' }} />
					</div>
				))}
			</div>

			<div className="flex flex-col gap-0.5">
				{Array.from({ length: 7 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl">
						<Skeleton className="w-4 h-4 rounded-md shrink-0" />
						<Skeleton className="w-10 h-10 rounded-full shrink-0" />
						<div className="flex flex-col gap-1 flex-1">
							<Skeleton className="h-3.5 w-28 rounded-lg" />
						</div>
						<Skeleton className="h-4 w-20 rounded-lg" />
					</div>
				))}
			</div>
		</>
	);
}

export function RankingSkeleton() {
	return (
		<Card>
			<Card.Header>
				<div className="flex items-center justify-between w-full gap-2">
					<div className="flex items-center gap-2">
						<Skeleton className="w-4 h-4 rounded-md shrink-0" />
						<Skeleton className="h-5 w-16 rounded-lg" />
					</div>
					<div className="flex items-center gap-1.5">
						<Skeleton className="h-4 w-20 rounded-lg" />
						<Skeleton className="h-7 w-7 rounded-lg" />
					</div>
				</div>
				<div className="flex items-center gap-2 pt-1">
					<Skeleton className="h-7 w-20 rounded-full" />
					<Skeleton className="h-7 w-20 rounded-full" />
					<Skeleton className="h-7 w-20 rounded-full" />
					<Skeleton className="h-7 w-7 rounded-lg" />
				</div>
			</Card.Header>

				<Card.Content className="px-3 pb-3">
					<RankingContentSkeleton />
				</Card.Content>
		</Card>
	);
}
