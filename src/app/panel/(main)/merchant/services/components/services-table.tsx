'use client';

import { Button, Chip, Avatar, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Archive01Icon,
	Clock01Icon,
	CancelCircleIcon,
	Delete02Icon,
	PencilEdit01Icon,
	Tag01Icon,
	ViewIcon,
	ServiceIcon,
	Mail01Icon,
	MoreHorizontalCircle01Icon,
	CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import {
	productStatusParse,
	serviceLocationTypeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
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
import type { MinimalProductData } from '@/types/merchant/products';
import type { DataTableColumn } from '@/components/ui/data-table';
import { ProductStatus } from '@/types/enums';
import { useServicesTable, type ServicesTableFilters } from './use-services-table';

interface ServicesTableProps {
	merchantId: string;
	initialFilters: ServicesTableFilters;
}

const statusOptions = parseToFilterOptions(productStatusParse, 'Todos os status');

interface ColumnsConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, name: string) => void;
	onChangeStatus: (id: string, status: ProductStatus) => void;
	statusUpdatingId: string | null;
}

function getColumns(config: ColumnsConfig): DataTableColumn<MinimalProductData>[] {
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
							<Icon icon={ServiceIcon} className="icon-sm" />
						</Avatar.Fallback>
					)}
				</Avatar>
			),
		},
		{
			key: 'name',
			header: 'Serviço',
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
			key: 'duration',
			header: 'Duração',
			render: (product) => {
				if (!product.durationMinutes) {
					return <span className="text-sm text-muted">-</span>;
				}

				const hours = Math.floor(product.durationMinutes / 60);
				const minutes = product.durationMinutes % 60;
				const duration = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;

				return (
					<div className="flex items-center gap-1.5">
						<Icon icon={Clock01Icon} className="icon-md text-muted" />
						<span className="text-sm">{duration}</span>
					</div>
				);
			},
		},
		{
			key: 'locationType',
			header: 'Modalidade',
			render: (product) => {
				if (!product.locationType) {
					return <span className="text-sm text-muted">-</span>;
				}

				const locationParsed = serviceLocationTypeParse[product.locationType];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(locationParsed.color)} size="sm" className="gap-1">
						{locationParsed.icon}
						{locationParsed.label}
					</Chip>
				);
			},
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
							<Tooltip>
								<Button isIconOnly variant="tertiary" aria-label="Mais ações" isDisabled={isUpdating}>
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
									<Tooltip.Content>Mais ações</Tooltip.Content>
								</Button>
							</Tooltip>
							<Dropdown.Popover className="min-w-48">
								<Dropdown.Menu aria-label="Ações do serviço">
									<Dropdown.Item
										id="activate"
										textValue="Ativar serviço"
										className="text-success"
										isDisabled={!canActivate || isUpdating}
										onPress={() => onChangeStatus(product.id, ProductStatus.Active)}
									>
										<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
										Ativar
									</Dropdown.Item>
									<Dropdown.Item
										id="inactivate"
										textValue="Inativar serviço"
										className="text-warning"
										isDisabled={!canInactivate || isUpdating}
										onPress={() => onChangeStatus(product.id, ProductStatus.Inactive)}
									>
										<Icon icon={CancelCircleIcon} className="icon-sm text-warning" />
										Inativar
									</Dropdown.Item>
									<Dropdown.Item
										id="archive"
										textValue="Arquivar serviço"
										className="text-secondary"
										isDisabled={!canArchive || isUpdating}
										onPress={() => onChangeStatus(product.id, ProductStatus.Archived)}
									>
										<Icon icon={Archive01Icon} className="icon-sm text-secondary" />
										Arquivar
									</Dropdown.Item>
									<Dropdown.Item
										id="delete"
										textValue="Excluir serviço"
										className="text-danger"
										onPress={() => handleAction(() => onDelete(product.id, product.name))}
									>
										<Icon icon={Delete02Icon} className="icon-sm text-danger" />
										Excluir serviço
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

