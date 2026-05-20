'use client';

import { Skeleton, Avatar } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ServerStack01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface AcquirersTableSkeletonProps {
	pageSize?: number;
}

interface SkeletonRow {
	id: number;
}

function getSkeletonColumns(): DataTableColumn<SkeletonRow>[] {
	return [
		{
			key: 'acquirer',
			header: 'Processadora',
			render: () => (
				<div className="flex items-center gap-3">
					<Avatar size="sm">
						<Skeleton className="size-10 rounded-full" />
					</Avatar>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-4 w-28 rounded-lg" />
						<Skeleton className="h-3 w-20 rounded-lg" />
					</div>
				</div>
			),
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
			key: 'features',
			header: 'Funcionalidades',
			render: () => (
				<div className="flex flex-wrap gap-1">
					<Skeleton className="h-6 w-12 rounded-full" />
					<Skeleton className="h-6 w-14 rounded-full" />
					<Skeleton className="h-6 w-12 rounded-full" />
				</div>
			),
		},
		{
			key: 'pixFees',
			header: 'Taxa PIX',
			render: () => <Skeleton className="h-4 w-16 rounded-lg" />,
		},
		{
			key: 'payoutFees',
			header: 'Taxa Saque',
			render: () => <Skeleton className="h-4 w-16 rounded-lg" />,
		},
		{
			key: 'webhookAuth',
			header: 'Autenticação Webhook',
			render: () => <Skeleton className="h-6 w-20 rounded-full" />,
		},
		{
			key: 'totalMerchants',
			header: 'Organizações',
			render: () => <Skeleton className="h-4 w-8 rounded-lg" />,
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
				</div>
			),
		},
	];
}

export function AcquirersTableSkeleton({ pageSize = 10 }: AcquirersTableSkeletonProps) {
	const skeletonData: SkeletonRow[] = Array.from({ length: pageSize }, (_, i) => ({ id: i }));
	const columns = getSkeletonColumns();

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={ServerStack01Icon} size={24} />}
				title="Processadoras"
				description="Gerencie as processadoras de pagamento."
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

