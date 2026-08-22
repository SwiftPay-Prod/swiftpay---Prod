'use client';

import { Skeleton, Avatar } from '@heroui/react';
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
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={ServerStack01Icon} className="icon-sm text-[#4f55f1]" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Processadoras PIX</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
						<Skeleton className="h-4 w-28 rounded bg-white/10" />
						<Skeleton className="h-8 w-36 rounded bg-white/10" />
						<Skeleton className="h-3 w-20 rounded bg-white/5" />
					</div>
				))}
			</div>

			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
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
		</div>
	);
}

