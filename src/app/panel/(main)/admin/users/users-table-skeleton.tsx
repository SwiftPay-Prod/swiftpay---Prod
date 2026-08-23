'use client';

import { Skeleton } from '@heroui/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export function UsersTableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
						<Icon icon={UserGroupIcon} className="icon-sm text-link" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Usuários</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
						<Skeleton className="h-4 w-28 rounded bg-white/10" />
						<Skeleton className="h-8 w-36 rounded bg-white/10" />
						<Skeleton className="h-3 w-20 rounded bg-white/5" />
					</div>
				))}
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<div className="flex flex-row flex-wrap items-center gap-3 pb-4 border-b border-white/8">
					<Skeleton className="h-10 w-48 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-40 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-40 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-28 rounded-lg bg-white/5" />
				</div>
				<div className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full min-w-250">
							<thead>
								<tr className="border-b border-border">
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-24 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-16 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-16 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-28 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-24 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-24 rounded" />
									</th>
									<th className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-24 rounded" />
									</th>
									<th className="px-4 py-3 text-center">
										<Skeleton className="h-4 w-16 rounded mx-auto" />
									</th>
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, index) => (
									<tr key={index} className="border-b border-border last:border-0">
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												<Skeleton className="size-8 rounded-full" />
												<div className="flex flex-col gap-1">
													<Skeleton className="h-4 w-32 rounded" />
													<Skeleton className="h-3 w-40 rounded" />
												</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-6 w-20 rounded-full" />
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-6 w-16 rounded-full" />
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-6 w-24 rounded-full" />
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-4 w-8 rounded" />
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-4 w-24 rounded" />
										</td>
										<td className="px-4 py-3">
											<Skeleton className="h-4 w-24 rounded" />
										</td>
										<td className="px-4 py-3">
											<div className="flex justify-center gap-2">
												<Skeleton className="size-8 rounded-lg" />
												<Skeleton className="size-8 rounded-lg" />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<div className="flex items-center justify-between pt-4 border-t border-white/8">
					<Skeleton className="h-4 w-32 rounded bg-white/5" />
					<div className="flex gap-2">
						<Skeleton className="size-8 rounded-lg bg-white/5" />
						<Skeleton className="size-8 rounded-lg bg-white/5" />
						<Skeleton className="size-8 rounded-lg bg-white/5" />
					</div>
				</div>
			</div>
		</div>
	);
}

