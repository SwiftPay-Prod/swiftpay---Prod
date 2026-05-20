'use client';

import { Skeleton } from '@heroui/react';

export function FormPageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex items-start gap-4">
					<Skeleton className="size-10 rounded-lg" />
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-3">
							<Skeleton className="size-12 rounded-xl" />
							<div className="flex flex-col gap-1">
								<Skeleton className="h-8 w-48 rounded-lg" />
								<Skeleton className="h-4 w-64 rounded-lg" />
							</div>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-10 w-24 rounded-lg" />
					<Skeleton className="h-10 w-24 rounded-lg" />
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-full rounded-xl" />
				<div className="grid gap-4 lg:grid-cols-2">
					<Skeleton className="h-40 rounded-xl" />
					<Skeleton className="h-40 rounded-xl" />
				</div>
				<Skeleton className="h-40 rounded-xl" />
			</div>
		</div>
	);
}

