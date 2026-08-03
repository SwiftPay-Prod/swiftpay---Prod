'use client';

import { Button, Chip, Tooltip, Dropdown, toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AddCircleIcon, CreditCardIcon, PlayCircleIcon, ViewIcon, SentIcon, MoreHorizontalCircle01Icon, SourceCodeSquareIcon, Link02Icon, ShoppingCartCheck01Icon, Copy01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import {
	paymentStatusParse,
	paymentMethodParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
	simulatePaymentActionOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { MerchantTransactionDetailsModal } from './modals/merchant-transaction-details-modal';
import { CreateTransactionModal } from './modals/create-transaction-modal';
import { EmailLink, PhoneLink } from '@/components/ui/data-links';
import { SimulatePaymentAction } from '@/types/enums';
import type { MinimalPayment } from '@/types/merchant/payments';
import { PaymentRequestSource } from '@/types/enums';
import type { DataTableColumn } from '@/components/ui/data-table';
import { useTransactionsTable } from './use-transactions-table';

interface TransactionsTableProps {
	merchantId: string;
	readOnly?: boolean;
}

const statusOptions = parseToFilterOptions(paymentStatusParse, 'Todos os status');
const methodOptions = parseToFilterOptions(paymentMethodParse, 'Todos os métodos');

interface ColumnConfig {
	onView: (id: string) => void;
	onCopyVisualizationLink: (url: string) => Promise<void>;
	onSimulate: (id: string, action: SimulatePaymentAction) => void;
	onResendWebhook: (payment: MinimalPayment) => void;
	simulatingId: string | null;
	resendingWebhookId: string | null;
	canSimulate: (payment: MinimalPayment) => boolean;
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
	const { onView, onCopyVisualizationLink, onSimulate, onResendWebhook, simulatingId, canSimulate, canResendWebhook } = config;

	return [
		{
			key: 'customerName',
			header: 'Cliente',
			render: (payment) => (
				<span className="text-sm truncate max-w-40">
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
							<EmailLink email={payment.customer!.email!} className="text-sm" />
							<PhoneLink phone={payment.customer!.phone!} className="text-sm" />
						</div>
					);
				}

				if (hasEmail) {
					return <EmailLink email={payment.customer!.email!} className="text-sm" />;
				}

				if (hasPhone) {
					return <PhoneLink phone={payment.customer!.phone!} className="text-sm" />;
				}

				return <span className="text-sm text-muted-foreground">-</span>;
			},
		},
		{
			key: 'amount',
			header: 'Valor',
			render: (payment) => (
				<div className="flex flex-col">
					<span className="font-medium">{formatCurrency(payment.amount)}</span>
					<span className="text-xs text-muted-foreground">Taxa: {formatCurrency(payment.fee)}</span>
				</div>
			),
		},
		{
			key: 'netAmount',
			header: 'Líquido',
			render: (payment) => (
				<span className="font-medium text-success">{formatCurrency(payment.netAmount)}</span>
			),
		},
		{
			key: 'method',
			header: 'Método',
			render: (payment) => {
				const methodParse = paymentMethodParse[payment.method];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(methodParse.color)} size="sm" className="gap-1">
						{methodParse.icon}
						{methodParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (payment) => {
				const statusParsed = paymentStatusParse[payment.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'origin',
			header: 'Origem',
			sortable: false,
			render: (payment) => {
				const source = getPaymentRequestSource(payment);
				const sourceBadge = getRequestSourceBadge(source);

				return (
					<div className="flex flex-col">
						<Chip variant="soft" color={mapParseColorToChipColor(sourceBadge.color)} size="sm" className="gap-1 w-fit">
							<Icon icon={sourceBadge.icon} className="icon-xs" />
							{sourceBadge.label}
						</Chip>
					</div>
				);
			},
		},
		{
			key: 'payer',
			header: 'Pagador',
			sortable: false,
			render: (payment) => {
				if (!payment.pix?.payerName) {
					return <span className="text-sm text-muted-foreground">-</span>;
				}
				return (
					<div className="flex flex-col">
						<span className="text-sm truncate max-w-40">{payment.pix.payerName}</span>
						{payment.pix.payerBank && (
							<span className="text-xs text-muted-foreground">{payment.pix.payerBank}</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (payment) => (
				<span className="text-sm text-muted-foreground">{formatDate(payment.createdAt)}</span>
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
						<Button isIconOnly variant="tertiary" onPress={() => onView(payment.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					{payment.transactionVisualizationUrl && (
						<Tooltip>
							<Button
								isIconOnly
								variant="tertiary"
								onPress={async () => {
									await onCopyVisualizationLink(payment.transactionVisualizationUrl!);
								}}
							>
								<Icon icon={Copy01Icon} className="icon-sm" />
								<Tooltip.Content>Copiar link de visualização</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
					{(canResendWebhook(payment) || canSimulate(payment)) && (
						<Dropdown>
							<Tooltip>
								<Button isIconOnly variant="tertiary" aria-label="Mais ações" isPending={simulatingId === payment.id}>
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
									<Tooltip.Content>Mais ações</Tooltip.Content>
								</Button>
							</Tooltip>
							<Dropdown.Popover className="min-w-48">
								<Dropdown.Menu aria-label="Ações da transação">
									{canResendWebhook(payment) && (
										<Dropdown.Item id="resend-webhook" textValue="Reenviar webhook" className="text-secondary" onPress={() => onResendWebhook(payment)}>
											<Icon icon={SentIcon} className="icon-xs text-secondary" />
											Reenviar webhook
										</Dropdown.Item>
									)}
									{canSimulate(payment) && simulatePaymentActionOptions.map((item) => {
										const colorClass = {
											success: 'text-success',
											warning: 'text-warning',
											danger: 'text-danger',
											secondary: 'text-secondary',
											accent: 'text-accent',
											default: 'text-foreground',
										}[item.color] || 'text-foreground';

										return (
											<Dropdown.Item key={item.value} id={item.value} textValue={item.label} className={colorClass} onPress={() => onSimulate(payment.id, item.value)}>
												<Icon icon={PlayCircleIcon} className="icon-xs" />
												{item.label}
											</Dropdown.Item>
										);
									})}
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
	const statusParsed = paymentStatusParse[payment.status];
	const methodParsed = paymentMethodParse[payment.method];

	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<span className="font-semibold text-sm truncate block">{payment.customer?.name ?? 'Cliente não informado'}</span>
					<p className="mt-0.5 text-xs text-muted-foreground truncate">
						{methodParsed.label} • {formatDate(payment.createdAt)}
					</p>
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1 shrink-0">
					{statusParsed.label}
				</Chip>
			</div>

			{(payment.customer?.email || payment.customer?.phone) && (
				<div className="mt-2 flex flex-col gap-0.5">
					{payment.customer.email && <EmailLink email={payment.customer.email} className="text-xs" />}
					{payment.customer.phone && <PhoneLink phone={payment.customer.phone} className="text-xs" />}
				</div>
			)}

			<div className="mt-2">
				<div className="grid grid-cols-2 gap-3">
					<div className="min-w-0">
						<p className="text-xs text-muted-foreground">Valor</p>
						<p className="mt-1 text-sm font-semibold truncate">{formatCurrency(payment.amount)}</p>
						<p className="text-xs text-muted-foreground">Taxa: {formatCurrency(payment.fee)}</p>
					</div>
					<div className="min-w-0">
						<p className="text-xs text-muted-foreground">Líquido</p>
						<p className="mt-1 text-sm font-semibold text-success truncate">{formatCurrency(payment.netAmount)}</p>
					</div>
				</div>
				<div className="mt-2 border-t border-divider pt-2">
					<p className="text-xs text-muted-foreground">Origem</p>
					{(() => {
						const source = getPaymentRequestSource(payment);
						const sourceBadge = getRequestSourceBadge(source);

						return (
							<>
								<div className="mt-1">
									<Chip variant="soft" color={mapParseColorToChipColor(sourceBadge.color)} size="sm" className="gap-1">
										<Icon icon={sourceBadge.icon} className="icon-xs" />
										{sourceBadge.label}
									</Chip>
								</div>
								{source === PaymentRequestSource.Checkout && (
									<p className="text-xs text-muted-foreground truncate">{payment.checkoutName ?? 'Checkout não identificado'}</p>
								)}
							</>
						);
					})()}
				</div>
				{payment.pix?.payerName && (
					<div className="mt-2 border-t border-divider pt-2">
						<p className="text-xs text-muted-foreground">Pagador</p>
						<p className="mt-1 text-sm truncate">{payment.pix.payerName}</p>
						{payment.pix.payerBank && (
							<p className="text-xs text-muted-foreground truncate">{payment.pix.payerBank}</p>
						)}
					</div>
				)}
			</div>
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
		onSimulate: actions.handleSimulate,
		onResendWebhook: actions.handleResendWebhook,
		simulatingId: actions.simulatingPaymentId,
		resendingWebhookId: actions.resendingWebhookId,
		canSimulate: actions.canSimulate,
		canResendWebhook: actions.canResendWebhook,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="ID, cliente, txId, endToEnd ou descricao"
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
				label="Método"
				value={filters.values.method}
				options={methodOptions}
				onChange={filters.handleMethodChange}
				allLabel="Todos os métodos"
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={CreditCardIcon} className="icon-md text-accent-foreground" />}
				title="Transações"
				description="Gerencie as transações da sua organização"
				action={context.readOnly ? undefined : {
					label: 'Nova Transação',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: modals.create.open,
				}}
			/>

			<DataTable
				columns={columns}
				data={data.payments.items}
				keyExtractor={(payment) => payment.id}
				renderMobileCard={(payment, index, openActions) =>
					renderMobileTransactionCard(payment, index, openActions)
				}
				mobileActions={{
					title: (payment) => payment.customer?.name ?? 'Cliente não informado',
					subtitle: (payment) => formatCurrency(payment.amount),
					renderActions: (payment, close) => (
						<div className="flex flex-col gap-2">
							<Button
								variant="secondary"
								className="w-full justify-start"
								onPress={() => { actions.openDetails(payment.id); close(); }}
							>
								<Icon icon={ViewIcon} className="icon-sm" />
								Ver detalhes
							</Button>
							{payment.transactionVisualizationUrl && (
								<Button
									variant="secondary"
									className="w-full justify-start"
									onPress={async () => {
										await handleCopyVisualizationLink(payment.transactionVisualizationUrl!);
										close();
									}}
								>
									<Icon icon={Copy01Icon} className="icon-sm" />
									Copiar link de visualização
								</Button>
							)}
							{actions.canResendWebhook(payment) && (
								<Button
									variant="secondary"
									className="w-full justify-start"
									isPending={actions.resendingWebhookId === payment.id}
									onPress={() => { actions.handleResendWebhook(payment); close(); }}
								>
									<Icon icon={SentIcon} className="icon-sm" />
									Reenviar webhook
								</Button>
							)}
							{actions.canSimulate(payment) && (
								<>
									<div className="h-px bg-divider my-1" />
									<p className="text-xs text-muted px-1">Simular ação</p>
									{simulatePaymentActionOptions.map((item) => (
										<Button
											key={item.value}
											variant="secondary"
											className="w-full justify-start"
											isPending={actions.simulatingPaymentId === payment.id}
											onPress={() => { actions.handleSimulate(payment.id, item.value); close(); }}
										>
											{item.icon}
											{item.label}
										</Button>
									))}
								</>
							)}
						</div>
					),
				}}
				isLoading={data.isLoading}
				skeletonRows={data.pageSizeValue}
				emptyMessage="Nenhuma transação encontrada"
				minWidth="min-w-250"
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.handleClearFilters,
					onRefresh: filters.handleRefresh,
					isRefreshing: data.isRefreshing,
				}}
				pagination={{
					page: filters.values.page,
					pageSize: data.pageSizeValue,
					totalItems: data.payments.totalItems,
					totalPages: data.payments.totalPages,
					onPageChange: filters.handlePageChange,
					sortBy: filters.values.sortBy,
					sortOrder: filters.values.sortOrder,
					onSortChange: (sortBy, sortOrder) => {
						filters.updateFilter('sortBy', sortBy);
						filters.updateFilter('sortOrder', sortOrder);
						filters.updateFilter('page', 1);
					},
					isNavigating: data.isLoading,
				}}
			/>

			<MerchantTransactionDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				paymentPromise={modals.details.paymentPromise}
				merchantId={context.merchantId}
				onRefresh={filters.handleRefresh}
			/>

			<CreateTransactionModal
				isOpen={modals.create.isOpen}
				onOpenChange={modals.create.close}
				merchantId={context.merchantId}
				onSuccess={modals.create.onSuccess}
				feesPromise={modals.create.feesPromise}
			/>
		</div>
	);
}

