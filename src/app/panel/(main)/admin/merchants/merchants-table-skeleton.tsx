'use client';

import { Skeleton, Avatar } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Building02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface MerchantsTableSkeletonProps {
	pageSize?: number;
}

interface SkeletonRow {
	id: number;
}

function getSkeletonColumns(): DataTableColumn<SkeletonRow>[] {
	return [
		{
			key: 'organization',
			header: 'Organização',
			render: () => (
				<div className="flex items-center gap-3">
					<Avatar size="sm">
						<Skeleton className="size-8 rounded-full" />
					</Avatar>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-4 w-32 rounded-lg" />
						<Skeleton className="h-3 w-24 rounded-lg" />
					</div>
				</div>
			),
		},
		{
			key: 'owner',
			header: 'Proprietário',
			render: () => (
				<div className="flex flex-col gap-1">
					<Skeleton className="h-4 w-28 rounded-lg" />
					<Skeleton className="h-3 w-36 rounded-lg" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: () => <Skeleton className="h-6 w-20 rounded-full" />,
		},
		{
			key: 'kyc',
			header: 'KYC',
			render: () => <Skeleton className="h-6 w-20 rounded-full" />,
		},
		{
			key: 'acquirer',
			header: 'Processadora',
			render: () => (
				<div className="flex items-center gap-2">
					<Skeleton className="size-5 rounded" />
					<Skeleton className="h-4 w-16 rounded-lg" />
				</div>
			),
		},
		{
			key: 'volume',
			header: 'Faturamento / Taxas',
			render: () => (
				<div className="flex flex-col gap-1">
					<Skeleton className="h-4 w-24 rounded-lg" />
					<Skeleton className="h-3 w-20 rounded-lg" />
				</div>
			),
		},
		{
			key: 'feeRate',
			header: 'Taxa PIX',
			render: () => <Skeleton className="h-4 w-16 rounded-lg" />,
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
				<div className="flex flex-row gap-x-2 justify-center">
					<Skeleton className="size-9 rounded-lg" />
					<Skeleton className="size-9 rounded-lg" />
				</div>
			),
		},
	];
}

export function MerchantsTableSkeleton({ pageSize = 10 }: MerchantsTableSkeletonProps) {
	const skeletonData: SkeletonRow[] = Array.from({ length: pageSize }, (_, i) => ({ id: i }));
	const columns = getSkeletonColumns();

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Building02Icon} size={24} />}
				title="Organizações"
				description="Gerencie as organizações da plataforma."
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

