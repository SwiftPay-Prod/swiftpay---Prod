'use client';

import { Skeleton } from '@heroui/react';

export function SetAcquirerModalSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-4 w-full rounded" />

			<div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
					>
						<Skeleton className="size-10 rounded-full" />
						<div className="flex flex-1 flex-col gap-1">
							<Skeleton className="h-5 w-32 rounded" />
							<Skeleton className="h-4 w-48 rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

