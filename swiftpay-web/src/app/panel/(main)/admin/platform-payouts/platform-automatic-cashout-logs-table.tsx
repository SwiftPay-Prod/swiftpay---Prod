'use client';

import { use, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Chip, Tooltip } from '@heroui/react';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import {
	automaticCashoutStatusParse,
	paymentEnvironmentParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
	mapParseColorToChipColor,
} from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminAutomaticCashoutLogData } from '@/types/automatic-cashout';
import type { AutomaticCashoutStatus, PaymentEnvironment } from '@/types/enums';

type FetchPromise = Promise<ApiResponse<Paginated<AdminAutomaticCashoutLogData>>>;

export interface PlatformAutomaticCashoutFilters {
	page: number;
	pageSize: number;
	status?: AutomaticCashoutStatus | null;
	environment?: PaymentEnvironment | null;
}

interface Props {
	fetchPromise: FetchPromise;
	filters: PlatformAutomaticCashoutFilters;
}

const statusOptions = parseToFilterOptions(automaticCashoutStatusParse, 'Todos os status');
const environmentOptions = parseToFilterOptions(paymentEnvironmentParse, 'Todos ambientes');

function getColumns(): DataTableColumn<AdminAutomaticCashoutLogData>[] {
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
			header: 'Valor Bruto',
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
				<span className="text-sm text-muted">{formatCurrency(item.netAmount)}</span>
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
				<span className="text-sm text-muted line-clamp-2">{item.message || '—'}</span>
			),
		},
		{
			key: 'technicalDetails',
			header: 'Detalhes Técnicos',
			width: '200px',
			render: (item) => {
				if (!item.technicalDetails) return <span className="text-sm text-muted">—</span>;
				return (
					<Tooltip>
						<span className="cursor-default text-sm text-muted line-clamp-2">{item.technicalDetails}</span>
						<Tooltip.Content className="max-w-80">
							<p className="whitespace-pre-wrap text-xs">{item.technicalDetails}</p>
						</Tooltip.Content>
					</Tooltip>
				);
			},
		},
		{
			key: 'payoutId',
			header: 'Saque da Plataforma',
			width: '180px',
			render: (item) =>
				item.payoutId ? (
					<code className="rounded bg-surface px-1.5 py-0.5 text-xs">{item.payoutId.slice(0, 8)}...</code>
				) : (
					<span className="text-sm text-muted">—</span>
				),
		},
		{
			key: 'createdAt',
			header: 'Data',
			width: '160px',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.createdAt)}</span>,
		},
	];
}

function renderMobilePlatformAutomaticCashoutLogCard(item: AdminAutomaticCashoutLogData) {
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
					<span className="text-sm">{formatCurrency(item.netAmount)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Data</span>
					<span className="text-sm">{formatDate(item.createdAt)}</span>
				</div>
				{item.payoutId && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted">Saque Plataforma</span>
						<code className="rounded bg-content2 px-1.5 py-0.5 text-xs w-fit">{item.payoutId.slice(0, 8)}...</code>
					</div>
				)}
			</div>
		</div>
	);
}

export function PlatformAutomaticCashoutLogsTable({ fetchPromise, filters }: Props) {
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
				if (value === undefined || value === null || value === '' || value === 'all' || (key === 'pageSize' && value === 10)) {
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

	const hasFilters = !!(filters.status || filters.environment);

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
			skeletonRows={items.pageSize || 10}
			renderMobileCard={renderMobilePlatformAutomaticCashoutLogCard}
			emptyMessage="Nenhum log de saque automatizado da plataforma encontrado"
			minWidth="min-w-220"
			filters={{
				children: (
					<>
						<SelectFilter
							label="Status"
							value={(filters.status as string) ?? 'all'}
							options={statusOptions}
							onChange={(value) => navigate({ status: value as AutomaticCashoutStatus | 'all' })}
						/>
						<SelectFilter
							label="Ambiente"
							value={(filters.environment as string) ?? 'all'}
							options={environmentOptions}
							onChange={(value) => navigate({ environment: value as PaymentEnvironment | 'all' })}
						/>
						<SelectFilter
							label="Por página"
							value={String(filters.pageSize)}
							options={pageSizeFilterOptions}
							onChange={(value) => navigate({ pageSize: value ? Number(value) : 10 })}
							showChips={false}
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
				isNavigating: isPending,
			}}
		/>
	);
}
