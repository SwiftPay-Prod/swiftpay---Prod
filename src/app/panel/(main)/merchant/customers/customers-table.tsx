'use client';

import { useMemo } from 'react';
import { Tooltip, Dropdown, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Delete02Icon,
	MapPinIcon,
	MoreHorizontalCircle01Icon,
	PencilEdit01Icon,
	UserGroupIcon,
	ViewIcon,
	Wallet01Icon,
	UserRemove01Icon,
} from '@hugeicons/core-free-icons';
import {
	customerStatusParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmailLink, PhoneLink, DocumentDisplay } from '@/components/ui/data-links';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { CustomerDetailsModal } from './modals/customer-details-modal';
import { DeleteCustomerModal } from './modals/delete-customer-modal';
import { useCustomersTable } from './use-customers-table';
import { CustomerStatus } from '@/types/enums';
import type { MinimalCustomer, CustomerAddressData } from '@/types/merchant/customers';

function formatAddressSummary(address: CustomerAddressData | null): string | null {
	if (!address) return null;
	const parts = [address.street, address.number, address.neighborhood, address.city, address.state].filter(Boolean);
	return parts.length > 0 ? parts.join(', ') : null;
}

interface CustomersTableProps {
	merchantId: string;
	readOnly?: boolean;
}

interface ColumnsConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (customer: MinimalCustomer) => void;
	readOnly: boolean;
}

const statusOptions = parseToFilterOptions(customerStatusParse, 'Todos os status');

function getColumns(config: ColumnsConfig): DataTableColumn<MinimalCustomer>[] {
	const { onView, onEdit, onDelete, readOnly } = config;

	return [
		{
			key: 'name',
			header: 'Cliente',
			render: (customer) => (
				<div className="flex flex-col">
					<span className="font-bold text-sm text-white truncate">{customer.name}</span>
					<EmailLink email={customer.email} className="text-xs text-white/50" />
				</div>
			),
		},
		{
			key: 'document',
			header: 'Documento',
			render: (customer) => <DocumentDisplay document={customer.document} className="text-sm text-white/70" />,
		},
		{
			key: 'phone',
			header: 'Telefone',
			render: (customer) => <PhoneLink phone={customer.phone} className="text-sm text-white/70" />,
		},
		{
			key: 'address',
			header: 'Localização',
			render: (customer) => {
				const addressSummary = formatAddressSummary(customer.address);
				if (!addressSummary) {
					return <span className="text-white/40">—</span>;
				}
				return (
					<div className="flex items-center gap-1.5 text-sm text-white/70">
						<Icon icon={MapPinIcon} className="icon-xs text-white/40 shrink-0" />
						<span>{addressSummary}</span>
					</div>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (customer) => {
				const statusParsed = customerStatusParse[customer.status];
				return <RevolutStatusBadge status={customer.status} label={statusParsed?.label} />;
			},
		},
		{
			key: 'paymentsCount',
			header: 'Cobranças',
			align: 'center',
			render: (customer) => <span className="text-sm font-mono text-white/70">{customer.paymentsCount}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (customer) => <span className="text-sm font-mono text-white/50">{formatDate(customer.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (customer) => {
				if (readOnly) return null;

				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => onView(customer.id)}
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
							<Dropdown.Popover className="min-w-48 bg-card border border-white/12 rounded-xl text-whitexl">
								<Dropdown.Menu aria-label="Ações do cliente">
									<Dropdown.Item id="edit" textValue="Editar cliente" className="text-link hover:bg-white/10" onPress={() => onEdit(customer.id)}>
										<Icon icon={PencilEdit01Icon} className="icon-xs text-link" />
										Editar cliente
									</Dropdown.Item>
									<Dropdown.Item id="delete" textValue="Excluir cliente" className="text-danger hover:bg-white/10" onPress={() => onDelete(customer)}>
										<Icon icon={Delete02Icon} className="icon-xs text-danger" />
										Excluir cliente
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					</div>
				);
			},
		},
	];
}

function renderMobileCustomerCard(
	customer: MinimalCustomer,
	_index: number,
	openActions?: () => void,
) {
	const statusParsed = customerStatusParse[customer.status];

	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-card p-4 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<span className="font-bold text-sm text-white truncate block">{customer.name ?? 'Sem nome'}</span>
					{customer.email && <p className="mt-0.5 text-xs text-white/50 truncate">{customer.email}</p>}
				</div>
				<RevolutStatusBadge status={customer.status} label={statusParsed?.label} />
			</div>
			{customer.document && (
				<div className="mt-1.5">
					<DocumentDisplay document={customer.document} className="text-sm text-white/50" />
				</div>
			)}
			{customer.phone && <p className="mt-0.5 text-xs text-white/50">{customer.phone}</p>}
			<div className="mt-2 flex items-center justify-between gap-3">
				<span className="text-xs text-white/50 font-mono">{customer.paymentsCount} cobranças</span>
				<span className="text-xs text-white/50 font-mono">{formatDate(customer.createdAt)}</span>
			</div>
		</div>
	);
}

export function CustomersTable({ merchantId, readOnly = false }: CustomersTableProps) {
	const { data, filters, modals, actions, context } = useCustomersTable({ merchantId, readOnly });

	const columns = getColumns({
		onView: modals.details.open,
		onEdit: actions.editCustomer,
		onDelete: modals.delete.open,
		readOnly: context.readOnly,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				placeholder="Buscar por nome, email ou documento..."
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

	const customers = data.customers.items;
	const activeCount = customers.filter((item) => item.status === CustomerStatus.Active).length;
	const totalCharges = customers.reduce((sum, item) => sum + item.paymentsCount, 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={UserGroupIcon} className="icon-sm" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Clientes</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Gerencie os clientes cadastrados da sua organização</p>
				</div>

				{!readOnly && (
					<button
						type="button"
						onClick={actions.createCustomer}
						className="button-primary cursor-pointer text-xs"
					>
						<Icon icon={AddCircleIcon} className="icon-xs" />
						<span>Novo Cliente</span>
					</button>
				)}
			</div>

			{/* 4-Tile KPI Grid */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{/* Total */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Total</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={UserGroupIcon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={customers.length} />
					</span>
				</div>

				{/* Ativos */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Ativos</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
							<Icon icon={ViewIcon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-success tracking-tight tabular-nums">
						<AnimatedNumber value={activeCount} />
					</span>
				</div>

				{/* Inativos */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Inativos</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={UserRemove01Icon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={customers.length - activeCount} />
					</span>
				</div>

				{/* Cobranças */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Cobranças</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={totalCharges} />
					</span>
				</div>
			</div>

			{/* Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.customers.items}
					keyExtractor={(customer) => customer.id}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum cliente encontrado"
					minWidth="min-w-200"
					renderMobileCard={renderMobileCustomerCard}
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
						totalItems: data.customers.totalItems,
						totalPages: data.customers.totalPages,
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
			</div>

			<CustomerDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				merchantId={context.merchantId}
				customerId={modals.details.customerId}
				customerPromise={modals.details.customerPromise}
				paymentsPromise={modals.details.paymentsPromise}
				onPaymentsPageChange={modals.details.loadPaymentsPage}
			/>

			<DeleteCustomerModal
				isOpen={modals.delete.isOpen}
				onOpenChange={modals.delete.close}
				merchantId={context.merchantId}
				customer={modals.delete.customer}
				onSuccess={modals.delete.onSuccess}
			/>
		</div>
	);
}
