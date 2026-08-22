'use client';

import { Avatar, Tooltip, Dropdown, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Archive01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Delete02Icon,
	Mail01Icon,
	PackageIcon,
	PencilEdit01Icon,
	Tag01Icon,
	ViewIcon,
	MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import {
	productStatusParse,
	productTypeParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { ComboboxFilter } from '@/components/ui/combobox-filter';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import type { MinimalProductData, MinimalCategoryData } from '@/types/merchant/products';
import type { Paginated, ApiResponse } from '@/types/common';
import type { DataTableColumn } from '@/components/ui/data-table';
import { PaymentEnvironment as PaymentEnv, ProductStatus } from '@/types/enums';
import { ProductDetailsModal, CategoriesModal } from '@/components/merchant/products/modals';
import { useProductsTable, type ProductsTableFilters } from './use-products-table';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';

type ProductsPromise = Promise<ApiResponse<Paginated<MinimalProductData>>>;
type CategoriesPromise = Promise<ApiResponse<Paginated<MinimalCategoryData>>>;

interface ProductsTableProps {
	productsPromise: ProductsPromise;
	categoriesPromise: CategoriesPromise;
	merchantId: string;
	filters: ProductsTableFilters;
	productType?: 'Physical' | 'Digital' | 'Service';
}

const statusOptions = parseToFilterOptions(productStatusParse, 'Todos os status');
const typeOptions = parseToFilterOptions(productTypeParse, 'Todos os tipos');

interface ColumnsConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, name: string) => void;
	onChangeStatus: (id: string, status: ProductStatus) => void;
	statusUpdatingId: string | null;
	hideTypeColumn?: boolean;
}

function getColumns(config: ColumnsConfig): DataTableColumn<MinimalProductData>[] {
	const { onView, onEdit, onDelete, onChangeStatus, statusUpdatingId, hideTypeColumn } = config;

	function handleAction(action: () => void) {
		openWithDelay(action, DEFAULT_MODAL_DELAY);
	}

	const columns: DataTableColumn<MinimalProductData>[] = [
		{
			key: 'image',
			header: '',
			width: 'w-14',
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
			header: 'Produto',
			render: (product) => (
				<div className="flex flex-col">
					<span className="font-bold text-sm text-white truncate max-w-60">{product.name}</span>
					{product.externalId && <span className="text-xs font-mono text-white/40 truncate max-w-60">ID: {product.externalId}</span>}
				</div>
			),
		},
		{
			key: 'type',
			header: 'Tipo',
			render: (product) => {
				const typeParsed = productTypeParse[product.type];
				return (
					<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
						{typeParsed?.label}
					</span>
				);
			},
		},
		{
			key: 'price',
			header: 'Preço PIX',
			render: (product) => (
				<span className="font-bold font-mono text-white text-sm tabular-nums">
					{product.price ? formatCurrency(product.price) : '-'}
				</span>
			),
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
			key: 'createdAt',
			header: 'Criado em',
			render: (product) => <span className="text-xs font-mono text-white/50">{formatDate(product.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (product) => {
				const isArchived = product.status === ProductStatus.Archived;
				const isPending = statusUpdatingId === product.id;

				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => onView(product.id)}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={ViewIcon} className="icon-sm" />
							</button>
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Tooltip>
						<Dropdown>
							<Button
								isIconOnly
								isDisabled={isPending}
								aria-label="Mais ações"
								className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
							</Button>
							<Dropdown.Popover className="min-w-48 bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
								<Dropdown.Menu aria-label="Ações do produto">
									<Dropdown.Item id="edit" textValue="Editar produto" className="text-[#4f55f1] hover:bg-white/10" onPress={() => onEdit(product.id)}>
										<Icon icon={PencilEdit01Icon} className="icon-xs text-[#4f55f1]" />
										Editar produto
									</Dropdown.Item>
									{!isArchived && (
										<Dropdown.Item
											id="toggle-status"
											textValue={product.status === ProductStatus.Active ? 'Desativar' : 'Ativar'}
											className="text-white hover:bg-white/10"
											onPress={() =>
												onChangeStatus(
													product.id,
													product.status === ProductStatus.Active ? ProductStatus.Inactive : ProductStatus.Active
												)
											}
										>
											<Icon
												icon={product.status === ProductStatus.Active ? CancelCircleIcon : CheckmarkCircle02Icon}
												className="icon-xs text-white/70"
											/>
											{product.status === ProductStatus.Active ? 'Desativar' : 'Ativar'}
										</Dropdown.Item>
									)}
									<Dropdown.Item
										id="archive"
										textValue={isArchived ? 'Desarquivar' : 'Arquivar'}
										className="text-[#ec7e00] hover:bg-white/10"
										onPress={() =>
											onChangeStatus(
												product.id,
												isArchived ? ProductStatus.Inactive : ProductStatus.Archived
											)
										}
									>
										<Icon icon={Archive01Icon} className="icon-xs text-[#ec7e00]" />
										{isArchived ? 'Desarquivar' : 'Arquivar'}
									</Dropdown.Item>
									<Dropdown.Item
										id="delete"
										textValue="Excluir produto"
										className="text-[#e23b4a] hover:bg-white/10"
										onPress={() => handleAction(() => onDelete(product.id, product.name))}
									>
										<Icon icon={Delete02Icon} className="icon-xs text-[#e23b4a]" />
										Excluir produto
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					</div>
				);
			},
		},
	];

	if (hideTypeColumn) {
		return columns.filter((col) => col.key !== 'type');
	}

	return columns;
}

