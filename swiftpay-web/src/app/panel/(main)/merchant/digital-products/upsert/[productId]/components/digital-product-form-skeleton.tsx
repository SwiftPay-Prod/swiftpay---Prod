import { Card, Skeleton } from '@heroui/react';

export function DigitalProductFormSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10 rounded-xl" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-56 rounded" />
					<Skeleton className="h-4 w-80 rounded" />
				</div>
			</div>

			<Skeleton className="h-14 rounded-xl" />

			<Skeleton className="h-16 rounded-xl" />

			<Card>
				<div className="flex flex-col gap-4 p-4">
					<Skeleton className="h-12 w-full rounded-lg" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Skeleton className="h-16 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
					<Skeleton className="h-16 rounded-lg" />
				</div>
			</Card>
		</div>
	);
}
