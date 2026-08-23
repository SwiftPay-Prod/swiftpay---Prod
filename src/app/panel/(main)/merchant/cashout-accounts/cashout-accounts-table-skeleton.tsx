'use client';

import { Card, Skeleton } from '@heroui/react';

export function CashoutAccountsTableSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-lg" />
					<div className="flex flex-col gap-1">
						<Skeleton className="h-6 w-40 rounded" />
						<Skeleton className="h-4 w-64 rounded" />
					</div>
				</div>
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>

			<Card className="overflow-hidden">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
					<Skeleton className="h-5 w-48 rounded" />
					<Skeleton className="h-10 w-40 rounded-lg" />
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-150">
						<thead>
							<tr className="border-b border-border bg-surface-secondary">
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-20 rounded" />
								</th>
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-16 rounded" />
								</th>
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-16 rounded" />
								</th>
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-16 rounded" />
								</th>
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-20 rounded" />
								</th>
								<th className="px-4 py-3 text-left">
									<Skeleton className="h-4 w-16 rounded" />
								</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 5 }).map((_, index) => (
								<tr key={index} className="border-b border-border last:border-b-0">
									<td className="px-4 py-3">
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<Skeleton className="h-6 w-16 rounded-full" />
												<Skeleton className="h-6 w-16 rounded-full" />
											</div>
											<Skeleton className="h-7 w-48 rounded" />
										</div>
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-5 w-32 rounded" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-5 w-24 rounded" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-6 w-16 rounded-full" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-5 w-24 rounded" />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-1">
											<Skeleton className="h-8 w-8 rounded-lg" />
											<Skeleton className="h-8 w-8 rounded-lg" />
											<Skeleton className="h-8 w-8 rounded-lg" />
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			<div className="flex items-start gap-2 rounded-xl bg-warning/10 p-4">
				<Skeleton className="h-6 w-6 rounded shrink-0" />
				<div className="flex flex-col gap-1 flex-1">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-4 w-full rounded" />
				</div>
			</div>
		</div>
	);
}

