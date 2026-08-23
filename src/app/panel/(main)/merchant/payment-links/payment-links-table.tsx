'use client';

import { useRouter } from 'next/navigation';
import { Button, Tooltip, Dropdown } from '@heroui/react';
import { Routes } from '@/router/routes';
import {
	Copy01Icon,
	Copy02Icon,
	Delete02Icon,
	ExternalLink,
	MoreHorizontalCircle01Icon,
	PencilEdit01Icon,
	ViewIcon,
	WhatsappIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import {
	pageSizeFilterOptions,
	parseToFilterOptions,
	paymentLinkLifetimeStatusParse,
	paymentStatusParse,
} from '@/parse';
import { PaymentStatus } from '@/types/enums';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { toast } from '@heroui/react';
import type { MinimalPaymentLink } from '@/types/merchant/payment-links';
import type { DataTableColumn } from '@/components/ui/data-table';
import { usePaymentLinksTable } from './use-payment-links-table';
import { PaymentLinkDetailsModal } from '@/app/panel/(main)/merchant/payment-links/modals/payment-link-details-modal';
import { DeletePaymentLinkModal } from './modals/delete-payment-link-modal';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutPlusIcon,
	RevolutWalletIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface PaymentLinksTableProps {
	merchantId: string;
}

const statusOptions = parseToFilterOptions(paymentStatusParse, 'Todos os status');

function copyPaymentLink(url: string) {
	void navigator.clipboard.writeText(url).catch(() => undefined);
	toast.success('Link copiado com sucesso.');
}

function getColumns(
	onView: (id: string) => void,
	onClone: (paymentLink: MinimalPaymentLink) => void,
	onEdit: (id: string) => void,
	onDelete: (paymentLink: MinimalPaymentLink) => void,
): DataTableColumn<MinimalPaymentLink>[] {
	return [
		{
			key: 'paymentLinkUrl',
			header: 'Link de Cobrança PIX',
			render: (link) => (
				<div className="flex max-w-72 items-center gap-2">
					<span className="block min-w-0 grow truncate text-xs font-mono text-white/80">
						{link.paymentLinkUrl}
					</span>
					<Tooltip>
						<button
							type="button"
							onClick={() => copyPaymentLink(link.paymentLinkUrl)}
							className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={Copy01Icon} className="icon-sm" />
						</button>
						<Tooltip.Content>Copiar link PIX</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
		{
			key: 'amount',
			header: 'Valor',
			render: (link) => <span className="font-bold font-mono text-white text-sm tabular-nums">{formatCurrency(link.amount)}</span>,
		},
		{
			key: 'status',
			header: 'Status do Link',
			render: (link) => {
				const status = paymentLinkLifetimeStatusParse[link.lifetimeStatus];
				return (
					<RevolutStatusBadge
						status={link.status}
						label={status?.label || 'Ativo'}
					/>
				);
			},
		},
		{
			key: 'customer',
			header: 'Cliente / Pagador',
			render: (link) => <span className="text-sm text-white font-medium truncate max-w-40 block">{link.customer?.name ?? '-'}</span>,
		},
		{
			key: 'expiresAt',
			header: 'Expira em',
			render: (link) => (
				<span className={`text-xs font-mono ${link.isExpired ? 'text-danger' : 'text-white/50'}`}>
					{link.lifetimeStatus === 'NeverExpires' ? 'Não expira' : link.expiresAt ? formatDate(link.expiresAt) : '-'}
				</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (link) => <span className="text-xs font-mono text-white/50">{formatDate(link.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (link) => {
				const canEdit = link.status === PaymentStatus.Pending && !link.isExpired;
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => onView(link.id)}
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
								<Dropdown.Menu
									aria-label="Ações do link de pagamento"
									onAction={(key) => {
										if (key === 'open') {
											window.open(link.paymentLinkUrl, '_blank', 'noopener,noreferrer');
										} else if (key === 'edit') {
											onEdit(link.id);
										} else if (key === 'clone') {
											onClone(link);
										} else if (key === 'whatsapp') {
											window.open(`https://wa.me/?text=${encodeURIComponent(link.paymentLinkUrl)}`, '_blank', 'noopener,noreferrer');
										} else if (key === 'delete') {
											onDelete(link);
										}
									}}
								>
									{canEdit && (
										<Dropdown.Item id="edit" textValue="Editar link" className="text-link hover:bg-white/10">
											<Icon icon={PencilEdit01Icon} className="icon-xs text-link" />
											Editar link
										</Dropdown.Item>
									)}
									<Dropdown.Item id="clone" textValue="Clonar link" className="text-warning hover:bg-white/10">
										<Icon icon={Copy02Icon} className="icon-xs text-warning" />
										Clonar link
									</Dropdown.Item>
									<Dropdown.Item id="whatsapp" textValue="Compartilhar no WhatsApp" className="text-success hover:bg-white/10">
										<Icon icon={WhatsappIcon} className="icon-xs text-success" />
										Compartilhar no WhatsApp
									</Dropdown.Item>
									<Dropdown.Item id="open" textValue="Abrir link" className="text-white hover:bg-white/10">
										<Icon icon={ExternalLink} className="icon-xs text-white/80" />
										Abrir link
									</Dropdown.Item>
									<Dropdown.Item id="delete" textValue="Excluir link" className="text-danger hover:bg-white/10">
										<Icon icon={Delete02Icon} className="icon-xs text-danger" />
										Excluir link
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

function renderMobilePaymentLinkCard(
	link: MinimalPaymentLink,
	_index: number,
	onOpenActions?: () => void,
) {
	const status = paymentLinkLifetimeStatusParse[link.lifetimeStatus];

	return (
		<div
			className={`rounded-2xl border border-white/10 bg-card p-4 text-white overflow-hidden transition-all ${
				onOpenActions ? 'cursor-pointer hover:border-white/20' : ''
			}`}
			onClick={onOpenActions}
			role={onOpenActions ? 'button' : undefined}
			tabIndex={onOpenActions ? 0 : undefined}
			onKeyDown={
				onOpenActions
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onOpenActions();
							}
						}
					: undefined
			}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<span className="font-bold text-sm text-white truncate block">{link.customer?.name ?? 'Cliente não informado'}</span>
					<p className="mt-0.5 text-xs text-white/50 font-mono truncate">
						PIX • {formatDate(link.createdAt)}
					</p>
				</div>
				<RevolutStatusBadge status={link.status} label={status?.label || 'Ativo'} />
			</div>

			<div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs font-mono">
				<span className="text-white/50">Valor</span>
				<span className="font-bold text-white text-sm">{formatCurrency(link.amount)}</span>
			</div>
		</div>
	);
}

export function PaymentLinksTable({ merchantId }: PaymentLinksTableProps) {
	const router = useRouter();
	const { data, filters, modals, actions } = usePaymentLinksTable({ merchantId });

	const columns = getColumns(
		actions.openDetails,
		(paymentLink) => router.push(`${Routes.panel.merchant.paymentLinksNew}?cloneId=${paymentLink.id}`),
		(id) => router.push(Routes.panel.merchant.paymentLinksEdit(id)),
		modals.delete.open,
	);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Link, descrição ou cliente..."
				value={filters.values.search}
				onChange={filters.handleSearchChange}
			/>

			<SelectFilter
				label="Status da cobrança"
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

	const items = data.paymentLinks.items;
	const totalVolume = items.reduce((acc, l) => acc + l.amount, 0);
	const totalCount = data.paymentLinks.totalItems;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<RevolutPixIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Links de Pagamento PIX</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Cobranças instantâneas com compartilhamento 1-clique via WhatsApp e redes
					</p>
				</div>

				<button
					type="button"
					onClick={() => router.push(Routes.panel.merchant.paymentLinksNew)}
					className="button-primary cursor-pointer self-start sm:self-auto"
				>
					<RevolutPlusIcon size={16} />
					<span>+ Novo Link PIX</span>
				</button>
			</div>

			{/* 3-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* Total Links */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total de Links
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutPixIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalCount} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Links ativos e históricos</p>
					</div>
				</div>

				{/* Volume em Links */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Volume Cobrado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalVolume}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Soma dos links listados</p>
					</div>
				</div>

				{/* Eficiência PIX */}
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Liquidação Instantânea
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
							<RevolutTrendingUpIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-success tracking-tight tabular-nums block">
							D+0 SPI
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Liquidação direta em conta</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.paymentLinks.items}
					keyExtractor={(item) => item.id}
					renderMobileCard={(paymentLink, index, openActions) =>
						renderMobilePaymentLinkCard(paymentLink, index, openActions)
					}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum link de pagamento PIX encontrado."
					minWidth="min-w-200"
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
						totalItems: data.paymentLinks.totalItems,
						totalPages: data.paymentLinks.totalPages,
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

			<PaymentLinkDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				paymentLinkPromise={modals.details.paymentLinkPromise}
			/>

			<DeletePaymentLinkModal
				isOpen={modals.delete.isOpen}
				onOpenChange={modals.delete.close}
				merchantId={merchantId}
				paymentLink={modals.delete.paymentLink}
				onSuccess={modals.delete.onSuccess}
			/>
		</div>
	);
}
