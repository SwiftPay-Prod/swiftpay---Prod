'use client';

import { Button, Chip, Avatar, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Archive01Icon,
	CancelCircleIcon,
	Delete02Icon,
	FileCloudIcon,
	MoreHorizontalCircle01Icon,
	Key01Icon,
	Mail01Icon,
	PackageIcon,
	PencilEdit01Icon,
	Tag01Icon,
	ViewIcon,
	InfinityCircleIcon,
	CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { productStatusParse, mapParseColorToChipColor, parseToFilterOptions, pageSizeFilterOptions } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { ComboboxFilter } from '@/components/ui/combobox-filter';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ProductDetailsModal } from '@/components/merchant/products/modals/product-details-modal';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import { CategoriesModal } from '@/components/merchant/products/modals';
import { useDigitalProductsTable, type DigitalProductsTableFilters } from './use-digital-products-table';
import type { MinimalProductData } from '@/types/merchant/products';
import type { DataTableColumn } from '@/components/ui/data-table';
import { ProductStatus } from '@/types/enums';

interface DigitalProductsTableProps {
	merchantId: string;
	initialFilters: DigitalProductsTableFilters;
}

const statusOptions = parseToFilterOptions(productStatusParse, 'Todos os status');

interface ColumnConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, name: string) => void;
	onChangeStatus: (id: string, status: ProductStatus) => void;
	statusUpdatingId: string | null;
}

