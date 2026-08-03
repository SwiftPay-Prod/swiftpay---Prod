'use client';

import { Card, Skeleton } from '@heroui/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';

export function UsersTableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={UserGroupIcon} size={24} />}
				title="Usuários"
				description="Gerencie os usuários da plataforma."
			/>

			<Card>
				<Card.Header className="flex flex-row flex-wrap items-center gap-3">
					<Skeleton className="h-10 w-48 rounded-lg" />
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</Card.Header>
				<Card.Content className="p-0">
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
				</Card.Content>
				<Card.Footer className="flex items-center justify-between">
					<Skeleton className="h-4 w-32 rounded" />
					<div className="flex gap-2">
						<Skeleton className="size-8 rounded-lg" />
						<Skeleton className="size-8 rounded-lg" />
						<Skeleton className="size-8 rounded-lg" />
					</div>
				</Card.Footer>
			</Card>
		</div>
	);
}

