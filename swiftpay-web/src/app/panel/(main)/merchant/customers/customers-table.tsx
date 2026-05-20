'use client';

import { Button, Chip, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Delete02Icon,
	MapPinIcon,
	MoreHorizontalCircle01Icon,
	PencilEdit01Icon,
	UserGroupIcon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import type { MinimalCustomer, CustomerAddressData } from '@/types/merchant/customers';
import {
	customerStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmailLink, PhoneLink, DocumentDisplay } from '@/components/ui/data-links';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { CustomerDetailsModal } from './modals/customer-details-modal';
import { DeleteCustomerModal } from './modals/delete-customer-modal';
import { useCustomersTable } from './use-customers-table';

function formatAddressSummary(address: CustomerAddressData | null): string | null {
	if (!address) return null;
	const parts: string[] = [];
	if (address.city) parts.push(address.city);
	if (address.state) parts.push(address.state);
	return parts.length > 0 ? parts.join(', ') : null;
}

interface CustomersTableProps {
	merchantId: string;
	readOnly?: boolean;
}

interface ColumnsConfig {
	onView: (customerId: string) => void;
	onEdit: (customerId: string) => void;
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
					<span className="font-medium">{customer.name}</span>
					<EmailLink email={customer.email} className="text-xs" />
				</div>
			),
		},
		{
			key: 'document',
			header: 'Documento',
			render: (customer) => <DocumentDisplay document={customer.document} className="text-sm" />,
		},
		{
			key: 'phone',
			header: 'Telefone',
			render: (customer) => <PhoneLink phone={customer.phone} className="text-sm" />,
		},
		{
			key: 'address',
			header: 'Localização',
			render: (customer) => {
				const addressSummary = formatAddressSummary(customer.address);
				if (!addressSummary) {
					return <span className="text-muted">—</span>;
				}
				return (
					<div className="flex items-center gap-1.5 text-sm">
						<Icon icon={MapPinIcon} className="icon-xs text-muted shrink-0" />
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
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'paymentsCount',
			header: 'Cobranças',
			align: 'center',
			render: (customer) => <span className="text-sm text-muted">{customer.paymentsCount}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (customer) => <span className="text-sm text-muted">{formatDate(customer.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (customer) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(customer.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					{!readOnly && (
						<Dropdown>
							<Tooltip>
								<Button isIconOnly variant="tertiary" aria-label="Mais ações">
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
									<Tooltip.Content>Mais ações</Tooltip.Content>
								</Button>
							</Tooltip>
							<Dropdown.Popover className="min-w-44">
								<Dropdown.Menu aria-label="Ações do cliente">
									<Dropdown.Item id="edit" textValue="Editar cliente" className="text-accent" onPress={() => onEdit(customer.id)}>
										<Icon icon={PencilEdit01Icon} className="icon-xs text-accent" />
										Editar cliente
									</Dropdown.Item>
									<Dropdown.Item id="delete" textValue="Excluir cliente" className="text-danger" onPress={() => onDelete(customer)}>
										<Icon icon={Delete02Icon} className="icon-xs text-danger" />
										Excluir cliente
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

function renderMobileCustomerCard(
	customer: MinimalCustomer,
	_index: number,
	openActions?: () => void,
) {
	const statusParsed = customerStatusParse[customer.status];

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
					<span className="font-semibold text-sm truncate block">{customer.name ?? 'Sem nome'}</span>
					{customer.email && <p className="mt-0.5 text-xs text-muted truncate">{customer.email}</p>}
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="shrink-0">
					{statusParsed.label}
				</Chip>
			</div>
			{customer.document && (
				<div className="mt-1.5">
					<DocumentDisplay document={customer.document} className="text-sm text-muted" />
				</div>
			)}
			{customer.phone && <p className="mt-0.5 text-xs text-muted">{customer.phone}</p>}
			<div className="mt-2 flex items-center justify-between gap-3">
				<span className="text-xs text-muted">{customer.paymentsCount} cobranças</span>
				<span className="text-xs text-muted">{formatDate(customer.createdAt)}</span>
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={UserGroupIcon} className="icon-md text-accent-foreground" />}
				title="Clientes"
				description="Gerencie os clientes cadastrados da sua organização"
				action={context.readOnly ? undefined : {
					label: 'Novo Cliente',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.createCustomer,
				}}
			/>

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

