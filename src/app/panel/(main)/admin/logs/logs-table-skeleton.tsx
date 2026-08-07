'use client';

import { Card, Skeleton } from '@heroui/react';
import { File01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';

export function LogsTableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={File01Icon} size={24} />}
				title="Logs"
				description="Auditoria de erros e eventos da plataforma."
			/>

			<Card>
				<Card.Header className="flex flex-row flex-wrap items-center gap-3">
					<Skeleton className="h-10 w-48 rounded-lg" />
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-32 rounded-lg" />
				</Card.Header>
				<Card.Content className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full min-w-250">
							<thead>
								<tr className="border-b border-border">
									{Array.from({ length: 9 }).map((_, index) => (
										<th key={index} className="px-4 py-3 text-left">
											<Skeleton className="h-4 w-24 rounded" />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, index) => (
									<tr key={index} className="border-b border-border last:border-0">
										{Array.from({ length: 9 }).map((_, cellIndex) => (
											<td key={cellIndex} className="px-4 py-3">
												<Skeleton className="h-4 w-32 rounded" />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
