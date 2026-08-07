'use client';

import { Button, Card, Chip, Avatar, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Archive01Icon,
	Calendar01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Delete02Icon,
	FileCloudIcon,
	Mail01Icon,
	PackageIcon,
	PencilEdit01Icon,
	Tag01Icon,
	ViewIcon,
	MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import {
	productStatusParse,
	productTypeParse,
	mapParseColorToChipColor,
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
			key: 'type',
			header: 'Tipo',
			render: (product) => {
				const typeParsed = productTypeParse[product.type];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm" className="gap-1">
						{typeParsed.icon}
						{typeParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'price',
			header: 'Preço',
			render: (product) => <span className="font-medium font-mono">{product.price ? formatCurrency(product.price) : '-'}</span>,
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
			key: 'categories',
			header: 'Categorias',
			render: (product) => (
				<div className="flex items-center gap-1">
					<span className="text-sm">{product.categoryCount}</span>
				</div>
			),
		},
		{
			key: 'variants',
			header: 'Variantes',
			render: (product) => (
				<div className="flex items-center gap-1">
					<span className="text-sm">{product.variantCount}</span>
				</div>
			),
		},
		{
			key: 'coupons',
			header: 'Cupons',
			render: (product) => (
				<div className="flex items-center gap-1">
					<span className="text-sm">{product.couponCount}</span>
				</div>
			),
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
						<Tooltip>
							<Button isIconOnly variant="tertiary" aria-label="Mais ações" isDisabled={isUpdating}>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
								<Tooltip.Content>Mais ações</Tooltip.Content>
							</Button>
						</Tooltip>
						<Dropdown.Popover className="min-w-44">
							<Dropdown.Menu aria-label="Ações do produto">
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
								<Dropdown.Item id="delete" textValue="Excluir produto" className="text-danger" onPress={() => handleAction(() => onDelete(product.id, product.name))}>
									<Icon icon={Delete02Icon} className="icon-md text-danger" />
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
	const { data, filters: tableFilters, modals, actions, context } = useProductsTable({
		productsPromise,
		categoriesPromise,
		merchantId,
		filters,
		productType,
	});

	const pageConfig = {
		Physical: {
			title: 'Produtos Físicos',
			description: 'Gerencie os produtos físicos da sua organização',
			newLabel: 'Novo Produto Físico',
			icon: PackageIcon,
		},
		Digital: {
			title: 'Produtos Digitais',
			description: 'Gerencie os produtos digitais da sua organização',
			newLabel: 'Novo Produto Digital',
			icon: FileCloudIcon,
		},
		Service: {
			title: 'Serviços',
			description: 'Gerencie os serviços da sua organização',
			newLabel: 'Novo Serviço',
			icon: Calendar01Icon,
		},
	} as const;

	const currentConfig = context.productType ? pageConfig[context.productType] : null;

	const columns = getColumns({
		onView: (id) => openWithDelay(() => modals.details.open(id), DEFAULT_MODAL_DELAY),
		onEdit: (id) => openWithDelay(() => actions.goToEdit(id), DEFAULT_MODAL_DELAY),
		onDelete: (id, name) => openWithDelay(() => modals.delete.open(id, name), DEFAULT_MODAL_DELAY),
		onChangeStatus: actions.changeStatus,
		statusUpdatingId: context.statusUpdatingId,
		hideTypeColumn: !!context.productType,
	});

	const filtersContent = (
		<>
			<SearchFilter
				defaultValue={tableFilters.values.search ?? ''}
				onChange={(value) => tableFilters.navigate({ search: value || null })}
				placeholder="Buscar por nome..."
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
		<div className="flex flex-col gap-3">
			<PageHeader
				icon={
					<Icon icon={currentConfig?.icon ?? PackageIcon} className="icon-md text-accent-foreground" />
				}
				title={currentConfig?.title ?? 'Produtos'}
				description={currentConfig?.description ?? 'Gerencie os produtos da sua organização'}
				action={currentConfig ? {
					label: currentConfig.newLabel,
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.goToNew,
				} : undefined}
				secondaryAction={{
					label: 'Categorias',
					icon: <Icon icon={Tag01Icon} className="icon-sm" />,
					onPress: modals.categories.open,
				}}
				tertiaryAction={
					!context.productType || context.productType === 'Digital' || context.productType === 'Physical' || context.productType === 'Service'
						? {
								label: 'Templates de Email',
								icon: <Icon icon={Mail01Icon} className="icon-sm" />,
								onPress: actions.goToEmailTemplates,
								tooltip: 'Configurar templates de email',
							}
						: undefined
				}
			/>

			<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Total de Produtos</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-foreground">
							<AnimatedNumber value={totalProducts} />
						</span>
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Ativos</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-success">
							<AnimatedNumber value={activeProducts} />
						</span>
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Preço Médio</span>
						<AnimatedCurrency value={avgPrice} className="mt-1 text-lg font-bold font-mono tracking-tight text-foreground" />
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Categorias</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-foreground">
							<AnimatedNumber value={totalCategories} />
						</span>
					</Card.Content>
				</Card>
			</div>

			<DataTable
				columns={columns}
				data={data.products.items}
				keyExtractor={(product) => product.id}
				isLoading={data.isLoading}
				skeletonRows={tableFilters.values.pageSize}
				emptyMessage="Nenhum produto encontrado"
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

