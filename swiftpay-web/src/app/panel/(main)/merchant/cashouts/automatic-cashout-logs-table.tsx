'use client';

import { use, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Chip } from '@heroui/react';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import {
	automaticCashoutStatusParse,
	paymentEnvironmentParse,
	parseToFilterOptions,
	mapParseColorToChipColor,
	pageSizeFilterOptions,
} from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import type { ApiResponse, Paginated } from '@/types/common';
import type { MerchantAutomaticCashoutLogData } from '@/types/automatic-cashout';
import type { AutomaticCashoutStatus } from '@/types/enums';
import type { AutomaticCashoutFilters } from './cashouts-and-accounts-tabs';

type FetchPromise = Promise<ApiResponse<Paginated<MerchantAutomaticCashoutLogData>>>;

interface Props {
	fetchPromise: FetchPromise;
	merchantId: string;
	filters: AutomaticCashoutFilters;
}

const statusOptions = parseToFilterOptions(automaticCashoutStatusParse, 'Todos os status');

function getColumns(): DataTableColumn<MerchantAutomaticCashoutLogData>[] {
	return [
		{
			key: 'environment',
			header: 'Ambiente',
			width: '120px',
			render: (item) => {
				const parse = paymentEnvironmentParse[item.environment];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'amountAttempted',
			header: 'Valor Tentado',
			width: '150px',
			render: (item) => (
				<span className="font-medium">{formatCurrency(item.amountAttempted)}</span>
			),
		},
		{
			key: 'netAmount',
			header: 'Valor Líquido',
			width: '150px',
			render: (item) => (
				<span className="font-medium">{formatCurrency(item.netAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			width: '140px',
			render: (item) => {
				const parse = automaticCashoutStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'message',
			header: 'Mensagem',
			width: '220px',
			render: (item) => (
				<span className="text-sm text-muted">{item.message || '—'}</span>
			),
		},
		{
			key: 'payoutId',
			header: 'Saque',
			width: '140px',
			render: (item) =>
				item.payoutId ? (
					<code className="rounded bg-content2 px-1.5 py-0.5 text-xs">{item.payoutId.slice(0, 8)}</code>
				) : (
					<span className="text-muted">—</span>
				),
		},
		{
			key: 'createdAt',
			header: 'Data',
			width: '160px',
			render: (item) => (
				<span className="text-sm text-muted">{formatDate(item.createdAt)}</span>
			),
		},
	];
}

function renderMobileAutomaticCashoutLogCard(item: MerchantAutomaticCashoutLogData) {
	const envParse = paymentEnvironmentParse[item.environment];
	const statusParse = automaticCashoutStatusParse[item.status];
	return (
		<div className="rounded-xl border border-divider bg-surface p-3 overflow-hidden">
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<span className="font-medium text-sm">{formatCurrency(item.amountAttempted)}</span>
					<p className="text-xs text-muted mt-0.5">{item.message || '—'}</p>
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
					{statusParse.icon}
					{statusParse.label}
				</Chip>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Ambiente</span>
					<Chip variant="soft" color={mapParseColorToChipColor(envParse.color)} size="sm">
						{envParse.label}
					</Chip>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Valor Líquido</span>
					<span className="text-sm font-medium">{formatCurrency(item.netAmount)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Data</span>
					<span className="text-sm">{formatDate(item.createdAt)}</span>
				</div>
				{item.payoutId && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted">Saque</span>
						<code className="rounded bg-content2 px-1.5 py-0.5 text-xs w-fit">{item.payoutId.slice(0, 8)}</code>
					</div>
				)}
			</div>
		</div>
	);
}

export function MerchantAutomaticCashoutLogsTable({ fetchPromise, merchantId: _merchantId, filters }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const { data } = use(fetchPromise) ?? { data: null };
	const items = data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	function navigate(newParams: Record<string, string | number | undefined | null>) {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());

			Object.entries(newParams).forEach(([key, value]) => {
				const paramKey = `auto${key.charAt(0).toUpperCase()}${key.slice(1)}`;
				if (value === undefined || value === null || value === 'all' || (key === 'pageSize' && value === 10)) {
					params.delete(paramKey);
				} else {
					params.set(paramKey, String(value));
				}
			});

			if (!('page' in newParams)) params.delete('autoPage');

			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	function handleRefresh() {
		startTransition(() => router.refresh());
	}

	const hasFilters = !!filters.status;

	function clearFilters() {
		startTransition(() => {
			const params = new URLSearchParams();
			params.set('tab', 'automatic');
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	const columns = getColumns();

	return (
		<DataTable
			columns={columns}
			data={items.items}
			keyExtractor={(item) => item.id}
			isLoading={isPending}
			renderMobileCard={renderMobileAutomaticCashoutLogCard}
			minWidth="720px"
			emptyMessage="Nenhum registro de saque automatizado encontrado."
			filters={{
				children: (
					<>
						<SelectFilter<AutomaticCashoutStatus | 'all'>
							label="Status"
							value={(filters.status as AutomaticCashoutStatus) ?? 'all'}
							options={statusOptions}
							onChange={(value) => navigate({ status: value })}
						/>
						<SelectFilter<string>
							label="Itens por página"
							value={String(filters.pageSize)}
							options={pageSizeFilterOptions}
							onChange={(value) => navigate({ pageSize: Number(value), page: 1 })}
						/>
					</>
				),
				hasFilters,
				onClear: clearFilters,
				onRefresh: handleRefresh,
				isRefreshing: isPending,
			}}
			pagination={{
				page: items.page,
				pageSize: items.pageSize,
				totalItems: items.totalItems,
				totalPages: items.totalPages,
				onPageChange: (page) => navigate({ page }),
				sortBy: filters.sortBy,
				sortOrder: filters.sortOrder,
				onSortChange: (sortBy, sortOrder) => navigate({ sortBy, sortOrder, page: 1 }),
				isNavigating: isPending,
			}}
		/>
	);
}
