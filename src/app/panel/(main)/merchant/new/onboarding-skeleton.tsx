'use client';

import { Card, Skeleton, Separator } from '@heroui/react';

export function OnboardingSkeleton() {
	return (
		<div className="mx-auto">
			<Card className="bg-surface mb-4">
				<Card.Content className="py-4 w-full md:w-3/5 mx-auto">
					<div className="flex items-center justify-between gap-2">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex flex-col items-center gap-2 flex-1">
								<Skeleton className="size-10 rounded-full" />
								<Skeleton className="h-3 w-20 rounded" />
							</div>
						))}
					</div>
				</Card.Content>
			</Card>

			<Card>
				<Card.Content className="p-4 sm:p-4">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-7 w-48 rounded" />
							<Skeleton className="h-4 w-72 rounded" />
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="flex flex-col gap-2">
									<Skeleton className="h-4 w-32 rounded" />
									<Skeleton className="h-10 w-full rounded" />
								</div>
							))}
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{[...Array(2)].map((_, i) => (
								<div key={i} className="flex flex-col gap-2">
									<Skeleton className="h-4 w-32 rounded" />
									<Skeleton className="h-10 w-full rounded" />
								</div>
							))}
						</div>

						<Separator />

						<div className="flex justify-end gap-3">
							<Skeleton className="h-10 w-24 rounded" />
							<Skeleton className="h-10 w-28 rounded" />
						</div>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}