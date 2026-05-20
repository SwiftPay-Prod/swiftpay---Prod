'use client';

import { Skeleton } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
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
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={PaintBoardIcon} size={24} />}
				title="Templates de Checkout"
				description="Gerencie os templates disponíveis para checkouts."
				actions={<Skeleton className="h-10 w-36 rounded-lg" />}
			/>

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
	);
}

