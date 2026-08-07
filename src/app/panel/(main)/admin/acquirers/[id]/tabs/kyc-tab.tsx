'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { Chip, Tooltip } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	Upload01Icon,
	CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { DocumentDisplay } from '@/components/ui/data-links';
import { AsyncButton } from '@/components/ui/async-button';
import {
	externalSubmerchantStatusParse,
	merchantStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import {
	adminGetAcquirerMerchants,
	adminSubmitMerchantSubmerchant,
	adminRefreshMerchantSubmerchantStatus,
} from '@/app/actions/admin/acquirers';
import { toast } from '@heroui/react';
import { formatDate } from '@/utils/datetime';
import type { AcquirerMerchantData } from '@/types/admin/acquirers';
import type { ExternalSubmerchantStatus } from '@/types/enums';
import type { Paginated } from '@/types/common';
import {
	ACQUIRER_KYC_EMPTY_MERCHANTS,
	ACQUIRER_KYC_PAGE_SIZE_OPTIONS,
	type CreatedFilterValue,
	type KycStatusFilterValue,
	type PageSizeFilterValue,
} from '../acquirer-kyc.constants';

interface KycTabProps {
	acquirerId: string;
}

function SubmerchantStatusChip({ status }: { status: ExternalSubmerchantStatus | null }) {
	if (!status) {
		const parse = externalSubmerchantStatusParse.NotSubmitted;
		return (
			<Chip variant="soft" size="sm" color={mapParseColorToChipColor(parse.color)} className="gap-1">
				{parse.icon}
				{parse.label}
			</Chip>
		);
	}
	const parse = externalSubmerchantStatusParse[status];
	return (
		<Chip variant="soft" size="sm" color={mapParseColorToChipColor(parse.color)} className="gap-1">
			{parse.icon}
			{parse.label}
		</Chip>
	);
}

interface KycTableColumnsProps {
	onSubmitKyc: (merchant: AcquirerMerchantData) => void;
	onRefreshStatus: (merchant: AcquirerMerchantData) => void;
	isActionPending: boolean;
	pendingRowId: string | null;
	pendingAction: 'submit' | 'refresh' | null;
}

interface SubmitActionConfig {
	canSubmit: boolean;
	label: string;
	tooltip: string;
}

function getSubmitActionConfig(status: ExternalSubmerchantStatus | null): SubmitActionConfig {
	switch (status) {
		case null:
		case 'NotSubmitted':
			return {
				canSubmit: true,
				label: 'Enviar',
				tooltip: 'Enviar KYC do submerchant',
			};
		case 'Rejected':
			return {
				canSubmit: true,
				label: 'Reenviar',
				tooltip: 'Reenviar KYC com dados e documentos atualizados',
			};
		case 'Pending':
			return {
				canSubmit: true,
				label: 'Reenviar',
				tooltip: 'Reenviar para análise',
			};
		default:
			return {
				canSubmit: false,
				label: 'Enviar',
				tooltip: 'Enviar KYC do submerchant',
			};
	}
}

function getColumns({
	onSubmitKyc,
	onRefreshStatus,
	isActionPending,
	pendingRowId,
	pendingAction,
}: KycTableColumnsProps): DataTableColumn<AcquirerMerchantData>[] {
	return [
		{
			key: 'merchant',
			header: 'Organização',
			skeletonWidth: 'w-40',
			render: (merchant) => (
				<div className="flex flex-col gap-1">
					<AdminMerchantLink
						merchantId={merchant.id}
						name={merchant.name ?? 'Sem nome'}
						newTab
						className="font-semibold text-accent hover:underline"
					/>
					<span className="text-xs text-muted">
						<DocumentDisplay
							document={merchant.documentNumber}
							documentType={merchant.documentType}
							fallback="Documento não informado"
						/>
					</span>
					<span className="text-xs text-muted">{merchant.legalName ?? 'Razão social não informada'}</span>
				</div>
			),
		},
		{
			key: 'merchantStatus',
			header: 'Status da Organização',
			align: 'center',
			skeletonWidth: 'w-26',
			render: (merchant) => {
				const parse = merchantStatusParse[merchant.status];
				return (
					<Chip variant="soft" size="sm" color={mapParseColorToChipColor(parse.color)}>
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'externalId',
			header: 'ID Externo',
			skeletonWidth: 'w-30',
			render: (merchant) => (
				<span className="text-xs font-mono text-muted">
					{merchant.externalSubmerchantId ?? 'Não cadastrado'}
				</span>
			),
		},
		{
			key: 'submerchantStatus',
			header: 'Status KYC',
			align: 'center',
			skeletonWidth: 'w-26',
			render: (merchant) => <SubmerchantStatusChip status={merchant.externalSubmerchantStatus} />,
		},
		{
			key: 'submittedAt',
			header: 'Enviado em',
			skeletonWidth: 'w-26',
			render: (merchant) => (
				<div className="flex flex-col gap-0.5 text-xs">
					<span>{merchant.externalOnboardingSubmittedAt ? formatDate(merchant.externalOnboardingSubmittedAt) : 'Nunca'}</span>
					{merchant.externalOnboardingRejectionReason && (
						<span className="text-danger">{merchant.externalOnboardingRejectionReason}</span>
					)}
				</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'right',
			skeletonWidth: 'w-32',
			render: (merchant) => {
				const status = merchant.externalSubmerchantStatus;
				const submitConfig = getSubmitActionConfig(status);
				const canRefresh = !!merchant.externalSubmerchantId
					&& status !== 'NotSubmitted';

				const isSubmitPending =
					isActionPending && pendingRowId === merchant.merchantAcquirerId && pendingAction === 'submit';
				const isRefreshPending =
					isActionPending && pendingRowId === merchant.merchantAcquirerId && pendingAction === 'refresh';

				return (
					<div className="flex items-center justify-end gap-2">
						{submitConfig.canSubmit && (
							<Tooltip>
								<AsyncButton
									size="sm"
									variant="primary"
									onPress={() => onSubmitKyc(merchant)}
									isPending={isSubmitPending}
								>
									<Icon icon={Upload01Icon} className="icon-sm" />
									{submitConfig.label}
								</AsyncButton>
								<Tooltip.Content>{submitConfig.tooltip}</Tooltip.Content>
							</Tooltip>
						)}
						{canRefresh && (
							<Tooltip>
								<AsyncButton
									isIconOnly
									size="sm"
									variant="secondary"
									onPress={() => onRefreshStatus(merchant)}
									isPending={isRefreshPending}
								>
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
								</AsyncButton>
								<Tooltip.Content>Consultar status na IP</Tooltip.Content>
							</Tooltip>
						)}
					</div>
				);
			},
		},
	];
}

export function KycTab({ acquirerId }: KycTabProps) {
	const [isListPending, startListTransition] = useTransition();
	const [isActionPending, startActionTransition] = useTransition();
	const [hasLoaded, setHasLoaded] = useState(false);
	const [data, setData] = useState<Paginated<AcquirerMerchantData>>(ACQUIRER_KYC_EMPTY_MERCHANTS);
	const [searchValue, setSearchValue] = useState('');
	const [statusFilter, setStatusFilter] = useState<KycStatusFilterValue>('all');
	const [createdFilter, setCreatedFilter] = useState<CreatedFilterValue>('all');
	const [pageSize, setPageSize] = useState<PageSizeFilterValue>('20');
	const [page, setPage] = useState(1);
	const [pendingRowId, setPendingRowId] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<'submit' | 'refresh' | null>(null);

	const deferredSearchValue = useDeferredValue(searchValue);

	const statusOptions = useMemo(
		() => [
			{ value: 'all' as KycStatusFilterValue, label: 'Todos os status' },
			...Object.entries(externalSubmerchantStatusParse).map(([value, parsed]) => ({
				value: value as KycStatusFilterValue,
				label: parsed.label,
				color: mapParseColorToChipColor(parsed.color),
				icon: parsed.icon,
			})),
		],
		[]
	);

	const createdOptions = useMemo(
		() => [
			{ value: 'all' as CreatedFilterValue, label: 'Todos os vínculos' },
			{ value: 'created' as CreatedFilterValue, label: 'Submerchant criado', color: 'success' as const },
			{ value: 'not_created' as CreatedFilterValue, label: 'Sem submerchant', color: 'default' as const },
		],
		[]
	);

	const hasFilters =
		searchValue.trim().length > 0
		|| statusFilter !== 'all'
		|| createdFilter !== 'all'
		|| pageSize !== '20';

	const fetchMerchants = useCallback(() => {
		startListTransition(async () => {
			const response = await adminGetAcquirerMerchants(acquirerId, {
				page,
				pageSize: Number(pageSize),
				search: deferredSearchValue.trim() || undefined,
				externalSubmerchantStatus: statusFilter === 'all' ? undefined : statusFilter,
				hasExternalSubmerchant:
					createdFilter === 'all'
						? undefined
						: createdFilter === 'created',
			});

			if (response?.data) {
				setData(response.data);
			} else {
				setData({
					items: [],
					totalItems: 0,
					page,
					pageSize: Number(pageSize),
					totalPages: 0,
				});
			}

			setHasLoaded(true);
		});
	}, [acquirerId, createdFilter, deferredSearchValue, page, pageSize, statusFilter]);

	useEffect(() => {
		fetchMerchants();
	}, [fetchMerchants]);

	function handleRefresh() {
		fetchMerchants();
	}

	function handleClearFilters() {
		setSearchValue('');
		setStatusFilter('all');
		setCreatedFilter('all');
		setPageSize('20');
		setPage(1);
	}

	const handleSubmitKyc = useCallback((merchant: AcquirerMerchantData) => {
		setPendingRowId(merchant.merchantAcquirerId);
		setPendingAction('submit');

		startActionTransition(async () => {
			try {
				const response = await adminSubmitMerchantSubmerchant(acquirerId, merchant.id);
				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao enviar KYC');
					return;
				}

				toast('KYC enviado', {
					description: response?.data?.externalSubmerchantId
						? `Submerchant ID ${response.data.externalSubmerchantId} atualizado e reenviado para validacao.`
						: 'Submerchant atualizado e reenviado para validacao.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});

				fetchMerchants();
			} finally {
				setPendingRowId(null);
				setPendingAction(null);
			}
		});
	}, [acquirerId, fetchMerchants]);

	const handleRefreshStatus = useCallback((merchant: AcquirerMerchantData) => {
		setPendingRowId(merchant.merchantAcquirerId);
		setPendingAction('refresh');

		startActionTransition(async () => {
			try {
				const response = await adminRefreshMerchantSubmerchantStatus(acquirerId, merchant.merchantAcquirerId);
				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao consultar status');
					return;
				}

				const status = response?.data?.status ?? 'Pending';
				toast('Status atualizado', {
					description: `Status atual: ${externalSubmerchantStatusParse[status].label}`,
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});

				fetchMerchants();
			} finally {
				setPendingRowId(null);
				setPendingAction(null);
			}
		});
	}, [acquirerId, fetchMerchants]);

	const columns = useMemo(
		() => getColumns({
			onSubmitKyc: handleSubmitKyc,
			onRefreshStatus: handleRefreshStatus,
			isActionPending,
			pendingRowId,
			pendingAction,
		}),
		[handleRefreshStatus, handleSubmitKyc, isActionPending, pendingAction, pendingRowId]
	);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				key={searchValue === '' ? 'empty' : 'filled'}
				label="Buscar"
				placeholder="Nome, documento ou ID externo..."
				defaultValue={searchValue}
				onChange={(value) => {
					setSearchValue(value);
					setPage(1);
				}}
			/>

			<SelectFilter
				label="Status KYC"
				value={statusFilter}
				options={statusOptions}
				onChange={(value) => {
					setStatusFilter(value);
					setPage(1);
				}}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Submerchant"
				value={createdFilter}
				options={createdOptions}
				onChange={(value) => {
					setCreatedFilter(value);
					setPage(1);
				}}
				allLabel="Todos os vínculos"
			/>

			<SelectFilter
				label="Por página"
				value={pageSize}
				options={ACQUIRER_KYC_PAGE_SIZE_OPTIONS}
				onChange={(value) => {
					setPageSize(value);
					setPage(1);
				}}
				showChips={false}
			/>
		</>
	);

	return (
		<DataTable
			columns={columns}
			data={data.items}
			keyExtractor={(merchant) => merchant.merchantAcquirerId}
			isLoading={!hasLoaded || isListPending}
			skeletonRows={Number(pageSize)}
			emptyMessage="Nenhum vínculo encontrado para os filtros selecionados"
			minWidth="min-w-250"
			filters={{
				children: renderFiltersContent,
				hasFilters,
				onClear: handleClearFilters,
				onRefresh: handleRefresh,
				isRefreshing: isListPending,
			}}
			pagination={{
				page: data.page,
				pageSize: data.pageSize,
				totalItems: data.totalItems,
				totalPages: data.totalPages,
				onPageChange: (nextPage) => setPage(nextPage),
				isNavigating: isListPending,
			}}
		/>
	);
}