function renderMobileServiceCard(product: MinimalProductData, _index: number, openActions?: () => void) {
	const statusParsed = productStatusParse[product.status];
	const locationTypeParsed = product.locationType ? serviceLocationTypeParse[product.locationType] : null;
	const imageUrl = product.imageUrls?.[0] ?? product.imageUrl;
	const hours = product.durationMinutes ? Math.floor(product.durationMinutes / 60) : 0;
	const mins = product.durationMinutes ? product.durationMinutes % 60 : 0;
	const durationText = product.durationMinutes
		? hours > 0 && mins > 0
			? `${hours}h ${mins}min`
			: hours > 0
				? `${hours}h`
				: `${mins}min`
		: null;

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
							<Icon icon={ServiceIcon} className="icon-sm" />
						</Avatar.Fallback>
					)}
				</Avatar>
				<div className="min-w-0 flex-1">
					<span className="font-semibold text-sm truncate block">{product.name}</span>
					{product.externalId && <p className="mt-0.5 text-xs text-muted truncate">ID: {product.externalId}</p>}
				</div>
			</div>
			<div className="mt-2 flex items-center justify-between gap-3">
				<div className="flex items-center gap-1.5 flex-wrap">
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm">
						{statusParsed.label}
					</Chip>
					{locationTypeParsed && (
						<Chip variant="soft" color={mapParseColorToChipColor(locationTypeParsed.color)} size="sm">
							{locationTypeParsed.label}
						</Chip>
					)}
				</div>
				<span className="text-sm font-semibold shrink-0">{formatCurrency(product.price ?? 0)}</span>
			</div>
			{durationText && <p className="mt-1.5 text-xs text-muted">{durationText}</p>}
			<p className="mt-2 text-xs text-muted">{formatDate(product.createdAt)}</p>
		</div>
	);
}

export function ServicesTable({ merchantId, initialFilters }: ServicesTableProps) {
	const { data, filters, modals, actions, context } = useServicesTable({
		merchantId,
		initialFilters,
	});

	const columns = getColumns({
		onView: (id) => openWithDelay(() => actions.goToView(id), DEFAULT_MODAL_DELAY),
		onEdit: (id) => openWithDelay(() => actions.goToEdit(id), DEFAULT_MODAL_DELAY),
		onDelete: (id, name) => openWithDelay(() => modals.delete.open(id, name), DEFAULT_MODAL_DELAY),
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
				onChange={(key) => filters.update({ status: key === 'all' ? undefined : (key as ProductStatus) })}
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
				icon={<Icon icon={ServiceIcon} className="icon-md text-accent-foreground" />}
				title="Serviços"
				description="Gerencie os serviços da sua organização"
				action={{
					label: 'Novo Serviço',
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
					tooltip: 'Configurar templates de email',
				}}
			/>

			<DataTable
				columns={columns}
				data={data.services.items}
				keyExtractor={(product) => product.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize}
				emptyMessage="Nenhum serviço encontrado"
				minWidth="min-w-200"
				renderMobileCard={renderMobileServiceCard}
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.services.page,
					pageSize: data.services.pageSize,
					totalItems: data.services.totalItems,
					totalPages: data.services.totalPages,
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
				merchantId={context.merchantId}
				environment={context.environment}
				initialCategories={data.categories}
				onCategoriesChange={filters.refresh}
			/>

			<ConfirmationModal
				isOpen={modals.delete.isOpen}
				onOpenChange={(open) => !open && modals.delete.close()}
				title="Excluir Serviço"
				description={`Tem certeza que deseja excluir o serviço "${modals.delete.productName}"? Esta ação não pode ser desfeita.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={modals.delete.confirm}
				isPending={modals.delete.isDeleting}
			/>

			<ProductDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				productPromise={modals.details.productPromise}
				merchantId={context.merchantId}
			/>
		</div>
	);
}
