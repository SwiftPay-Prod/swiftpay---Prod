'use client';

import { useMemo, useState } from 'react';
import { Tooltip, Dropdown, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	ShoppingCartCheck01Icon,
	ViewIcon,
	AddCircleIcon,
	MoreHorizontalCircle01Icon,
	CheckmarkCircle02Icon,
	PackageIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import {
	orderStatusParse,
	orderFulfillmentStatusParse,
	orderFulfillmentStatusOptions,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { OrderDetailsModal } from './modals/order-details-modal';
import { MerchantTransactionDetailsModal } from '../transactions/modals/merchant-transaction-details-modal';
import { getMerchantPayment } from '@/app/actions/merchant/payments';
import { useOrdersTable, type OrdersTableFilters } from './use-orders-table';
import { OrderStatus } from '@/types/enums';
import type { MinimalOrder } from '@/types/merchant/orders';
import type { OrderFulfillmentStatus } from '@/types/enums';

interface OrdersTableProps {
	merchantId: string;
	initialFilters: OrdersTableFilters;
}

const statusOptions = parseToFilterOptions(orderStatusParse, 'Todos os status');
const fulfillmentOptions = parseToFilterOptions(orderFulfillmentStatusParse, 'Todos os status');

interface ColumnConfig {
	onView: (id: string) => void;
	onChangeFulfillment: (orderId: string, status: OrderFulfillmentStatus) => void;
}

function getColumns(config: ColumnConfig): DataTableColumn<MinimalOrder>[] {
	const { onView, onChangeFulfillment } = config;

	return [
		{
			key: 'orderNumber',
			header: 'Pedido',
			render: (order) => (
				<div className="flex flex-col">
					<span className="font-mono font-bold text-sm text-white">{order.orderNumber}</span>
					<span className="text-xs text-white/50">{order.customer?.name ?? '—'}</span>
				</div>
			),
		},
		{
			key: 'items',
			header: 'Itens',
			align: 'center',
			render: (order) => <span className="text-sm font-mono text-white/70">{order.itemCount}</span>,
		},
		{
			key: 'totalAmount',
			header: 'Valor Total PIX',
			render: (order) => (
				<span className="font-bold font-mono text-white text-sm tabular-nums">{formatCurrency(order.totalAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (order) => (
				<RevolutStatusBadge status={order.status} label={orderStatusParse[order.status]?.label} />
			),
		},
		{
			key: 'fulfillment',
			header: 'Entrega',
			render: (order) => (
				<RevolutStatusBadge status={order.fulfillmentStatus} label={orderFulfillmentStatusParse[order.fulfillmentStatus]?.label} />
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (order) => <span className="text-sm font-mono text-white/50">{formatDate(order.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (order) => {
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => onView(order.id)}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={ViewIcon} className="icon-sm" />
							</button>
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Tooltip>
						<Dropdown>
							<Button
								isIconOnly
								aria-label="Mais ações"
								className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
							</Button>
							<Dropdown.Popover className="min-w-48 bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
								<Dropdown.Menu aria-label="Ações do pedido">
									{orderFulfillmentStatusOptions.map((option) => (
										<Dropdown.Item
											key={option.value}
											id={`fulfillment-${option.value}`}
											textValue={option.label}
											className="text-white hover:bg-white/10"
											onPress={() => onChangeFulfillment(order.id, option.value as OrderFulfillmentStatus)}
										>
											{option.icon}
											{option.label}
										</Dropdown.Item>
									))}
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					</div>
				);
			},
		},
	];
}

function renderMobileOrderCard(order: MinimalOrder, _index: number, openActions?: () => void) {
	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-[#16181a] p-4 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<span className="font-mono font-bold text-sm text-white truncate block">{order.orderNumber}</span>
					<span className="text-xs text-white/50 truncate">{order.customer?.name ?? 'Sem cliente'}</span>
				</div>
				<RevolutStatusBadge status={order.status} label={orderStatusParse[order.status]?.label} />
			</div>
			<div className="mt-2 grid grid-cols-2 gap-2">
				<div>
					<span className="text-[10px] uppercase tracking-wider text-white/40">Itens</span>
					<p className="text-sm font-bold text-white font-mono">{order.itemCount}</p>
				</div>
				<div>
					<span className="text-[10px] uppercase tracking-wider text-white/40">Total</span>
					<p className="text-sm font-bold text-white font-mono tabular-nums">{formatCurrency(order.totalAmount)}</p>
				</div>
			</div>
			<div className="mt-2 flex items-center justify-between">
				<span className="text-xs text-white/50 font-mono">{formatDate(order.createdAt)}</span>
				<RevolutStatusBadge status={order.fulfillmentStatus} label={orderFulfillmentStatusParse[order.fulfillmentStatus]?.label} size="sm" />
			</div>
		</div>
	);
}

export function OrdersTable({ merchantId, initialFilters }: OrdersTableProps) {
	const { data, filters, modals, actions } = useOrdersTable({
		merchantId,
		initialFilters,
	});

	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
	const [transactionPromise, setTransactionPromise] = useState<ReturnType<typeof getMerchantPayment> | null>(null);

	function handleViewTransaction(paymentId: string) {
		setTransactionPromise(getMerchantPayment(merchantId, paymentId));
		setIsTransactionModalOpen(true);
	}

	function handleCloseTransactionModal() {
		setIsTransactionModalOpen(false);
		setTransactionPromise(null);
	}

	const columns = getColumns({
		onView: modals.details.open,
		onChangeFulfillment: actions.changeFulfillment,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Pedido, cliente ou pagamento"
				value={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value.trim() === '' ? null : value })}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(key) => filters.update({ status: key === 'all' ? null : (key as OrderStatus) })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Entrega"
				value={filters.values.fulfillmentStatus ?? 'all'}
				options={fulfillmentOptions}
				onChange={(key) => filters.update({ fulfillmentStatus: key === 'all' ? null : (key as OrderFulfillmentStatus) })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Por página"
				value={String(filters.values.pageSize)}
				options={pageSizeFilterOptions}
				onChange={(key) => filters.update({ pageSize: Number(key) })}
				showChips={false}
			/>
		</>
	);

	const orders = data.orders.items;
	const completed = orders.filter((item) => item.status === OrderStatus.Completed).length;
	const totalItems = orders.reduce((sum, item) => sum + item.itemCount, 0);
	const totalValue = orders.reduce((sum, item) => sum + item.totalAmount, 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={ShoppingCartCheck01Icon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Gestão de Pedidos</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Controle de vendas, checkout PIX e status de entrega da sua organização
					</p>
				</div>

				<button
					type="button"
					onClick={actions.goToNew}
					className="button-primary cursor-pointer text-xs"
				>
					<Icon icon={AddCircleIcon} className="icon-xs" />
					<span>+ Novo Pedido PIX</span>
				</button>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total de Pedidos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={ShoppingCartCheck01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={orders.length} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Pedidos registrados</p>
					</div>
				</div>

				{/* Concluídos */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Pedidos Concluídos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							<AnimatedNumber value={completed} />
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Liquidados via PIX</p>
					</div>
				</div>

				{/* Itens */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Itens Vendidos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={PackageIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalItems} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Unidades totais</p>
					</div>
				</div>

				{/* Valor Total */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Faturamento Total
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalValue}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Volume bruto dos pedidos</p>
					</div>
				</div>
			</div>

			{/* Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.orders.items}
					keyExtractor={(order) => order.id}
					isLoading={data.isLoading}
					skeletonRows={filters.values.pageSize}
					emptyMessage="Nenhum pedido encontrado"
					minWidth="min-w-200"
					renderMobileCard={renderMobileOrderCard}
					mobileActions={{
						title: (order) => order.orderNumber,
						subtitle: (order) => order.customer?.name ?? undefined,
						renderActions: (order, close) => (
							<div className="flex flex-col gap-2">
								<button
									type="button"
									className="w-full justify-start inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
									onClick={() => { modals.details.open(order.id); close(); }}
								>
									<Icon icon={ViewIcon} className="icon-sm" />
									Ver detalhes
								</button>
								<div className="h-px bg-white/10 my-1" />
								<p className="text-xs text-white/50 px-1">Alterar status de entrega</p>
								{orderFulfillmentStatusOptions.map((option) => (
									<button
										key={option.value}
										type="button"
										className="w-full justify-start inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
										disabled={order.fulfillmentStatus === option.value}
										onClick={() => { actions.changeFulfillment(order.id, option.value); close(); }}
									>
										{option.icon}
										{option.label}
									</button>
								))}
							</div>
						),
					}}
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.clear,
						onRefresh: filters.refresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: data.orders.page,
						pageSize: data.orders.pageSize,
						totalItems: data.orders.totalItems,
						totalPages: data.orders.totalPages,
						onPageChange: (page) => filters.update({ page }),
						sortBy: filters.values.sortBy,
						sortOrder: filters.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
						isNavigating: data.isLoading,
					}}
				/>
			</div>

			<OrderDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				orderPromise={modals.details.orderPromise}
				onViewTransaction={handleViewTransaction}
			/>

			<MerchantTransactionDetailsModal
				isOpen={isTransactionModalOpen}
				onOpenChange={(open) => !open && handleCloseTransactionModal()}
				paymentPromise={transactionPromise}
				merchantId={merchantId}
			/>
		</div>
	);
}
