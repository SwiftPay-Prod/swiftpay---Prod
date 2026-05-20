import { Skeleton, Card } from '@heroui/react';

interface ReferralsTableSkeletonProps {
	pageSize?: number;
}

export function ReferralsTableSkeleton({ pageSize = 10 }: ReferralsTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-16 rounded-xl" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				{Array.from({ length: 5 }).map((_, index) => (
					<Card key={index} className="p-4">
						<Skeleton className="h-5 w-32 rounded-lg" />
						<Skeleton className="mt-2 h-7 w-24 rounded-lg" />
					</Card>
				))}
			</div>
			<Skeleton className="h-20 rounded-xl" />
			<div className="flex flex-col gap-3">
				{Array.from({ length: Math.min(pageSize, 8) }).map((_, index) => (
					<Skeleton key={index} className="h-16 rounded-xl" />
				))}
			</div>
		</div>
	);
}
