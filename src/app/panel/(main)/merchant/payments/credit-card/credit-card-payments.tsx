'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Button, Skeleton, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { RefreshIcon, CreditCardIcon, ExternalLink, ViewIcon, Copy01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { MerchantTransactionDetailsModal } from '@/app/panel/(main)/merchant/transactions/modals/merchant-transaction-details-modal';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { listMerchantPayments, getMerchantPayment, resendWebhook } from '@/app/actions/merchant/payments';
import { formatDate } from '@/utils/datetime';
import { toast } from '@heroui/react';
import { PaymentStatus, PaymentMethod } from '@/types/enums';
import type { MinimalPayment, PaymentDetails } from '@/types/merchant/payments';
import type { ApiResponse, Paginated } from '@/types/common';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

const statusOptions = [
	{ value: 'all', label: 'Todos os status' },
	{ value: PaymentStatus.Pending, label: 'Pendente' },
	{ value: PaymentStatus.Processing, label: 'Processando' },
	{ value: PaymentStatus.Confirming, label: 'Confirmando' },
	{ value: PaymentStatus.Completed, label: 'Concluída' },
	{ value: PaymentStatus.Failed, label: 'Falhada' },
];

const pageSizeOptions = [
	{ value: '10', label: '10' },
	{ value: '20', label: '20' },
	{ value: '50', label: '50' },
];

type PaymentPromise = Promise<ApiResponse<PaymentDetails>>;

interface FiltersState {
	search: string;
	status: string;
	pageSize: string;
	page: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

const initialFilters: FiltersState = {
	search: '',
	status: 'all',
	pageSize: '10',
	page: 1,
	sortBy: 'createdAt',
	sortOrder: 'desc',
};

interface DetailsModalState {
	isOpen: boolean;
	paymentPromise: PaymentPromise | null;
}

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	paymentPromise: null,
};

interface ActionState {
	viewingId: string | null;
	resendingWebhookId: string | null;
}

const initialActionState: ActionState = {
	viewingId: null,
	resendingWebhookId: null,
};

