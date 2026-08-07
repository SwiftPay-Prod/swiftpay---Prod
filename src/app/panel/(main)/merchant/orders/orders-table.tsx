'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Chip, Tooltip, Dropdown } from '@heroui/react';
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
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import {
	orderStatusParse,
	orderFulfillmentStatusParse,
	orderFulfillmentStatusOptions,
	mapParseColorToChipColor,
	mapParseColorToTextClass,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { OrderDetailsModal } from './modals/order-details-modal';
import { MerchantTransactionDetailsModal } from '../transactions/modals/merchant-transaction-details-modal';
import { getMerchantPayment } from '@/app/actions/merchant/payments';
import { useOrdersTable, type OrdersTableFilters } from './use-orders-table';
import type { MinimalOrder } from '@/types/merchant/orders';
import type { DataTableColumn } from '@/components/ui/data-table';
import { OrderStatus } from '@/types/enums';
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
			render: (order) => <span className="text-sm font-mono font-medium text-accent">{order.orderNumber}</span>,
		},
		{
			key: 'customerName',
			header: 'Cliente',
			render: (order) => <span className="text-sm truncate max-w-40">{order.customer?.name ?? '-'}</span>,
		},
		{
			key: 'totalAmount',
			header: 'Total',
			render: (order) => (
				<div className="flex flex-col">
					<span className="font-medium">{formatCurrency(order.totalAmount)}</span>
					{order.discountAmount > 0 && (
						<span className="text-xs text-success">-{formatCurrency(order.discountAmount)} desconto</span>
					)}
				</div>
			),
		},
		{
			key: 'itemCount',
			header: 'Items',
			render: (order) => (
				<span className="text-sm">
					{order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (order) => {
				const statusParsed = orderStatusParse[order.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'fulfillmentStatus',
			header: 'Entrega',
			render: (order) => {
				const fulfillmentParsed = orderFulfillmentStatusParse[order.fulfillmentStatus];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(fulfillmentParsed.color)} size="sm" className="gap-1">
						{fulfillmentParsed.icon}
						{fulfillmentParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (order) => <span className="text-sm text-muted">{formatDate(order.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (order) => {
				const fulfillmentParsed = orderFulfillmentStatusParse[order.fulfillmentStatus];
				const triggerColorClass = mapParseColorToTextClass(fulfillmentParsed.color);
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<Button isIconOnly variant="tertiary" onPress={() => onView(order.id)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Ver detalhes</Tooltip.Content>
							</Button>
						</Tooltip>
						<Dropdown>
							<Button isIconOnly variant="tertiary" aria-label="Alterar status de entrega" className={triggerColorClass}>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
							</Button>
							<Dropdown.Popover className="min-w-44">
								<Dropdown.Menu
									aria-label="Alterar status de entrega"
									onAction={(key) => {
										const validStatuses = Object.keys(orderFulfillmentStatusParse);
										if (!validStatuses.includes(key as string)) return;
										const selected = key as OrderFulfillmentStatus;
										if (selected !== order.fulfillmentStatus) {
											onChangeFulfillment(order.id, selected);
										}
									}}
								>
									{orderFulfillmentStatusOptions.map((option) => (
										<Dropdown.Item
											key={option.value}
											id={option.value}
											textValue={option.label}
											isDisabled={order.fulfillmentStatus === option.value}
										>
											<div className={`flex items-center gap-2 ${mapParseColorToTextClass(option.color)}`}>
												{option.icon}
												<span>{option.label}</span>
											</div>
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
	const statusParsed = orderStatusParse[order.status];
	const fulfillmentParsed = orderFulfillmentStatusParse[order.fulfillmentStatus];

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
			<div className="flex flex-col gap-2">
				<div className="flex items-start justify-between gap-2">
					<span className="font-mono font-medium text-accent">{order.orderNumber}</span>
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				</div>

				{order.customer?.name && (
					<span className="text-sm text-muted">{order.customer.name}</span>
				)}

				<div className="flex items-center gap-2">
					<span className="font-medium">{formatCurrency(order.totalAmount)}</span>
					{order.discountAmount > 0 && (
						<span className="text-xs text-success">-{formatCurrency(order.discountAmount)}</span>
					)}
				</div>

				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Chip variant="soft" color={mapParseColorToChipColor(fulfillmentParsed.color)} size="sm" className="gap-1">
							{fulfillmentParsed.icon}
							{fulfillmentParsed.label}
						</Chip>
						<span className="text-xs text-muted">{order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'}</span>
					</div>
					<span className="text-xs text-muted">{formatDate(order.createdAt)}</span>
				</div>
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={ShoppingCartCheck01Icon} className="icon-md text-accent-foreground" />}
				title="Pedidos"
				description="Gerencie os pedidos da sua organização"
				action={{
					label: 'Novo Pedido',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.goToNew,
				}}
			/>

			{(() => {
				const orders = data.orders.items;
				const completed = orders.filter((item) => item.status === OrderStatus.Completed).length;
				const totalItems = orders.reduce((sum, item) => sum + item.itemCount, 0);
				const totalValue = orders.reduce((sum, item) => sum + item.totalAmount, 0);

				const stats = useMemo(
					() =>
						[
							{
								label: 'Total',
								value: <AnimatedNumber value={orders.length} />,
								icon: <Icon icon={ShoppingCartCheck01Icon} className="icon-sm text-muted" />,
							},
							{
								label: 'Concluídos',
								value: <AnimatedNumber value={completed} />,
								icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />,
								accent: 'text-success',
							},
							{
								label: 'Itens',
								value: <AnimatedNumber value={totalItems} />,
								icon: <Icon icon={PackageIcon} className="icon-sm text-muted" />,
							},
							{
								label: 'Valor Total',
								value: <AnimatedCurrency value={totalValue} />,
								icon: <Icon icon={Wallet01Icon} className="icon-sm text-muted" />,
							},
						],
					[orders, completed, totalItems, totalValue]
				);

				return (
					<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
						{stats.map((item) => (
							<Card key={item.label} className="border border-border/80 bg-card">
								<Card.Content className="flex items-center gap-3 p-3">
									{item.icon}
									<div className="flex flex-col">
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{item.label}</span>
										<span className={`text-sm font-semibold tabular-nums ${item.accent ?? 'text-foreground'}`}>{item.value}</span>
									</div>
								</Card.Content>
							</Card>
						))}
					</div>
				);
			})()}

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
							<Button
								variant="secondary"
								className="w-full justify-start"
								onPress={() => { modals.details.open(order.id); close(); }}
							>
								<Icon icon={ViewIcon} className="icon-sm" />
								Ver detalhes
							</Button>
							<div className="h-px bg-divider my-1" />
							<p className="text-xs text-muted px-1">Alterar status de entrega</p>
							{orderFulfillmentStatusOptions.map((option) => (
								<Button
									key={option.value}
									variant="secondary"
									className="w-full justify-start"
									isDisabled={order.fulfillmentStatus === option.value}
									onPress={() => { actions.changeFulfillment(order.id, option.value); close(); }}
								>
									{option.icon}
									{option.label}
								</Button>
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