function getColumns(config: ColumnConfig): DataTableColumn<MinimalProductData>[] {
	const { onView, onEdit, onDelete } = config;
	const { onChangeStatus, statusUpdatingId } = config;

	function handleAction(action: () => void) {
		openWithDelay(action, DEFAULT_MODAL_DELAY);
	}

	return [
		{
			key: 'image',
			header: '',
			width: 'w-16',
			render: (product) => (
				<Avatar size="md">
					{product.imageUrls?.[0] || product.imageUrl ? (
						<Avatar.Image src={product.imageUrls?.[0] ?? product.imageUrl ?? ''} alt={product.name} />
					) : (
						<Avatar.Fallback>
							<Icon icon={PackageIcon} className="icon-sm" />
						</Avatar.Fallback>
					)}
				</Avatar>
			),
		},
		{
			key: 'name',
			header: 'Produto',
			render: (product) => (
				<div className="flex flex-col">
					<span className="font-medium truncate max-w-60">{product.name}</span>
					{product.externalId && <span className="text-xs text-muted truncate max-w-60">ID: {product.externalId}</span>}
				</div>
			),
		},
		{
			key: 'price',
			header: 'Preço',
			render: (product) => <span className="font-medium">{product.price ? formatCurrency(product.price) : '-'}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (product) => {
				const statusParsed = productStatusParse[product.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'digitalItems',
			header: 'Itens Digitais',
			render: (product) => (
				<div className="flex items-center gap-2">
					<Icon icon={Key01Icon} className="icon-md text-muted" />
					{product.isUnlimitedDigitalStock ? (
						<Tooltip>
							<span className="flex items-center gap-1 text-sm text-accent">
								<Icon icon={InfinityCircleIcon} className="icon-md" />
								Ilimitado
							</span>
							<Tooltip.Content>Mesmo item entregue para todos os compradores</Tooltip.Content>
						</Tooltip>
					) : (
						<span className="text-sm">{product.digitalItemsCount}</span>
					)}
				</div>
			),
		},
		{
			key: 'categories',
			header: 'Categorias',
			render: (product) => <span className="text-sm">{product.categoryCount}</span>,
		},
		{
			key: 'variants',
			header: 'Variantes',
			render: (product) => <span className="text-sm">{product.variantCount}</span>,
		},
		{
			key: 'coupons',
			header: 'Cupons',
			render: (product) => <span className="text-sm">{product.couponCount}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (product) => <span className="text-sm text-muted">{formatDate(product.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (product) => {
				const canActivate = product.status === ProductStatus.Inactive || product.status === ProductStatus.Archived;
				const canInactivate = product.status === ProductStatus.Active;
				const canArchive = product.status !== ProductStatus.Archived;
				const isUpdating = statusUpdatingId === product.id;

				return (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => handleAction(() => onView(product.id))}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => handleAction(() => onEdit(product.id))}>
							<Icon icon={PencilEdit01Icon} className="icon-sm" />
							<Tooltip.Content>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
					<Dropdown>
						<Button isIconOnly variant="tertiary" aria-label="Mais ações" isDisabled={isUpdating}>
							<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
						</Button>
						<Dropdown.Popover className="min-w-48">
							<Dropdown.Menu aria-label="Ações de status do produto">
								<Dropdown.Item
									id="activate"
									textValue="Ativar produto"
									className="text-success"
									isDisabled={!canActivate || isUpdating}
									onPress={() => onChangeStatus(product.id, ProductStatus.Active)}
								>
									<Icon icon={CheckmarkCircle02Icon} className="icon-md text-success" />
									Ativar
								</Dropdown.Item>
								<Dropdown.Item
									id="inactivate"
									textValue="Inativar produto"
									className="text-warning"
									isDisabled={!canInactivate || isUpdating}
									onPress={() => onChangeStatus(product.id, ProductStatus.Inactive)}
								>
									<Icon icon={CancelCircleIcon} className="icon-md text-warning" />
									Inativar
								</Dropdown.Item>
								<Dropdown.Item
									id="archive"
									textValue="Arquivar produto"
									isDisabled={!canArchive || isUpdating}
									onPress={() => onChangeStatus(product.id, ProductStatus.Archived)}
								>
									<Icon icon={Archive01Icon} className="icon-md" />
									Arquivar
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							className="text-danger"
							onPress={() => handleAction(() => onDelete(product.id, product.name))}
						>
							<Icon icon={Delete02Icon} className="icon-sm" />
							<Tooltip.Content>Excluir</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
				);
			},
		},
	];
}

function renderMobileDigitalProductCard(
	product: MinimalProductData,
	_index: number,
	openActions?: () => void,
) {
	const statusParsed = productStatusParse[product.status];
	const imageUrl = product.imageUrls?.[0] ?? product.imageUrl;

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
			<div className="flex items-start gap-3">
				<Avatar className="rounded-lg shrink-0" size="sm">
					{imageUrl ? (
						<Avatar.Image src={imageUrl} alt={product.name} />
					) : (
						<Avatar.Fallback>
							<Icon icon={PackageIcon} className="icon-sm" />
						</Avatar.Fallback>
					)}
				</Avatar>
				<div className="min-w-0 flex-1">
					<span className="font-semibold text-sm truncate block">{product.name}</span>
					{product.externalId && <p className="mt-0.5 text-xs text-muted truncate">ID: {product.externalId}</p>}
				</div>
			</div>
			<div className="mt-2 flex items-center justify-between gap-3">
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm">
					{statusParsed.label}
				</Chip>
				<span className="text-sm font-semibold shrink-0">{formatCurrency(product.price ?? 0)}</span>
			</div>
			<div className="mt-2 flex items-center justify-between gap-3">
				<span className="text-xs text-muted">
					{product.isUnlimitedDigitalStock ? 'Ilimitado' : `${product.digitalItemsCount} itens digitais`}
				</span>
				<span className="text-xs text-muted">{formatDate(product.createdAt)}</span>
			</div>
		</div>
	);
}

export function DigitalProductsTable({ merchantId, initialFilters }: DigitalProductsTableProps) {
	const { data, filters, modals, actions, context } = useDigitalProductsTable({
		merchantId,
		initialFilters,
	});

	const columns = getColumns({
		onView: actions.goToView,
		onEdit: actions.goToEdit,
		onDelete: modals.delete.open,
		onChangeStatus: actions.changeStatus,
		statusUpdatingId: context.statusUpdatingId,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				defaultValue={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value || null })}
				placeholder="Buscar por nome..."
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(key) => filters.update({ status: key === 'all' ? null : (key as import('@/types/enums').ProductStatus) })}
				allLabel="Todos os status"
			/>

			<ComboboxFilter
				label="Categoria"
				placeholder="Buscar categoria..."
				value={filters.values.categoryId ?? 'all'}
				items={data.categoryOptions}
				onChange={(key) => filters.update({ categoryId: key === 'all' ? null : key })}
				allLabel="Todas as categorias"
				minSearchLength={1}
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
				icon={<Icon icon={FileCloudIcon} className="icon-md text-accent-foreground" />}
				title="Produtos Digitais"
				description="Gerencie os produtos digitais da sua organização"
				action={{
					label: 'Novo Produto Digital',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.goToNew,
				}}
				secondaryAction={{
					label: 'Categorias',
					icon: <Icon icon={Tag01Icon} className="icon-sm" />,
					onPress: modals.categories.open,
				}}
				tertiaryAction={{
					label: 'Templates de Email',
					icon: <Icon icon={Mail01Icon} className="icon-sm" />,
					onPress: actions.goToEmailTemplates,
					tooltip: 'Configurar templates de email para entrega de itens digitais',
				}}
			/>

			<DataTable
				columns={columns}
				data={data.products.items}
				keyExtractor={(product) => product.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize}
				emptyMessage="Nenhum produto digital encontrado"
				minWidth="min-w-250"
				renderMobileCard={renderMobileDigitalProductCard}
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.products.page,
					pageSize: data.products.pageSize,
					totalItems: data.products.totalItems,
					totalPages: data.products.totalPages,
					onPageChange: (page) => filters.update({ page }),
					sortBy: filters.values.sortBy,
					sortOrder: filters.values.sortOrder,
					onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
					isNavigating: data.isLoading,
				}}
			/>

			<CategoriesModal
				isOpen={modals.categories.isOpen}
				onOpenChange={(open) => !open && modals.categories.close()}
				merchantId={merchantId}
				environment={context.environment}
				initialCategories={data.categories}
				onCategoriesChange={filters.refresh}
			/>

			<ConfirmationModal
				isOpen={modals.delete.isOpen}
				onOpenChange={(open) => !open && modals.delete.close()}
				title="Excluir Produto"
				description={`Tem certeza que deseja excluir o produto "${modals.delete.productName}"? Esta ação não pode ser desfeita.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={modals.delete.confirm}
				isPending={modals.delete.isDeleting}
			/>

			<ProductDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				productPromise={modals.details.productPromise}
				merchantId={merchantId}
			/>
		</div>
	);
}

