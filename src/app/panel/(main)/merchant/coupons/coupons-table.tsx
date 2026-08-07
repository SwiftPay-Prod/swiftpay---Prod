'use client';

import { useMemo } from 'react';
import { Button, Card, Chip, Tooltip, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Delete02Icon,
	Coupon01Icon,
	MoreHorizontalCircle01Icon,
	PencilEdit01Icon,
	ViewIcon,
	PackageIcon,
	ShoppingCart01Icon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
	couponStatusParse,
	couponDiscountTypeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatDiscount } from '@/utils/currency';
import { DataTable } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { CouponDetailsModal } from './modals/coupon-details-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import { useCouponsTable, type CouponsTableFilters } from './use-coupons-table';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import type { DataTableColumn } from '@/components/ui/data-table';
import { CouponStatus, CouponDiscountType } from '@/types/enums';

interface CouponsTableProps {
	merchantId: string;
	initialFilters: CouponsTableFilters;
}

const statusOptions = parseToFilterOptions(couponStatusParse, 'Todos os status');
const discountTypeOptions = parseToFilterOptions(couponDiscountTypeParse, 'Todos os tipos');

interface ColumnConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, code: string) => void;
}

function getColumns(config: ColumnConfig): DataTableColumn<MinimalCoupon>[] {
	const { onView, onEdit, onDelete } = config;

	function handleAction(action: () => void) {
		openWithDelay(action, DEFAULT_MODAL_DELAY);
	}

	return [
		{
			key: 'code',
			header: 'Código',
			render: (coupon) => (
				<div className="flex flex-col">
					<span className="font-mono font-medium text-accent">{coupon.code}</span>
					<span className="text-sm text-muted truncate max-w-40">{coupon.name}</span>
				</div>
			),
		},
		{
			key: 'discountType',
			header: 'Tipo',
			render: (coupon) => {
				const typeParsed = couponDiscountTypeParse[coupon.discountType];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm" className="gap-1">
						{typeParsed.icon}
						{typeParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'discount',
			header: 'Desconto',
			render: (coupon) => <span className="font-medium">{formatDiscount(coupon)}</span>,
		},
		{
			key: 'usage',
			header: 'Uso',
			render: (coupon) => (
				<span className="text-sm">
					{coupon.currentUses} / {coupon.maxUses ?? '∞'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (coupon) => {
				const statusParsed = couponStatusParse[coupon.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'products',
			header: 'Produtos',
			render: (coupon) => (
				<div className="flex items-center gap-1">
					<Icon icon={PackageIcon} className="icon-sm text-muted" />
					<span className="text-sm">{coupon.applyToAllProducts ? 'Todos' : coupon.productCount}</span>
				</div>
			),
		},
		{
			key: 'checkouts',
			header: 'Checkouts',
			render: (coupon) => (
				<div className="flex items-center gap-1">
					<Icon icon={ShoppingCart01Icon} className="icon-sm text-muted" />
					<span className="text-sm">{coupon.applyToAllCheckouts ? 'Todos' : coupon.checkoutCount}</span>
				</div>
			),
		},
		{
			key: 'expiresAt',
			header: 'Expira em',
			render: (coupon) => (
				<span className="text-sm text-muted">
					{coupon.validUntil ? formatDate(coupon.validUntil) : '-'}
				</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (coupon) => (
				<span className="text-sm text-muted">{formatDate(coupon.createdAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (coupon) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => handleAction(() => onView(coupon.id))}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					<Dropdown>
						<Tooltip>
							<Button isIconOnly variant="tertiary" aria-label="Mais ações">
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
								<Tooltip.Content>Mais ações</Tooltip.Content>
							</Button>
						</Tooltip>
						<Dropdown.Popover className="min-w-44">
							<Dropdown.Menu aria-label="Ações do cupom">
								<Dropdown.Item id="edit" textValue="Editar cupom" className="text-accent" onPress={() => handleAction(() => onEdit(coupon.id))}>
									<Icon icon={PencilEdit01Icon} className="icon-xs text-accent" />
									Editar cupom
								</Dropdown.Item>
								<Dropdown.Item id="delete" textValue="Excluir cupom" className="text-danger" onPress={() => handleAction(() => onDelete(coupon.id, coupon.code))}>
									<Icon icon={Delete02Icon} className="icon-xs text-danger" />
									Excluir cupom
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</div>
			),
		},
	];
}

function renderMobileCouponCard(
	coupon: MinimalCoupon,
	_index: number,
	openActions?: () => void,
) {
	const statusParsed = couponStatusParse[coupon.status];
	const typeParsed = couponDiscountTypeParse[coupon.discountType];

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
					<span className="font-mono font-semibold text-sm text-accent truncate block">{coupon.code}</span>
					{coupon.name && <p className="mt-0.5 text-xs text-muted truncate">{coupon.name}</p>}
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="shrink-0">
					{statusParsed.label}
				</Chip>
			</div>
			<div className="mt-2 flex items-center gap-1.5 flex-wrap">
				<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm">
					{typeParsed.label}
				</Chip>
				<span className="text-sm font-semibold">{formatDiscount(coupon)}</span>
				<span className="text-xs text-muted">{coupon.currentUses} / {coupon.maxUses ?? '∞'} usos</span>
			</div>
			{coupon.validUntil && (
				<p className="mt-1.5 text-xs text-muted">Expira: {formatDate(coupon.validUntil)}</p>
			)}
			<p className="mt-2 text-xs text-muted">{formatDate(coupon.createdAt)}</p>
		</div>
	);
}

export function CouponsTable({ merchantId, initialFilters }: CouponsTableProps) {
	const { data, filters, modals, actions } = useCouponsTable({
		merchantId,
		initialFilters,
	});

	const columns = getColumns({
		onView: modals.details.open,
		onEdit: actions.goToEdit,
		onDelete: modals.delete.open,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				defaultValue={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value || null })}
				placeholder="Buscar por código ou nome..."
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(key) => filters.update({ status: key === 'all' ? null : (key as CouponStatus) })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Tipo"
				value={filters.values.discountType ?? 'all'}
				options={discountTypeOptions}
				onChange={(key) => filters.update({ discountType: key === 'all' ? null : (key as CouponDiscountType) })}
				allLabel="Todos os tipos"
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
				icon={<Icon icon={Coupon01Icon} className="icon-md text-accent-foreground" />}
				title="Cupons"
				description="Gerencie os cupons de desconto da sua organização"
				action={{
					label: 'Novo Cupom',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.goToNew,
				}}
			/>

			{(() => {
				const coupons = data.coupons.items;
				const total = coupons.length;
				const active = coupons.filter((item) => item.status === CouponStatus.Active).length;
				const totalUsage = coupons.reduce((sum, item) => sum + item.currentUses, 0);

				const categoriesByType: Record<string, boolean> = {};
				for (const item of coupons) {
					categoriesByType[item.discountType] = true;
				}
				const categories = Object.keys(categoriesByType).length;

				const stats = useMemo(
					() =>
						[
							{
								label: 'Total',
								value: <AnimatedNumber value={total} />,
								icon: <Icon icon={Coupon01Icon} className="icon-sm text-muted" />,
							},
							{
								label: 'Ativos',
								value: <AnimatedNumber value={active} />,
								icon: <Icon icon={ViewIcon} className="icon-sm text-success" />,
								accent: 'text-success',
							},
							{
								label: 'Usos',
								value: <AnimatedNumber value={totalUsage} />,
								icon: <Icon icon={ShoppingCart01Icon} className="icon-sm text-muted" />,
							},
							{
								label: 'Categorias',
								value: <AnimatedNumber value={categories} />,
								icon: <Icon icon={PackageIcon} className="icon-sm text-muted" />,
							},
						],
					[coupons]
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
				data={data.coupons.items}
				keyExtractor={(coupon) => coupon.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize}
				emptyMessage="Nenhum cupom encontrado"
				minWidth="min-w-250"
				renderMobileCard={renderMobileCouponCard}
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.coupons.page,
					pageSize: data.coupons.pageSize,
					totalItems: data.coupons.totalItems,
					totalPages: data.coupons.totalPages,
					onPageChange: (page) => filters.update({ page }),
					sortBy: filters.values.sortBy,
					sortOrder: filters.values.sortOrder,
					onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
					isNavigating: data.isLoading,
				}}
			/>

			{modals.details.isOpen && modals.details.couponPromise && (
				<CouponDetailsModal
					isOpen={modals.details.isOpen}
					onOpenChange={(open) => !open && modals.details.close()}
					couponPromise={modals.details.couponPromise}
				/>
			)}

			<ConfirmationModal
				isOpen={modals.delete.isOpen}
				onOpenChange={(open) => !open && modals.delete.close()}
				title="Excluir Cupom"
				description={`Tem certeza que deseja excluir o cupom "${modals.delete.couponCode}"? Esta ação não pode ser desfeita.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={modals.delete.confirm}
				isPending={modals.delete.isDeleting}
			/>
		</div>
	);
}

