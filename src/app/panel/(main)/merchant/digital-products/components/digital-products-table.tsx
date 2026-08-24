'use client';

import { Button, Avatar, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
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
import { productStatusParse, parseToFilterOptions, pageSizeFilterOptions } from '@/parse';
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
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPlusIcon,
	RevolutCheckIcon,
	RevolutWalletIcon,
} from '@/components/ui/revolut-icons';

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
				<Avatar size="sm" className="bg-white/5 border border-white/10 text-white">
					{product.imageUrls?.[0] || product.imageUrl ? (
						<Avatar.Image src={product.imageUrls?.[0] ?? product.imageUrl ?? ''} alt={product.name} />
					) : (
						<Avatar.Fallback>
							<Icon icon={PackageIcon} className="icon-sm text-white/50" />
						</Avatar.Fallback>
					)}
				</Avatar>
			),
		},
		{
			key: 'name',
			header: 'Produto Digital',
			render: (product) => (
				<div className="flex flex-col">
					<span className="font-bold text-sm text-white truncate max-w-60">{product.name}</span>
					{product.externalId && <span className="text-xs font-mono text-white/40 truncate max-w-60">ID: {product.externalId}</span>}
				</div>
			),
		},
		{
			key: 'price',
			header: 'Preço PIX',
			render: (product) => <span className="font-bold font-mono text-white text-sm tabular-nums">{product.price ? formatCurrency(product.price) : '-'}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (product) => (
				<RevolutStatusBadge
					status={product.status}
					label={productStatusParse[product.status]?.label}
				/>
			),
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
	return (
		<div
			className={`rounded-2xl border border-white/10 bg-card p-4 text-white overflow-hidden transition-all ${openActions ? 'cursor-pointer hover:border-white/20' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<span className="font-bold text-sm text-white truncate block">{product.name}</span>
					<p className="mt-0.5 text-xs text-white/50 font-mono truncate">
						{product.isUnlimitedDigitalStock ? 'Estoque Ilimitado' : `${product.digitalItemsCount ?? 0} itens digitais`}
					</p>
				</div>
				<RevolutStatusBadge status={product.status} label={productStatusParse[product.status]?.label} />
			</div>
			<div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs font-mono">
				<span className="text-white/50">Valor PIX</span>
				<span className="font-bold text-white text-sm">{formatCurrency(product.price ?? 0)}</span>
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
	const items = data.products.items;
	const totalProducts = data.products.totalItems;
	const activeProducts = items.filter((p) => p.status === ProductStatus.Active).length;
	const avgPrice = items.length > 0 ? Math.round(items.reduce((acc, p) => acc + (p.price ?? 0), 0) / items.length) : 0;
	const totalCategories = data.categories.length;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={FileCloudIcon} className="icon-sm text-link" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Produtos Digitais</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gerenciamento de entregáveis digitais, licenças e arquivos
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={actions.goToEmailTemplates}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={Mail01Icon} className="icon-sm" />
						<span>Templates de Email</span>
					</button>
					<button
						type="button"
						onClick={modals.categories.open}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={Tag01Icon} className="icon-sm" />
						<span>Categorias</span>
					</button>
					<button
						type="button"
						onClick={actions.goToNew}
						className="button-primary cursor-pointer text-xs"
					>
						<RevolutPlusIcon size={16} />
						<span>+ Novo Produto Digital</span>
					</button>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total no Catálogo */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total no Catálogo
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={PackageIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalProducts} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Itens digitais cadastrados</p>
					</div>
				</div>

				{/* Produtos Ativos */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Produtos Ativos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-success tracking-tight tabular-nums block">
							<AnimatedNumber value={activeProducts} />
						</span>
						<p className="text-xs text-success/80 font-mono mt-0.5">Disponíveis para venda</p>
					</div>
				</div>

				{/* Preço Médio */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Preço Médio PIX
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={avgPrice}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Média de valor dos itens</p>
					</div>
				</div>

				{/* Categorias */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Categorias
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Tag01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalCategories} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Grupos organizacionais</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
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
			</div>
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

