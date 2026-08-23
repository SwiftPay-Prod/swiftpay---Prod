'use client';

import { Skeleton } from '@heroui/react';
import { File01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export function LogsTableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
						<Icon icon={File01Icon} className="icon-sm text-link" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Logs do Sistema</h1>
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<div className="flex flex-row flex-wrap items-center gap-3 pb-4 border-b border-white/8">
					<Skeleton className="h-10 w-48 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-40 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-40 rounded-lg bg-white/5" />
				</div>
				<div className="p-0 overflow-x-auto">
					<table className="w-full min-w-250">
						<thead>
							<tr className="border-b border-white/8">
								{Array.from({ length: 9 }).map((_, index) => (
									<th key={index} className="px-4 py-3 text-left">
										<Skeleton className="h-4 w-24 rounded bg-white/10" />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: pageSize }).map((_, index) => (
								<tr key={index} className="border-b border-white/8 last:border-0">
									{Array.from({ length: 9 }).map((_, cellIndex) => (
										<td key={cellIndex} className="px-4 py-3">
											<Skeleton className="h-4 w-32 rounded bg-white/5" />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
