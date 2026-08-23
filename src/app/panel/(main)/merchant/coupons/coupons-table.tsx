'use client';

import { useMemo } from 'react';
import { Tooltip, Dropdown, Button } from '@heroui/react';
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
import {
	couponStatusParse,
	couponDiscountTypeParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatDiscount } from '@/utils/currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { CouponDetailsModal } from './modals/coupon-details-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import { useCouponsTable, type CouponsTableFilters } from './use-coupons-table';
import { CouponStatus, CouponDiscountType } from '@/types/enums';
import type { MinimalCoupon } from '@/types/merchant/coupons';

interface CouponsTableProps {
	merchantId: string;
	initialFilters: CouponsTableFilters;
}

interface ColumnConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, code: string) => void;
}

const statusOptions = parseToFilterOptions(couponStatusParse, 'Todos os status');
const discountTypeOptions = parseToFilterOptions(couponDiscountTypeParse, 'Todos os tipos');

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
					<span className="font-mono font-bold text-sm text-white">{coupon.code}</span>
					<span className="text-xs text-white/50 truncate max-w-40">{coupon.name}</span>
				</div>
			),
		},
		{
			key: 'discountType',
			header: 'Tipo',
			render: (coupon) => {
				const typeParsed = couponDiscountTypeParse[coupon.discountType];
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
						{typeParsed?.label}
					</span>
				);
			},
		},
		{
			key: 'discount',
			header: 'Desconto PIX',
			render: (coupon) => (
				<span className="font-bold font-mono text-white text-sm tabular-nums">{formatDiscount(coupon)}</span>
			),
		},
		{
			key: 'usage',
			header: 'Uso',
			render: (coupon) => (
				<span className="text-sm font-mono text-white/70">
					{coupon.currentUses} / {coupon.maxUses ?? '∞'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (coupon) => {
				const statusParsed = couponStatusParse[coupon.status];
				return <RevolutStatusBadge status={coupon.status} label={statusParsed?.label} />;
			},
		},
		{
			key: 'products',
			header: 'Produtos',
			render: (coupon) => (
				<span className="text-sm text-white/70 font-mono">{coupon.applyToAllProducts ? 'Todos' : coupon.productCount}</span>
			),
		},
		{
			key: 'checkouts',
			header: 'Checkouts',
			render: (coupon) => (
				<span className="text-sm text-white/70 font-mono">{coupon.applyToAllCheckouts ? 'Todos' : coupon.checkoutCount}</span>
			),
		},
		{
			key: 'expiresAt',
			header: 'Expira em',
			render: (coupon) => (
				<span className="text-sm text-white/50 font-mono">
					{coupon.validUntil ? formatDate(coupon.validUntil) : '—'}
				</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (coupon) => <span className="text-sm font-mono text-white/50">{formatDate(coupon.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (coupon) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => handleAction(() => onView(coupon.id))}
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
							<Dropdown.Menu aria-label="Ações do cupom">
								<Dropdown.Item id="edit" textValue="Editar cupom" className="text-link hover:bg-white/10" onPress={() => handleAction(() => onEdit(coupon.id))}>
									<Icon icon={PencilEdit01Icon} className="icon-xs text-link" />
									Editar cupom
								</Dropdown.Item>
								<Dropdown.Item id="delete" textValue="Excluir cupom" className="text-danger hover:bg-white/10" onPress={() => handleAction(() => onDelete(coupon.id, coupon.code))}>
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
					<span className="font-mono font-bold text-sm text-white truncate block">{coupon.code}</span>
					{coupon.name && <p className="mt-0.5 text-xs text-white/50 truncate">{coupon.name}</p>}
				</div>
				<RevolutStatusBadge status={coupon.status} label={statusParsed?.label} />
			</div>
			<div className="mt-2 flex items-center gap-1.5 flex-wrap">
				<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
					{typeParsed?.label}
				</span>
				<span className="text-sm font-bold font-mono text-white tabular-nums">{formatDiscount(coupon)}</span>
				<span className="text-xs text-white/50 font-mono">{coupon.currentUses} / {coupon.maxUses ?? '∞'} usos</span>
			</div>
			{coupon.validUntil && (
				<p className="mt-1.5 text-xs text-white/50 font-mono">Expira: {formatDate(coupon.validUntil)}</p>
			)}
			<p className="mt-2 text-xs text-white/50 font-mono">{formatDate(coupon.createdAt)}</p>
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

	const coupons = data.coupons.items;
	const total = coupons.length;
	const active = coupons.filter((item) => item.status === CouponStatus.Active).length;
	const totalUsage = coupons.reduce((sum, item) => sum + item.currentUses, 0);
	const categoriesByType: Record<string, boolean> = {};
		for (const item of coupons) {
			categoriesByType[item.discountType] = true;
		}
		const categories = Object.keys(categoriesByType).length;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={Coupon01Icon} className="icon-sm" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Cupons de Desconto</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Gerencie promoções, códigos e regras de desconto PIX</p>
				</div>

				<button
					type="button"
					onClick={actions.goToNew}
					className="button-primary cursor-pointer text-xs"
				>
					<Icon icon={AddCircleIcon} className="icon-xs" />
					<span>Novo Cupom</span>
				</button>
			</div>

			{/* 4-Tile KPI Grid */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{/* Total */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Total</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Coupon01Icon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={total} />
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
						<AnimatedNumber value={active} />
					</span>
				</div>

				{/* Total de Usos */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Usos</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={ShoppingCart01Icon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={totalUsage} />
					</span>
				</div>

				{/* Categorias */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Categorias</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={PackageIcon} className="icon-xs" />
						</div>
					</div>
					<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums">
						<AnimatedNumber value={categories} />
					</span>
				</div>
			</div>

			{/* Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
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
			</div>

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