export function ProductsTable({ productsPromise, categoriesPromise, merchantId, filters, productType }: ProductsTableProps) {
	const {
		data,
		filters: tableFilters,
		modals,
		actions,
		context,
	} = useProductsTable({
		productsPromise,
		categoriesPromise,
		merchantId,
		filters,
		productType,
	});

	const productTypeConfig = productType ? {
		Physical: { title: 'Produtos Físicos', description: 'Gerencie inventário e produtos com entrega', newLabel: 'Novo Produto Físico' },
		Digital: { title: 'Produtos Digitais', description: 'Gerencie arquivos, chaves e downloads', newLabel: 'Novo Produto Digital' },
		Service: { title: 'Serviços', description: 'Gerencie planos e serviços com pagamento PIX', newLabel: 'Novo Serviço' },
	}[productType] : { title: 'Catálogo de Produtos', description: 'Gerenciamento completo de inventário e precificação PIX', newLabel: 'Novo Produto' };

	const columns = getColumns({
		onView: modals.details.open,
		onEdit: actions.goToEdit,
		onDelete: modals.delete.open,
		onChangeStatus: actions.changeStatus,
		statusUpdatingId: context.statusUpdatingId,
		hideTypeColumn: !!context.productType,
	});

	const filtersContent = (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Nome ou ID do produto..."
				value={tableFilters.values.search ?? ''}
				onChange={(value) => tableFilters.navigate({ search: value })}
			/>

			<SelectFilter
				label="Status"
				value={tableFilters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(key) => tableFilters.navigate({ status: key })}
				allLabel="Todos os status"
			/>

			{!context.productType && (
				<SelectFilter
					label="Tipo"
					value={tableFilters.values.type ?? 'all'}
					options={typeOptions}
					onChange={(key) => tableFilters.navigate({ type: key })}
					allLabel="Todos os tipos"
				/>
			)}

			<ComboboxFilter
				label="Categoria"
				placeholder="Buscar categoria..."
				value={tableFilters.values.categoryId ?? 'all'}
				items={data.categoryOptions}
				onChange={(key) => tableFilters.navigate({ categoryId: key === 'all' ? null : key })}
				allLabel="Todas as categorias"
				minSearchLength={1}
			/>

			<SelectFilter
				label="Por página"
				value={String(tableFilters.values.pageSize)}
				options={pageSizeFilterOptions}
				onChange={(key) => tableFilters.navigate({ pageSize: Number(key) })}
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
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={PackageIcon} className="icon-sm text-[#4f55f1]" />
						</div>
					<h1 className="text-xl font-bold tracking-tight text-white">{productTypeConfig.title}</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
					{productTypeConfig.description}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
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
					<span>{productTypeConfig.newLabel}</span>
				</button>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total de Produtos */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
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
						<p className="text-xs text-white/40 font-mono mt-0.5">Itens cadastrados</p>
					</div>
				</div>

				{/* Produtos Ativos */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Produtos Ativos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							<AnimatedNumber value={activeProducts} />
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Disponíveis para venda</p>
					</div>
				</div>

				{/* Preço Médio */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Ticket Médio Catálogo
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={avgPrice}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Média de precificação</p>
					</div>
				</div>

				{/* Categorias */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Categorias
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Tag01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalCategories} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Segmentos cadastrados</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.products.items}
					keyExtractor={(product) => product.id}
					isLoading={data.isLoading}
					skeletonRows={tableFilters.values.pageSize}
					emptyMessage="Nenhum produto encontrado no catálogo."
					minWidth="min-w-250"
					filters={{
						children: filtersContent,
						hasFilters: tableFilters.hasFilters,
						onClear: tableFilters.clear,
						onRefresh: tableFilters.refresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: data.products.page,
						pageSize: data.products.pageSize,
						totalItems: data.products.totalItems,
						totalPages: data.products.totalPages,
						onPageChange: (page) => tableFilters.navigate({ page }),
						sortBy: tableFilters.values.sortBy,
						sortOrder: tableFilters.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => tableFilters.navigate({ sortBy, sortOrder, page: 1 }),
						isNavigating: data.isLoading,
					}}
				/>
			</div>

			<ProductDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				productPromise={modals.details.productPromise}
				merchantId={context.merchantId}
			/>

			<CategoriesModal
				isOpen={modals.categories.isOpen}
				onOpenChange={(open) => !open && modals.categories.close()}
				merchantId={context.merchantId}
				environment={tableFilters.values.environment ?? PaymentEnv.Sandbox}
				initialCategories={data.categories}
				onCategoriesChange={tableFilters.refresh}
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
		</div>
	);
}
