'use client';

import { Avatar, Tooltip, Dropdown, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Delete02Icon,
	ViewIcon,
	Copy01Icon,
	PencilEdit02Icon,
	Link01Icon,
	Share08Icon,
	MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import {
	checkoutStatusParse,
	checkoutTemplateTypeParse,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DataTable } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import { useCheckoutsTable, type CheckoutsTableFilters } from './use-checkouts-table';
import { CheckoutDetailsModal } from './modals/checkout-details-modal';
import type { MinimalCheckout } from '@/types/merchant/checkouts';
import type { DataTableColumn } from '@/components/ui/data-table';
import { CheckoutStatus } from '@/types/enums';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutPlusIcon,
	RevolutTrendingUpIcon,
	RevolutCheckIcon,
	RevolutWalletIcon,
} from '@/components/ui/revolut-icons';

interface CheckoutsTableProps {
	merchantId: string;
	initialFilters: CheckoutsTableFilters;
}

const statusOptions = [
	{ value: '', label: 'Todos os status' },
	{ value: 'Active', label: 'Ativo' },
	{ value: 'Inactive', label: 'Inativo' },
	{ value: 'Archived', label: 'Arquivado' },
];
interface ColumnConfig {
	onView: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string, name: string) => void;
	onShareLink: (name: string, url: string) => void;
	onOpenLink: (url: string) => void;
	onCopyLink: (url: string) => void;
}

