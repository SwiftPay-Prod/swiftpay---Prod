'use client';

import { Button, Card, Chip, Tooltip, Dropdown } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	Delete02Icon,
	ShoppingCart01Icon,
	ViewIcon,
	Copy01Icon,
	PencilEdit02Icon,
	Link01Icon,
	Share08Icon,
	MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import {
	checkoutStatusParse,
	checkoutTemplateTypeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
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
import { CheckoutStatus, type CheckoutTemplateType } from '@/types/enums';

interface CheckoutsTableProps {
	merchantId: string;
	initialFilters: CheckoutsTableFilters;
}

const statusOptions = parseToFilterOptions(checkoutStatusParse, 'Todos os status');
const templateTypeOptions = parseToFilterOptions(checkoutTemplateTypeParse, 'Todos os tipos');

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
				const templateName = checkout.template?.name ?? 'Sem template';
				const fallback = templateName.slice(0, 2).toUpperCase();

				return (
					<div className="flex items-center justify-center">
						<Avatar size="sm" className="shrink-0">
							{checkout.template?.thumbnailUrl && (
								<Avatar.Image src={checkout.template.thumbnailUrl} alt={templateName} />
							)}
							<Avatar.Fallback className="text-xs">{fallback}</Avatar.Fallback>
						</Avatar>
					</div>
				);
			},
		},
		{
			key: 'name',
			header: 'Checkout',
			render: (checkout) => (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<span className="font-medium truncate max-w-52">{checkout.name}</span>
						{!checkout.onboardingCompleted && (
							<Chip variant="soft" color="warning" size="sm">
								Incompleto
							</Chip>
						)}
					</div>
					<span className="text-xs text-muted truncate max-w-60">/{checkout.shortId}</span>
				</div>
			),
		},
		{
			key: 'template',
			header: 'Tipo',
			render: (checkout) => {
				const templateType = checkout.template?.type;
				if (!templateType) return <span className="text-muted">-</span>;
				const typeParsed = checkoutTemplateTypeParse[templateType];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm" className="gap-1">
						{typeParsed.icon}
						{typeParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (checkout) => {
				const statusParsed = checkoutStatusParse[checkout.status];
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
			align: 'center',
			render: (checkout) => <span className="text-sm">{checkout.productCount}</span>,
		},
		{
			key: 'coupons',
			header: 'Cupons',
			align: 'center',
			render: (checkout) => (
				<div className="flex items-center justify-center gap-1">
					<span className="text-sm">{checkout.couponCount}</span>
				</div>
			),
		},
		{
			key: 'payments',
			header: 'Pagamentos',
			align: 'center',
			render: (checkout) => <span className="text-sm">{checkout.paymentCount}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (checkout) => <span className="text-sm text-muted">{formatDate(checkout.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (checkout) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(checkout.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					{checkout.checkoutUrl && (
						<Tooltip>
							<Button
								isIconOnly
								variant="tertiary"
								className="text-accent"
								onPress={() => onCopyLink(checkout.checkoutUrl ?? '')}
							>
								<Icon icon={Copy01Icon} className="icon-sm" />
								<Tooltip.Content>Copiar link</Tooltip.Content>
							</Button>
						</Tooltip>
					)}
					<Dropdown>
						<Tooltip>
							<Button isIconOnly variant="tertiary" aria-label="Mais ações">
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
								<Tooltip.Content>Mais ações</Tooltip.Content>
							</Button>
						</Tooltip>
						<Dropdown.Popover className="min-w-48">
							<Dropdown.Menu aria-label="Ações do checkout">
								<Dropdown.Item id="edit" textValue="Editar checkout" className="text-accent" onPress={() => onEdit(checkout.id)}>
									<Icon icon={PencilEdit02Icon} className="icon-xs text-accent" />
									Editar checkout
								</Dropdown.Item>
								{checkout.checkoutUrl && (
									<Dropdown.Item id="share" textValue="Compartilhar checkout" className="text-secondary" onPress={() => onShareLink(checkout.name, checkout.checkoutUrl ?? '')}>
										<Icon icon={Share08Icon} className="icon-xs text-secondary" />
										Compartilhar
									</Dropdown.Item>
								)}
								{checkout.checkoutUrl && (
									<Dropdown.Item id="open" textValue="Abrir checkout" className="text-success" onPress={() => onOpenLink(checkout.checkoutUrl ?? '')}>
										<Icon icon={Link01Icon} className="icon-xs text-success" />
										Abrir checkout
									</Dropdown.Item>
								)}
								<Dropdown.Item id="delete" textValue="Excluir checkout" className="text-danger" onPress={() => handleAction(() => onDelete(checkout.id, checkout.name))}>
									<Icon icon={Delete02Icon} className="icon-xs text-danger" />
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
	const statusParsed = checkoutStatusParse[checkout.status];

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
					<span className="font-semibold text-sm truncate block">{checkout.name}</span>
					{checkout.shortId && <p className="mt-0.5 text-xs text-muted truncate">/{checkout.shortId}</p>}
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="shrink-0">
					{statusParsed.label}
				</Chip>
			</div>
			{(!checkout.onboardingCompleted || checkout.template?.type) && (
				<div className="mt-2 flex items-center gap-1.5 flex-wrap">
					{!checkout.onboardingCompleted && (
						<Chip variant="soft" color="warning" size="sm">
							Incompleto
						</Chip>
					)}
					{checkout.template?.type && (
						<Chip variant="soft" color={mapParseColorToChipColor(checkoutTemplateTypeParse[checkout.template.type].color)} size="sm">
							{checkoutTemplateTypeParse[checkout.template.type].label}
						</Chip>
					)}
				</div>
			)}
			<div className="mt-2 flex items-center justify-between gap-3">
				<span className="text-xs text-muted">{checkout.productCount} produtos · {checkout.paymentCount} pagamentos</span>
				<span className="text-xs text-muted">{formatDate(checkout.createdAt)}</span>
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
				defaultValue={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value || null })}
				placeholder="Buscar por nome..."
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(key) => filters.update({ status: key === 'all' ? null : (key as CheckoutStatus) })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Tipo"
				value={filters.values.templateType ?? 'all'}
				options={templateTypeOptions}
				onChange={(key) => filters.update({ templateType: key === 'all' ? null : (key as CheckoutTemplateType) })}
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

	const items = data.checkouts.items;
	const totalCount = data.checkouts.totalItems;
	const activeCount = items.filter((c) => c.status === CheckoutStatus.Active).length;
	const totalProducts = items.reduce((acc, c) => acc + c.productCount, 0);
	const totalPayments = items.reduce((acc, c) => acc + c.paymentCount, 0);

	return (
		<div className="flex flex-col gap-3">
			<PageHeader
				icon={<Icon icon={ShoppingCart01Icon} className="icon-md text-accent-foreground" />}
				title="Checkouts"
				description="Crie e gerencie seus links de pagamento"
				action={{
					label: 'Novo Checkout',
					icon: <Icon icon={AddCircleIcon} className="icon-sm" />,
					onPress: actions.goToNew,
				}}
			/>

			<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Total Checkouts</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-foreground">
							<AnimatedNumber value={totalCount} />
						</span>
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Ativos</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-success">
							<AnimatedNumber value={activeCount} />
						</span>
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Produtos Vinculados</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-foreground">
							<AnimatedNumber value={totalProducts} />
						</span>
					</Card.Content>
				</Card>
				<Card className="border border-border/80 bg-card">
					<Card.Content className="p-3">
						<span className="text-xs font-mono uppercase text-muted-foreground">Vendas Realizadas</span>
						<span className="mt-1 block text-lg font-bold font-mono tracking-tight text-foreground">
							<AnimatedNumber value={totalPayments} />
						</span>
					</Card.Content>
				</Card>
			</div>
			<DataTable
				columns={columns}
				data={data.checkouts.items}
				keyExtractor={(checkout) => checkout.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize}
				emptyMessage="Nenhum checkout encontrado"
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

