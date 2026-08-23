'use client';

import { Skeleton } from '@heroui/react';
import { WalletRemove01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface CashoutsTableSkeletonProps {
	pageSize?: number;
}

export function CashoutsTableSkeleton({ pageSize = 10 }: CashoutsTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
						<Icon icon={WalletRemove01Icon} className="icon-sm text-link" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Saques</h1>
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
					<div className="flex flex-wrap items-center gap-3">
						<Skeleton className="h-10 w-48 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
						<div className="grow" />
						<Skeleton className="h-10 w-10 rounded-lg" />
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border">
									{Array.from({ length: 7 }).map((_, i) => (
										<th key={i} className="px-4 py-3 text-left">
											<Skeleton className="h-4 w-20 rounded" />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, rowIndex) => (
									<tr key={rowIndex} className="border-b border-border last:border-b-0">
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
		</div>
	);
}

