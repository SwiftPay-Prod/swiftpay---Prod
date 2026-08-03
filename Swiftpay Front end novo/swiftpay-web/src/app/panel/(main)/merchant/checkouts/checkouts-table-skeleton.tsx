'use client';

import { Card, Skeleton } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';

interface CheckoutsTableSkeletonProps {
	pageSize?: number;
}

export function CheckoutsTableSkeleton({ pageSize = 10 }: CheckoutsTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Skeleton className="w-6 h-6 rounded" />}
				title="Checkouts"
				description="Crie e gerencie seus links de pagamento"
			/>

			<Card className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Skeleton className="h-10 w-60 rounded-lg" />
						<Skeleton className="h-10 w-40 rounded-lg" />
						<Skeleton className="h-10 w-40 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
						<div className="grow" />
						<Skeleton className="h-10 w-10 rounded-lg" />
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-divider">
									{Array.from({ length: 7 }).map((_, i) => (
										<th key={i} className="px-4 py-3 text-left">
											<Skeleton className="h-4 w-20 rounded" />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, rowIndex) => (
									<tr key={rowIndex} className="border-b border-divider last:border-b-0">
										{Array.from({ length: 7 }).map((_, colIndex) => (
											<td key={colIndex} className="px-4 py-3">
												<Skeleton className="h-4 w-full max-w-24 rounded" />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between pt-2">
						<Skeleton className="h-4 w-32 rounded" />
						<div className="flex gap-2">
							<Skeleton className="h-8 w-8 rounded" />
							<Skeleton className="h-8 w-8 rounded" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}