function getColumns(config: ColumnConfig): DataTableColumn<MinimalCheckout>[] {
	const { onView, onEdit, onDelete, onShareLink, onOpenLink, onCopyLink } = config;

	function handleAction(action: () => void) {
		openWithDelay(action, DEFAULT_MODAL_DELAY);
	}

	return [
		{
			key: 'templatePreview',
			header: 'Template',
			align: 'center',
			render: (checkout) => {
				const templateName = checkout.template?.name ?? 'PIX Ultra';
				const fallback = templateName.slice(0, 2).toUpperCase();

				return (
					<div className="flex items-center justify-center">
						<Avatar size="sm" className="shrink-0 bg-white/5 border border-white/10 text-white font-mono text-xs">
							{checkout.template?.thumbnailUrl && (
								<Avatar.Image src={checkout.template.thumbnailUrl} alt={templateName} />
							)}
							<Avatar.Fallback className="text-xs text-white/80">{fallback}</Avatar.Fallback>
						</Avatar>
					</div>
				);
			},
		},
		{
			key: 'name',
			header: 'Checkout PIX',
			render: (checkout) => (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<span className="font-bold text-sm text-white truncate max-w-52">{checkout.name}</span>
						{!checkout.onboardingCompleted && (
							<span className="inline-flex items-center rounded-full border border-[#ec7e00]/30 bg-[#ec7e00]/15 px-2 py-0.5 text-[11px] font-mono font-semibold text-[#ec7e00]">
								Incompleto
							</span>
						)}
					</div>
					<span className="text-xs font-mono text-white/40 truncate max-w-60">/{checkout.shortId}</span>
				</div>
			),
		},
		{
			key: 'template',
			header: 'Tipo',
			render: (checkout) => {
				const templateType = checkout.template?.type;
				if (!templateType) return <span className="text-xs font-mono text-white/40">Padrão</span>;
				const typeParsed = checkoutTemplateTypeParse[templateType];
				return (
					<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
						{typeParsed?.label}
					</span>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (checkout) => (
				<RevolutStatusBadge
					status={checkout.status}
					label={checkoutStatusParse[checkout.status]?.label}
				/>
			),
		},
		{
			key: 'products',
			header: 'Produtos',
			align: 'center',
			render: (checkout) => <span className="text-sm font-mono font-semibold text-white">{checkout.productCount}</span>,
		},
		{
			key: 'payments',
			header: 'Vendas PIX',
			align: 'center',
			render: (checkout) => <span className="text-sm font-mono font-bold text-[#00a87e]">{checkout.paymentCount}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (checkout) => <span className="text-xs font-mono text-white/50">{formatDate(checkout.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (checkout) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => onView(checkout.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>
					{checkout.checkoutUrl && (
						<Tooltip>
							<button
								type="button"
								onClick={() => onCopyLink(checkout.checkoutUrl ?? '')}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={Copy01Icon} className="icon-sm" />
							</button>
							<Tooltip.Content>Copiar link</Tooltip.Content>
						</Tooltip>
					)}
					<Dropdown>
						<Button
							isIconOnly
							aria-label="Mais ações"
							className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
						</Button>
						<Dropdown.Popover className="min-w-48 bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
							<Dropdown.Menu aria-label="Ações do checkout">
								<Dropdown.Item id="edit" textValue="Editar checkout" className="text-[#4f55f1] hover:bg-white/10" onPress={() => onEdit(checkout.id)}>
									<Icon icon={PencilEdit02Icon} className="icon-xs text-[#4f55f1]" />
									Editar checkout
								</Dropdown.Item>
								{checkout.checkoutUrl && (
									<Dropdown.Item id="share" textValue="Compartilhar checkout" className="text-white hover:bg-white/10" onPress={() => onShareLink(checkout.name, checkout.checkoutUrl ?? '')}>
										<Icon icon={Share08Icon} className="icon-xs text-white/80" />
										Compartilhar
									</Dropdown.Item>
								)}
								{checkout.checkoutUrl && (
									<Dropdown.Item id="open" textValue="Abrir checkout" className="text-[#00a87e] hover:bg-white/10" onPress={() => onOpenLink(checkout.checkoutUrl ?? '')}>
										<Icon icon={Link01Icon} className="icon-xs text-[#00a87e]" />
										Abrir checkout
									</Dropdown.Item>
								)}
								<Dropdown.Item id="delete" textValue="Excluir checkout" className="text-[#e23b4a] hover:bg-white/10" onPress={() => handleAction(() => onDelete(checkout.id, checkout.name))}>
									<Icon icon={Delete02Icon} className="icon-xs text-[#e23b4a]" />
									Excluir checkout
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</div>
			),
		},
	];
}

function renderMobileCheckoutCard(
	checkout: MinimalCheckout,
	_index: number,
	openActions?: () => void,
) {
	return (
		<div
			className={`rounded-2xl border border-white/10 bg-[#16181a] p-4 text-white overflow-hidden transition-all ${openActions ? 'cursor-pointer hover:border-white/20' : ''}`}
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
					<span className="font-bold text-sm text-white truncate block">{checkout.name}</span>
					{checkout.shortId && <p className="mt-0.5 text-xs text-white/50 font-mono truncate">/{checkout.shortId}</p>}
				</div>
				<RevolutStatusBadge status={checkout.status} label={checkoutStatusParse[checkout.status]?.label} />
			</div>
			<div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs font-mono">
				<span className="text-white/60">{checkout.productCount} produto(s)</span>
				<span className="font-bold text-[#00a87e]">{checkout.paymentCount} venda(s) PIX</span>
			</div>
		</div>
	);
}

export function CheckoutsTable({ merchantId, initialFilters }: CheckoutsTableProps) {
	const { data, filters, modals, actions } = useCheckoutsTable({
		merchantId,
		initialFilters,
	});

	const columns = getColumns({
		onView: actions.goToView,
		onEdit: actions.goToEdit,
		onDelete: modals.delete.open,
		onShareLink: actions.shareLink,
		onOpenLink: actions.openLink,
		onCopyLink: actions.copyLink,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Nome do checkout ou ID..."
				value={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value })}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status ?? ''}
				options={statusOptions}
				onChange={(value) => filters.update({ status: value as CheckoutStatus })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Por página"
				value={String(filters.values.pageSize)}
				options={pageSizeFilterOptions}
				onChange={(value) => filters.update({ pageSize: Number(value) })}
				showChips={false}
			/>
		</>
	);

	const items = data.checkouts.items;
	const totalCount = data.checkouts.totalItems;
	const activeCount = items.filter((c) => c.status === CheckoutStatus.Active).length;
	const totalProducts = items.reduce((acc, c) => acc + c.productCount, 0);
	const totalPayments = items.reduce((acc, c) => acc + c.paymentCount, 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<RevolutPixIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Checkouts & Links PIX</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Páginas de pagamento de alta conversão 100% otimizadas para PIX
					</p>
				</div>

				<button
					type="button"
					onClick={actions.goToNew}
					className="button-primary cursor-pointer self-start sm:self-auto"
				>
					<RevolutPlusIcon size={16} />
					<span>+ Novo Checkout PIX</span>
				</button>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total Checkouts */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total Checkouts
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutPixIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalCount} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Links criados na plataforma</p>
					</div>
				</div>

				{/* Checkouts Ativos */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Checkouts Ativos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							<AnimatedNumber value={activeCount} />
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Capturando pagamentos online</p>
					</div>
				</div>

				{/* Produtos Vinculados */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Produtos Vinculados
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalProducts} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Itens disponíveis nos checkouts</p>
					</div>
				</div>

				{/* Vendas Realizadas */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Vendas Realizadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<RevolutTrendingUpIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalPayments} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Conversões PIX concluídas</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.checkouts.items}
					keyExtractor={(checkout) => checkout.id}
					isLoading={data.isLoading}
					skeletonRows={filters.values.pageSize}
					emptyMessage="Nenhum checkout PIX encontrado."
					minWidth="min-w-200"
					renderMobileCard={renderMobileCheckoutCard}
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.clear,
						onRefresh: filters.refresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: data.checkouts.page,
						pageSize: data.checkouts.pageSize,
						totalItems: data.checkouts.totalItems,
						totalPages: data.checkouts.totalPages,
						onPageChange: (page) => filters.update({ page }),
						sortBy: filters.values.sortBy,
						sortOrder: filters.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
						isNavigating: data.isLoading,
					}}
				/>
			</div>

			<ConfirmationModal
				isOpen={modals.delete.isOpen}
				onOpenChange={(open) => !open && modals.delete.close()}
				title="Excluir Checkout"
				description={`Tem certeza que deseja excluir o checkout "${modals.delete.checkoutName}"? Se houver pagamentos vinculados, o checkout será arquivado.`}
				confirmLabel="Excluir"
				status="danger"
				onConfirm={modals.delete.confirm}
				isPending={modals.delete.isDeleting}
			/>

			<CheckoutDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={(open) => !open && modals.details.close()}
				checkoutPromise={modals.details.checkoutPromise}
				merchantId={merchantId}
				onEdit={(checkoutId) => {
					modals.details.close();
					actions.goToEdit(checkoutId);
				}}
			/>
		</div>
	);
}
