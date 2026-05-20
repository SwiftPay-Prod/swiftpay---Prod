import { Skeleton } from '@heroui/react';

interface Props {
	pageSize?: number;
}

export function MerchantAutomaticCashoutLogsSkeleton({ pageSize = 10 }: Props) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Skeleton className="h-10 w-40 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
			<div className="flex flex-col gap-2">
				{Array.from({ length: pageSize }).map((_, i) => (
					<Skeleton key={i} className="h-12 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}
