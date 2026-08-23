'use client';

import { Skeleton } from '@heroui/react';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface TemplatesTableSkeletonProps {
	pageSize?: number;
}

interface SkeletonRow {
	id: number;
}
function getSkeletonColumns(): DataTableColumn<SkeletonRow>[] {
	return [
		{
			key: 'template',
			header: 'Template',
			render: () => (
				<div className="flex items-center gap-3">
					<Skeleton className="size-12 rounded-lg shrink-0" />
					<div className="flex flex-col gap-1">
						<Skeleton className="h-4 w-28 rounded-lg" />
						<Skeleton className="h-3 w-20 rounded-lg" />
					</div>
				</div>
			),
		},
		{
			key: 'type',
			header: 'Tipo',
			render: () => <Skeleton className="h-6 w-24 rounded-full" />,
		},
		{
			key: 'status',
			header: 'Status',
			render: () => (
				<div className="flex items-center gap-2">
					<Skeleton className="size-4 rounded-full" />
					<Skeleton className="h-4 w-12 rounded-lg" />
				</div>
			),
		},
		{
			key: 'pricing',
			header: 'Preço',
			render: () => (
				<div className="flex flex-col gap-1">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-3 w-16 rounded-lg" />
				</div>
			),
		},
		{
			key: 'features',
			header: 'Recursos',
			render: () => (
				<div className="flex flex-wrap gap-1">
					<Skeleton className="h-6 w-24 rounded-full" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>
			),
		},
		{
			key: 'usageCount',
			header: 'Uso',
			render: () => (
				<div className="flex flex-col gap-1">
					<Skeleton className="h-4 w-8 rounded-lg" />
					<Skeleton className="h-3 w-16 rounded-lg" />
				</div>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: () => <Skeleton className="h-4 w-24 rounded-lg" />,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: () => (
				<div className="flex flex-row gap-x-1 justify-center">
					<Skeleton className="size-9 rounded-lg" />
					<Skeleton className="size-9 rounded-lg" />
				</div>
			),
		},
	];
}

export function TemplatesTableSkeleton({ pageSize = 10 }: TemplatesTableSkeletonProps) {
	const skeletonData: SkeletonRow[] = Array.from({ length: pageSize }, (_, i) => ({ id: i }));
	const columns = getSkeletonColumns();

	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
						<Icon icon={PaintBoardIcon} className="icon-sm text-link" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Templates de Checkout</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
						<Skeleton className="h-4 w-28 rounded bg-white/10" />
						<Skeleton className="h-8 w-36 rounded bg-white/10" />
						<Skeleton className="h-3 w-20 rounded bg-white/5" />
					</div>
				))}
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={skeletonData}
					keyExtractor={(row) => String(row.id)}
					isLoading={false}
					minWidth="min-w-250"
					filters={{
						children: (
							<>
								<Skeleton className="h-10 w-full rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</>
						),
						hasFilters: false,
						onClear: () => {},
					}}
					pagination={{
						page: 1,
						pageSize,
						totalItems: pageSize,
						totalPages: 1,
						onPageChange: () => {},
						isNavigating: false,
					}}
				/>
			</div>
		</div>
	);
}