export function CreditCardPayments({ merchantId }: { merchantId: string }) {
	const [data, setData] = useState<Paginated<MinimalPayment> | null>(null);
	const [isRefreshing, startRefresh] = useTransition();
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [actionState, setActionState] = useState<ActionState>(initialActionState);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const fetchPayments = useCallback(
		async (next: FiltersState) => {
			const res = await listMerchantPayments(merchantId, {
				page: next.page,
				pageSize: Number(next.pageSize),
				method: PaymentMethod.CreditCard,
				status: next.status === 'all' ? undefined : (next.status as PaymentStatus),
				search: next.search || undefined,
				sortBy: next.sortBy,
				sortOrder: next.sortOrder,
			});
			setData(res.data ?? null);
		},
		[merchantId],
	);

	useEffect(() => {
		fetchPayments(filters);
	}, [filters, fetchPayments]);

	const items = data?.items?.filter((item) => item.method === PaymentMethod.CreditCard) ?? [];

	const handleRefresh = useCallback(() => {
		startRefresh(async () => {
			await fetchPayments(filters);
			toast('Lista atualizada', { description: 'Transações recarregadas', variant: 'success' });
		});
	}, [fetchPayments, filters]);

	const handleView = useCallback((payment: MinimalPayment) => {
		setDetailsModal({
			isOpen: true,
			paymentPromise: getMerchantPayment(merchantId, payment.id),
		});
	}, [merchantId]);

	const handleCopyLink = useCallback(async (payment: MinimalPayment) => {
		if (!payment.transactionVisualizationUrl) return;
		await navigator.clipboard.writeText(payment.transactionVisualizationUrl);
		setCopiedId(payment.id);
		setTimeout(() => setCopiedId(null), 2000);
		toast('Link copiado', { description: 'URL copiada para a área de transferência', variant: 'success' });
	}, []);

	const handleResendWebhook = useCallback(
		async (payment: MinimalPayment) => {
			setActionState((s) => ({ ...s, resendingWebhookId: payment.id }));
			const res = await resendWebhook(merchantId, payment.id);
			if (res.error) {
				toast('Falha ao reenviar webhook', { description: res.message ?? 'Erro desconhecido', variant: 'danger' });
				return;
			}
			toast('Webhook reenviado', { description: 'Webhook reenviado com sucesso', variant: 'success' });
			await fetchPayments(filters);
		},
		[merchantId, fetchPayments, filters],
	);

	const onSearchChange = useCallback((value: string) => {
		setFilters((f) => ({ ...f, search: value, page: 1 }));
	}, []);

	const onStatusChange = useCallback((value: string) => {
		setFilters((f) => ({ ...f, status: value, page: 1 }));
	}, []);

	const onPageSizeChange = useCallback((value: string) => {
		setFilters((f) => ({ ...f, pageSize: value, page: 1 }));
	}, []);

	const onPageChange = useCallback((page: number) => {
		setFilters((f) => ({ ...f, page }));
	}, []);

	const columns = [
		{
			key: 'id',
			header: 'ID',
			width: '140px',
			render: (item: MinimalPayment) => (
				<span className="text-xs font-mono text-muted-foreground">{item.id}</span>
			),
		},
		{
			key: 'amount',
			header: 'Valor',
			align: 'right' as const,
			width: '110px',
			render: (item: MinimalPayment) => (
				<span className="text-xs font-mono font-medium text-foreground">
					<AnimatedCurrency value={item.amount} />
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			width: '120px',
			render: (item: MinimalPayment) => (
				<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface border border-border/60">
					{item.status}
				</span>
			),
		},
		{
			key: 'customer',
			header: 'Cliente',
			render: (item: MinimalPayment) => (
				<div className="flex flex-col min-w-0">
					<span className="text-xs font-medium text-foreground truncate">{item.customer?.name ?? '—'}</span>
					<span className="text-xs text-muted-foreground truncate">{item.customer?.email ?? '—'}</span>
				</div>
			),
		},
		{
			key: 'requestSource',
			header: 'Origem',
			width: '120px',
			render: (item: MinimalPayment) => (
				<span className="text-xs text-muted-foreground">{item.requestSource}</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			width: '110px',
			render: (item: MinimalPayment) => (
				<span className="text-xs font-mono text-muted-foreground">{formatDate(item.createdAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			width: '90px',
			align: 'right' as const,
			render: (item: MinimalPayment) => (
				<div className="flex items-center justify-end gap-1">
					<Tooltip>
						<Button isIconOnly size="sm" variant="ghost" onPress={() => handleView(item)}>
							<Icon icon={ViewIcon} className="w-4 h-4" />
						</Button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>
					{item.transactionVisualizationUrl && (
						<Tooltip>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => handleCopyLink(item)}>
								<Icon icon={copiedId === item.id ? CheckmarkCircle02Icon : Copy01Icon} className="w-4 h-4" />
							</Button>
							<Tooltip.Content>Copiar link</Tooltip.Content>
						</Tooltip>
					)}
				</div>
			),
		},
	];

	const renderMobileCard = (item: MinimalPayment) => (
		<div className="flex flex-col gap-2 p-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-foreground truncate">{item.customer?.name ?? '—'}</span>
				<span className="text-xs font-mono font-medium text-foreground">
					<AnimatedCurrency value={item.amount} />
				</span>
			</div>
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{formatDate(item.createdAt)}</span>
				<span>{item.status}</span>
			</div>
		</div>
	);

	const mobileActions = {
		title: (item: MinimalPayment) => item.customer?.name ?? 'Transação',
		subtitle: (item: MinimalPayment) => item.customer?.email ?? '—',
		renderActions: (item: MinimalPayment, close: () => void) => (
			<div className="flex flex-col gap-1">
				<Button variant="ghost" size="sm" onPress={() => { handleView(item); close(); }}>
					Ver detalhes
				</Button>
				{item.transactionVisualizationUrl && (
					<Button variant="ghost" size="sm" onPress={() => { handleCopyLink(item); close(); }}>
						Copiar link
					</Button>
				)}
			</div>
		),
	};

	const isLoading = !data;

	const filtersContent = (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
			<SearchFilter placeholder="Buscar transação ou cliente..." value={filters.search} onChange={onSearchChange} />
			<SelectFilter label="Status" placeholder="Status" value={filters.status} options={statusOptions} onChange={onStatusChange} />
			<SelectFilter label="Exibir" placeholder="Exibir" value={filters.pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
		</div>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={CreditCardIcon} className="text-muted-foreground" />}
				title="Cartão de Crédito"
				description="Transações e movimentações com cartão de crédito"
				actions={
					<div className="flex items-center gap-2">
						<Button variant="tertiary" size="sm" onPress={handleRefresh} isDisabled={isRefreshing}>
							<Icon icon={RefreshIcon} className="icon-sm" />
							<span>Atualizar</span>
						</Button>
					</div>
				}
			/>

			<DataTable
				columns={columns}
				data={items}
				keyExtractor={(item) => item.id}
				isLoading={isLoading}
				skeletonRows={6}
				emptyMessage="Nenhuma transação com cartão encontrada"
				minWidth="720px"
				renderMobileCard={renderMobileCard}
				mobileActions={mobileActions}
				filters={{
					children: filtersContent,
					hasFilters: true,
					onRefresh: handleRefresh,
					isRefreshing: isRefreshing,
				}}
				pagination={
					data
						? {
								page: data.page,
								pageSize: data.pageSize,
								totalItems: data.totalItems,
								totalPages: data.totalPages,
								onPageChange: onPageChange,
								sortBy: filters.sortBy,
								sortOrder: filters.sortOrder,
							}
						: undefined
				}
			/>

			<MerchantTransactionDetailsModal
				isOpen={detailsModal.isOpen}
				onOpenChange={(next) => setDetailsModal((s) => ({ ...s, isOpen: next }))}
				paymentPromise={detailsModal.paymentPromise}
				merchantId={merchantId}
				onRefresh={() => fetchPayments(filters)}
			/>
		</div>
	);
}