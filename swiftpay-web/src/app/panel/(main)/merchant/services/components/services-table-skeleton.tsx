import { Card, Skeleton } from '@heroui/react';
import { PageHeaderSkeleton } from '@/components/ui/page-header';

interface ServicesTableSkeletonProps {
	pageSize?: number;
}

export function ServicesTableSkeleton({ pageSize = 10 }: ServicesTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-4">
			<PageHeaderSkeleton hasAction hasPrimaryAction hasSecondaryAction />

			<Card className="w-full">
				<Card.Content className="pt-6">
					<div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-muted-foreground/10">
						<Skeleton className="h-10 w-60 rounded-lg" />
						<Skeleton className="h-10 w-36 rounded-lg" />
						<Skeleton className="h-10 w-36 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-200">
							<thead>
								<tr className="border-b border-muted-foreground/10">
									<th className="p-3 w-16"></th>
									<th className="p-3 text-left text-sm font-medium text-muted">Serviço</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Preço</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Status</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Categorias</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Variantes</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Cupons</th>
									<th className="p-3 text-left text-sm font-medium text-muted">Criado em</th>
									<th className="p-3 text-center text-sm font-medium text-muted">Ações</th>
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: pageSize }).map((_, index) => (
									<tr key={index} className="border-b border-muted-foreground/5 last:border-b-0">
										<td className="p-3">
											<Skeleton className="h-10 w-10 rounded-full" />
										</td>
										<td className="p-3">
											<div className="flex flex-col gap-1">
												<Skeleton className="h-5 w-40 rounded-md" />
												<Skeleton className="h-3 w-24 rounded-md" />
											</div>
										</td>
										<td className="p-3">
											<Skeleton className="h-5 w-16 rounded-md" />
										</td>
										<td className="p-3">
											<Skeleton className="h-6 w-16 rounded-full" />
										</td>
										<td className="p-3">
											<Skeleton className="h-4 w-8 rounded-md" />
										</td>
										<td className="p-3">
											<Skeleton className="h-4 w-8 rounded-md" />
										</td>
										<td className="p-3">
											<Skeleton className="h-4 w-8 rounded-md" />
										</td>
										<td className="p-3">
											<Skeleton className="h-4 w-20 rounded-md" />
										</td>
										<td className="p-3">
											<div className="flex items-center justify-center gap-1">
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

					<div className="flex justify-center mt-4 pt-4 border-t border-muted-foreground/10">
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 w-10 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
						</div>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}

