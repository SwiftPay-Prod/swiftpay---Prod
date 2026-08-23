'use client';

import React from 'react';
import { Button, Tooltip, Dropdown, toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	ViewIcon,
	SentIcon,
	MoreHorizontalCircle01Icon,
	SourceCodeSquareIcon,
	Link02Icon,
	ShoppingCartCheck01Icon,
	Copy01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import {
	paymentStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { MerchantTransactionDetailsModal } from './modals/merchant-transaction-details-modal';
import { CreateTransactionModal } from './modals/create-transaction-modal';
import { EmailLink, PhoneLink } from '@/components/ui/data-links';
import { PaymentRequestSource, PaymentStatus } from '@/types/enums';
import type { MinimalPayment } from '@/types/merchant/payments';
import type { DataTableColumn } from '@/components/ui/data-table';
import { useTransactionsTable } from './use-transactions-table';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutPlusIcon,
	RevolutTrendingUpIcon,
	RevolutCheckIcon,
} from '@/components/ui/revolut-icons';

interface TransactionsTableProps {
	merchantId: string;
	readOnly?: boolean;
}

const statusOptions = parseToFilterOptions(paymentStatusParse, 'Todos os status');

const originFilterOptions = [
	{ key: '', label: 'Todas as origens' },
	{ key: 'checkout', label: 'Checkout' },
	{ key: 'link', label: 'Link de Pagamento' },
	{ key: 'api', label: 'API / Integração' },
];

interface ColumnConfig {
	onView: (id: string) => void;
	onCopyVisualizationLink: (url: string) => Promise<void>;
	onResendWebhook: (payment: MinimalPayment) => void;
	resendingWebhookId: string | null;
	canResendWebhook: (payment: MinimalPayment) => boolean;
}

function getPaymentRequestSource(payment: MinimalPayment): PaymentRequestSource {
	if (payment.requestSource === PaymentRequestSource.Api || payment.requestSource === PaymentRequestSource.Checkout || payment.requestSource === PaymentRequestSource.PaymentLink) {
		return payment.requestSource;
	}

	if (payment.isCheckoutPayment) {
		return PaymentRequestSource.Checkout;
	}

	return PaymentRequestSource.Api;
}

function getRequestSourceBadge(source: PaymentRequestSource) {
	if (source === PaymentRequestSource.PaymentLink) {
		return {
			label: 'Link de Pagamento',
			color: 'secondary' as const,
			icon: Link02Icon,
		};
	}

	if (source === PaymentRequestSource.Checkout) {
		return {
			label: 'Checkout',
			color: 'accent' as const,
			icon: ShoppingCartCheck01Icon,
		};
	}

	return {
		label: 'API',
		color: 'default' as const,
		icon: SourceCodeSquareIcon,
	};
}

function getColumns(config: ColumnConfig): DataTableColumn<MinimalPayment>[] {
	const { onView, onCopyVisualizationLink, onResendWebhook, resendingWebhookId, canResendWebhook } = config;

	return [
		{
			key: 'customerName',
			header: 'Cliente',
			render: (payment) => (
				<span className="text-sm font-medium text-white truncate max-w-40">
					{payment.customer?.name ?? '-'}
				</span>
			),
		},
		{
			key: 'customerContact',
			header: 'Contato',
			sortable: false,
			render: (payment) => {
				const hasPhone = !!payment.customer?.phone;
				const hasEmail = !!payment.customer?.email;

				if (hasPhone && hasEmail) {
					return (
						<div className="flex flex-col gap-0.5">
							<EmailLink email={payment.customer!.email!} className="text-xs text-white/70" />
							<PhoneLink phone={payment.customer!.phone!} className="text-xs text-white/50" />
						</div>
					);
				}

				if (hasEmail) {
					return <EmailLink email={payment.customer!.email!} className="text-xs text-white/70" />;
				}

				if (hasPhone) {
					return <PhoneLink phone={payment.customer!.phone!} className="text-xs text-white/50" />;
				}

				return <span className="text-sm text-white/40">-</span>;
			},
		},
		{
			key: 'amount',
			header: 'Valor Bruto',
			render: (payment) => (
				<div className="flex flex-col">
					<span className="text-sm font-bold font-mono text-white tabular-nums">{formatCurrency(payment.amount)}</span>
					<span className="text-[11px] font-mono text-white/40">Taxa: {formatCurrency(payment.fee)}</span>
				</div>
			),
		},
		{
			key: 'netAmount',
			header: 'Líquido',
			render: (payment) => (
				<span className="text-sm font-bold font-mono text-[#00a87e] tabular-nums">{formatCurrency(payment.netAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (payment) => (
				<RevolutStatusBadge
					status={payment.status}
					label={paymentStatusParse[payment.status]?.label}
				/>
			),
		},
		{
			key: 'origin',
			header: 'Origem',
			sortable: false,
			render: (payment) => {
				const source = getPaymentRequestSource(payment);
				const sourceBadge = getRequestSourceBadge(source);

				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
						<Icon icon={sourceBadge.icon} className="icon-xs text-white/60" />
						{sourceBadge.label}
					</span>
				);
			},
		},
		{
			key: 'payer',
			header: 'Pagador PIX',
			sortable: false,
			render: (payment) => {
				if (!payment.pix?.payerName) {
					return <span className="text-sm text-white/40">-</span>;
				}
				return (
					<div className="flex flex-col">
						<span className="text-sm text-white font-medium truncate max-w-40">{payment.pix.payerName}</span>
						{payment.pix.payerBank && (
							<span className="text-[11px] text-white/40 truncate">{payment.pix.payerBank}</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (payment) => (
				<span className="text-xs font-mono text-white/50">{formatDate(payment.createdAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (payment) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => onView(payment.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>

					{payment.transactionVisualizationUrl && (
						<Tooltip>
							<button
								type="button"
								onClick={async () => {
									await onCopyVisualizationLink(payment.transactionVisualizationUrl!);
								}}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={Copy01Icon} className="icon-sm" />
							</button>
							<Tooltip.Content>Copiar link de visualização</Tooltip.Content>
						</Tooltip>
					)}

					{canResendWebhook(payment) && (
						<Dropdown>
							<Button
								isIconOnly
								isDisabled={resendingWebhookId === payment.id}
								aria-label="Mais ações"
								className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
							</Button>
							<Dropdown.Popover className="min-w-48 bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
								<Dropdown.Menu aria-label="Ações da transação">
									<Dropdown.Item id="resend-webhook" textValue="Reenviar webhook" className="text-white hover:bg-white/10" onPress={() => onResendWebhook(payment)}>
										<Icon icon={SentIcon} className="icon-xs text-[#4f55f1]" />
										Reenviar webhook
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					)}
				</div>
			),
		},
	];
}

function renderMobileTransactionCard(
	payment: MinimalPayment,
	index: number,
	openActions?: () => void,
) {
	return (
		<div
			className={`rounded-2xl border border-white/10 bg-[#16181a] p-4 text-white overflow-hidden transition-all ${openActions ? 'cursor-pointer hover:border-white/20' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={
				openActions
					? (event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							openActions();
						}
					}
					: undefined
			}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<span className="font-bold text-sm text-white truncate block">{payment.customer?.name ?? 'Cliente não informado'}</span>
					<p className="mt-0.5 text-xs text-white/50 font-mono truncate">
						PIX • {formatDate(payment.createdAt)}
					</p>
				</div>
				<RevolutStatusBadge status={payment.status} label={paymentStatusParse[payment.status]?.label} />
			</div>

			{(payment.customer?.email || payment.customer?.phone) && (
				<div className="mt-2 flex flex-col gap-0.5">
					{payment.customer.email && <EmailLink email={payment.customer.email} className="text-xs text-white/60" />}
					{payment.customer.phone && <PhoneLink phone={payment.customer.phone} className="text-xs text-white/50" />}
				</div>
			)}

			<div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
				<div className="min-w-0">
					<p className="text-[11px] uppercase tracking-wider text-white/40">Valor Bruto</p>
					<p className="mt-0.5 text-sm font-bold font-mono text-white truncate">{formatCurrency(payment.amount)}</p>
					<p className="text-[11px] font-mono text-white/40">Taxa: {formatCurrency(payment.fee)}</p>
				</div>
				<div className="min-w-0">
					<p className="text-[11px] uppercase tracking-wider text-white/40">Líquido</p>
					<p className="mt-0.5 text-sm font-bold font-mono text-[#00a87e] truncate">{formatCurrency(payment.netAmount)}</p>
				</div>
			</div>

			{payment.pix?.payerName && (
				<div className="mt-2 border-t border-white/8 pt-2">
					<p className="text-[11px] text-white/40 uppercase tracking-wider">Pagador PIX</p>
					<p className="mt-0.5 text-xs text-white/80 font-medium truncate">{payment.pix.payerName}</p>
				</div>
			)}
		</div>
	);
}

export function TransactionsTable({ merchantId, readOnly = false }: TransactionsTableProps) {
	const { data, filters, modals, actions, context } = useTransactionsTable({ merchantId, readOnly });

	async function handleCopyVisualizationLink(url: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(url);
			toast('Link de visualização copiado', {
				description: 'A URL da transação foi copiada para a área de transferência.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
		} catch {
			toast('Falha ao copiar link', {
				description: 'Não foi possível copiar automaticamente. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		}
	}

	const columns = getColumns({
		onView: actions.openDetails,
		onCopyVisualizationLink: handleCopyVisualizationLink,
		onResendWebhook: actions.handleResendWebhook,
		resendingWebhookId: actions.resendingWebhookId,
		canResendWebhook: actions.canResendWebhook,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="EndToEndId, CPF/CNPJ, nome ou ID..."
				value={filters.values.search}
				onChange={filters.handleSearchChange}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status}
				options={statusOptions}
				onChange={filters.handleStatusChange}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Por página"
				value={filters.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={filters.handlePageSizeChange}
				showChips={false}
			/>
		</>
	);

	const rows = data.payments.items;
	const approved = rows.filter((item) => item.status === PaymentStatus.Completed);
	const approvedVolume = approved.reduce((acc, item) => acc + item.amount, 0);
	const totalVolume = rows.reduce((acc, item) => acc + item.amount, 0);
	const conversionRate = rows.length > 0 ? (approved.length / rows.length) * 100 : 0;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<RevolutPixIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Extrato de Vendas PIX</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Auditoria em tempo real de liquidações PIX instantâneas D+0
					</p>
				</div>

				{!context.readOnly && (
					<button
						type="button"
						onClick={modals.create.open}
						className="button-primary cursor-pointer self-start sm:self-auto"
					>
						<RevolutPlusIcon size={16} />
						<span>+ Nova Cobrança PIX</span>
					</button>
				)}
			</div>

			{/* High-Contrast 3-Tile KPI Summary */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* Volume Total */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Volume Filtrado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutPixIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalVolume}
							className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Total das transações listadas</p>
					</div>
				</div>

				{/* Cobranças Liquidadas */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Cobranças Liquidadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums">
								{approved.length}
							</span>
							<span className="text-xs font-mono text-white/40">
								de {rows.length} ordens
							</span>
						</div>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">
							{formatCurrency(approvedVolume)} em caixa
						</p>
					</div>
				</div>

				{/* Taxa de Conversão PIX */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Taxa de Conversão PIX
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<RevolutTrendingUpIcon size={14} />
						</div>
					</div>
					<div>
						<div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
							{conversionRate.toFixed(1)}%
						</div>
						<p className="text-xs text-white/40 font-mono mt-0.5">Eficiência de liquidação no período</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.payments.items}
					keyExtractor={(item) => item.id}
					skeletonRows={Number(filters.values.pageSize)}
					emptyMessage="Nenhuma transação PIX encontrada no período selecionado."
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.handleClearFilters,
						onRefresh: filters.handleRefresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: data.payments.page,
						pageSize: data.payments.pageSize,
						totalItems: data.payments.totalItems,
						totalPages: data.payments.totalPages,
						onPageChange: filters.handlePageChange,
					}}
					renderMobileCard={renderMobileTransactionCard}
				/>
			</div>

			{/* Modals */}
			<MerchantTransactionDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				paymentPromise={modals.details.paymentPromise}
				merchantId={merchantId}
				onRefresh={filters.handleRefresh}
			/>

			{!context.readOnly && (
				<CreateTransactionModal
					isOpen={modals.create.isOpen}
					onOpenChange={modals.create.close}
					merchantId={merchantId}
					onSuccess={modals.create.onSuccess}
					feesPromise={modals.create.feesPromise}
				/>
			)}
		</div>
	);
}
