'use client';

import { Skeleton } from '@heroui/react';
import { Coupon01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface CouponsTableSkeletonProps {
	pageSize?: number;
}

export function CouponsTableSkeleton({ pageSize = 10 }: CouponsTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={Coupon01Icon} className="icon-sm text-[#4f55f1]" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Cupons</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
						<Skeleton className="h-4 w-28 rounded bg-white/10" />
						<Skeleton className="h-8 w-36 rounded bg-white/10" />
						<Skeleton className="h-3 w-20 rounded bg-white/5" />
					</div>
				))}
			</div>

			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
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
									{Array.from({ length: 8 }).map((_, i) => (
										<th key={i} className="px-4 py-3 text-left">
											<Skeleton className="h-4 w-20 rounded" />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, rowIndex) => (
									<tr key={rowIndex} className="border-b border-divider last:border-b-0">
										{Array.from({ length: 8 }).map((_, colIndex) => (
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

