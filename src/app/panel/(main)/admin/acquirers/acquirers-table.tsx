'use client';

import { useState, useActionState } from 'react';
import { Button, Chip, Avatar, Tooltip, Modal, ComboBox, Switch, Label, TextField, Input, ListBox, toast } from '@heroui/react';
import { ServerStack01Icon, PencilEdit01Icon, QrCodeIcon, BarCodeIcon, CreditCardIcon, Building02Icon, Wallet01Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { AcquirerMerchantsModal } from './acquirer-merchants-modal';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import { adminCreateAcquirer } from '@/app/actions/admin/acquirers';
import { AcquirerType, FeeChargeMode, UserRole } from '@/types/enums';
import {
	webhookAuthModeParse,
	acquirerOperationTypeParse,
	acquirerTypeParse,
	acquirerTypeProviderCategoryMap,
	providerCategoryParse,
	providerCategoryOptions,
	mapParseColorToChipColor,
	pageSizeFilterOptions,
	acquirerStatusOptions,
	acquirerStatusParse,
} from '@/parse';
import { formatCurrency, basisPointsToPercentage } from '@/utils/currency';
import { FormattedDate } from '@/components/ui/formatted-date';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { useAcquirersTable, type AcquirersTableFilters } from './use-acquirers-table';
import { AsyncButton } from '@/components/ui/async-button';
import { Routes } from '@/router/routes';
import { getAcquirerDisplayTitle, getAcquirerDisplaySubtitle } from '@/utils/acquirer-display';
import { ProviderCategory } from '@/types/enums';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';
interface AcquirersTableProps {
	initialFilters: AcquirersTableFilters;
	currentUserRole: UserRole;
}

function FeeDisplay({
	mode,
	fixed,
	percentage,
}: {
	mode: FeeChargeMode;
	fixed: number | null;
	percentage: number | null;
}) {
	const parts: string[] = [];

	if (mode === 'FixedOnly' || mode === 'FixedAndPercentage') {
		if (fixed != null) {
			parts.push(formatCurrency(fixed));
		}
	}

	if (mode === 'PercentageOnly' || mode === 'FixedAndPercentage') {
		if (percentage != null) {
			parts.push(`${basisPointsToPercentage(percentage)}%`);
		}
	}

	if (parts.length === 0) {
		return <span className="text-sm text-muted">—</span>;
	}

	return <span className="text-sm font-mono text-white tabular-nums">{parts.join(' + ')}</span>;
}

function FeeAndLimitDisplay({
	feeMode,
	feeFixed,
	feePercentage,
	minAmount,
	maxAmount,
}: {
	feeMode: FeeChargeMode | null;
	feeFixed: number | null;
	feePercentage: number | null;
	minAmount: number | null;
	maxAmount: number | null;
}) {
	const hasLimits = minAmount != null && maxAmount != null && minAmount > 0 && maxAmount > 0;
	const hasFee = feeMode != null;

	if (!hasLimits && !hasFee) {
		return <span className="text-sm text-muted">—</span>;
	}

	return (
		<div className="flex flex-col gap-0.5">
			{hasFee && feeMode && (
				<FeeDisplay
					mode={feeMode}
					fixed={feeFixed}
					percentage={feePercentage}
				/>
			)}
			{hasLimits && (
				<span className="text-xs font-mono text-white/50">
					Limite: {formatCurrency(minAmount)} - {formatCurrency(maxAmount)}
				</span>
			)}
		</div>
	);
}

function getColumns(
	onView: (id: string) => void,
	onViewMerchants: (acquirer: AdminAcquirerData) => void
): DataTableColumn<AdminAcquirerData>[] {
	return [
		{
			key: 'acquirer',
			header: 'Processadora',
			render: (acquirer) => (
				(() => {
					const title = getAcquirerDisplayTitle({
						displayName: acquirer.displayName ?? acquirer.name,
						nominal: acquirer.nominal,
					});
					const subtitle = getAcquirerDisplaySubtitle({
						displayName: acquirer.displayName ?? acquirer.name,
						nominal: acquirer.nominal,
					});

					return (
				<div className="flex items-center gap-3">
					{acquirer.logoUrl ? (
						<Avatar size="sm">
							<Avatar.Image src={acquirer.logoUrl} alt={acquirer.name} />
							<Avatar.Fallback>
								<Icon icon={ServerStack01Icon} size={20} className="text-accent" />
							</Avatar.Fallback>
						</Avatar>
					) : (
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
							<Icon icon={ServerStack01Icon} size={20} className="text-accent" />
						</div>
					)}
					<div className="flex flex-col gap-0.5">
						<span className="font-mono text-xs text-muted">{acquirer.code}</span>
						<span className="text-sm text-white">{title}</span>
						<span className="text-xs text-white/50">{subtitle}</span>
					</div>
				</div>
					);
				})()
			),
		},
		{
			key: 'type',
			header: 'Tipo',
			render: (acquirer) => (
								<div className="flex flex-wrap gap-1">
					{acquirer.operationTypes.map((type) => {
						const parsed = acquirerOperationTypeParse[type];
						return (
							<span key={type} className="font-mono text-xs text-white/70">
								{parsed?.label ?? type}
							</span>
						);
					})}
				</div>
			),
		},
		{
			key: 'category',
			header: 'Categoria',
			render: (acquirer) => <ProviderCategoryChip category={acquirer.providerCategory} />,
		},
		{
			key: 'status',
			header: 'Status',
			render: (acquirer) => (
				<RevolutStatusBadge status={acquirer.isActive ? 'Active' : 'Inactive'} />
			),
		},
		{
			key: 'features',
			header: 'Operações PIX',
			render: (acquirer) => {
				return (
					<div className="flex flex-wrap items-center gap-1.5">
						{acquirer.supportsPix && (
							<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
								<Icon icon={QrCodeIcon} className="icon-xs" />
								PIX In
							</span>
						)}
						{acquirer.supportsWithdrawal && (
							<span className="inline-flex items-center gap-1 rounded-full border border-[#494fdf]/20 bg-[#494fdf]/10 px-2 py-0.5 text-[11px] font-mono text-[#4f55f1]">
								<Icon icon={Wallet01Icon} className="icon-xs" />
								PIX Out
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'pixFees',
			header: 'PIX',
			render: (acquirer) => {
				if (!acquirer.supportsPix) {
					return <span className="text-sm text-muted">—</span>;
				}
				return (
					<FeeAndLimitDisplay
						feeMode={acquirer.pixInFeeMode}
						feeFixed={acquirer.pixInFeeFixed}
						feePercentage={acquirer.pixInFeePercentage}
						minAmount={acquirer.minPixAmount}
						maxAmount={acquirer.maxPixAmount}
					/>
				);
			},
		},
		{
			key: 'payoutFees',
			header: 'Taxa Saque',
			render: (acquirer) => {
				if (!acquirer.payoutFeeMode) {
					return <span className="text-sm text-muted">—</span>;
				}
				return (
					<div className="flex flex-col">
						<FeeDisplay
							mode={acquirer.payoutFeeMode}
							fixed={acquirer.payoutFeeFixed}
							percentage={acquirer.payoutFeePercentage}
						/>
					</div>
				);
			},
		},
		{
			key: 'webhookAuth',
			header: 'Autenticação Webhook',
			render: (acquirer) => {
				const webhookAuthParsed = webhookAuthModeParse[acquirer.webhookAuthMode];
				return (
					<span className="font-mono text-xs text-white/70">{webhookAuthParsed.label}</span>
				);
			},
		},
		{
			key: 'totalMerchants',
			header: 'Organizações',
			render: (acquirer) => <span className="text-sm text-foreground">{acquirer.totalMerchants}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (acquirer) => (
				<div className="flex items-center gap-2 text-sm text-muted">
					<FormattedDate date={acquirer.createdAt} />
				</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (acquirer) => (
				<div className="flex flex-row gap-x-2 justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => onViewMerchants(acquirer)}>
							<Icon icon={Building02Icon} className="icon-sm" />
							<Tooltip.Content>Ver Organizações</Tooltip.Content>
						</Button>
					</Tooltip>
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => onView(acquirer.id)}>
							<Icon icon={PencilEdit01Icon} className="icon-sm" />
							<Tooltip.Content>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileAcquirerCard(acquirer: AdminAcquirerData, _index: number, openActions?: () => void) {
	const title = getAcquirerDisplayTitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});
	const subtitle = getAcquirerDisplaySubtitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});

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
			<div className="flex flex-col gap-2">
				<div className="flex items-start gap-2">
					{acquirer.logoUrl ? (
					<Avatar size="sm" className="shrink-0">
						<Avatar.Image src={acquirer.logoUrl} alt={acquirer.name} />
						<Avatar.Fallback>
							<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
						</Avatar.Fallback>
					</Avatar>
					) : (
						<div className="flex items-center justify-center size-10 rounded-lg bg-accent/10 shrink-0">
							<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
						</div>
					)}
					<div className="flex min-w-0 flex-col gap-0.5">
						<span className="font-mono text-xs text-muted">{acquirer.code}</span>
						<span className="truncate text-sm font-medium text-foreground">{title}</span>
						<span className="truncate text-xs text-muted">{subtitle}</span>
					</div>
				</div>
				<div className="flex flex-wrap gap-1">
					{acquirer.operationTypes.map((type) => {
						const parsed = acquirerOperationTypeParse[type];
						return (
							<span key={type} className="font-mono text-xs text-white/70">
								{parsed.label}
							</span>
						);
					})}
				</div>
				<span className="font-mono text-xs text-white/70">
					{acquirerStatusParse[String(acquirer.isActive) as 'true' | 'false'].label}
				</span>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted">Funcionalidades:</span>
					<div className="flex flex-wrap gap-1">
											{acquirer.supportsPix && (
						<span className="font-mono text-xs text-white/70">PIX</span>
					)}
					{acquirer.supportsBoleto && (
						<span className="font-mono text-xs text-white/70">Boleto</span>
					)}
					{acquirer.supportsCreditCard && (
						<span className="font-mono text-xs text-white/70">Cartão</span>
					)}
					{acquirer.supportsWithdrawal && (
						<span className="font-mono text-xs text-white/70">Saque</span>
					)}
					</div>
				</div>
				{acquirer.pixInFeeMode && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted">Taxa PIX In:</span>
						<FeeDisplay
							mode={acquirer.pixInFeeMode}
							fixed={acquirer.pixInFeeFixed}
							percentage={acquirer.pixInFeePercentage}
						/>
					</div>
				)}
				{acquirer.payoutFeeMode && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted">Taxa Saque:</span>
						<FeeDisplay
							mode={acquirer.payoutFeeMode}
							fixed={acquirer.payoutFeeFixed}
							percentage={acquirer.payoutFeePercentage}
						/>
					</div>
				)}
				<div className="flex items-center gap-1.5">
					<Icon icon={Building02Icon} className="icon-xs text-muted shrink-0" />
					<span className="text-xs text-muted">{acquirer.totalMerchants} organizações</span>
				</div>
				<FormattedDate date={acquirer.createdAt} className="text-xs text-muted" />
			</div>
		</div>
	);
}

export function AcquirersTable({ initialFilters, currentUserRole }: AcquirersTableProps) {
	const router = useRouter();
	const { data, filters, actions } = useAcquirersTable({ initialFilters });
	const [isMerchantsModalOpen, setIsMerchantsModalOpen] = useState(false);
	const [selectedAcquirer, setSelectedAcquirer] = useState<AdminAcquirerData | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [acquirerTypeSearch, setAcquirerTypeSearch] = useState('');
	const [createTypeCategoryFilter, setCreateTypeCategoryFilter] = useState<'all' | ProviderCategory>('all');
	const [createFormData, setCreateFormData] = useState({
		acquirerType: null as AcquirerType | null,
		displayName: '',
		pixEnabled: true,
	});
	const [createState, createAction, isCreating] = useActionState(
		async (_prev: { error: string | null }) => {
			if (!createFormData.acquirerType) return { error: 'Tipo de processadora é obrigatório' };
			if (!createFormData.displayName.trim()) return { error: 'Nome de exibição é obrigatório' };
			const response = await adminCreateAcquirer({
				acquirerType: createFormData.acquirerType,
				displayName: createFormData.displayName.trim(),
				pixEnabled: true,
				boletoEnabled: false,
				creditCardEnabled: false,
			});
			if (response?.error) return { error: response.error.message };
			toast('Processadora criada', { description: response?.message ?? 'A processadora foi criada com sucesso.', variant: 'success' });
			setIsCreateModalOpen(false);
			if (response?.data?.id) {
				router.push(Routes.panel.admin.acquirerDetails(response.data.id));
			} else {
				filters.refresh();
			}
			return { error: null };
		},
		{ error: null }
	);

	const openCreateModal = () => {
		setCreateFormData({
			acquirerType: null,
			displayName: '',
			pixEnabled: true,
		});
		setAcquirerTypeSearch('');
		setCreateTypeCategoryFilter('all');
		setIsCreateModalOpen(true);
	};

	function handleViewMerchants(acquirer: AdminAcquirerData) {
		setSelectedAcquirer(acquirer);
		setIsMerchantsModalOpen(true);
	}

	const acquirerTypeItems = Object.values(AcquirerType)
		.filter((type) => {
			const typeCategory = acquirerTypeProviderCategoryMap[type];
			const matchesCategory = createTypeCategoryFilter === 'all' || typeCategory === createTypeCategoryFilter;
			if (!matchesCategory) {
				return false;
			}

			const label = acquirerTypeParse[type]?.label ?? type;
			return !acquirerTypeSearch.trim() || label.toLowerCase().includes(acquirerTypeSearch.toLowerCase());
		})
		.map((type) => ({ id: type }));

	const createTypeCategoryTabItems = [
		{ id: 'all', label: 'Todos' },
		...Object.entries(providerCategoryParse).map(([key, value]) => ({
			id: key,
			label: value.label,
			icon: value.icon,
		})),
	];

	const columns = getColumns(actions.goToDetails, handleViewMerchants);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				placeholder="Nome, código..."
				value={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value || null })}
			/>

			<SelectFilter
				label="Categoria"
				value={filters.values.providerCategory ?? 'all'}
				options={providerCategoryOptions}
				onChange={(value) =>
					filters.update({
						providerCategory: value === 'all' ? null : (value as ProviderCategory),
					})
				}
				showChips={true}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.isActive === false ? 'false' : 'true'}
				options={acquirerStatusOptions}
				onChange={(value) => filters.update({ isActive: value === 'false' ? false : true })}
				showChips={true}
			/>

			<SelectFilter
				label="Por página"
				value={String(filters.values.pageSize ?? 10)}
				options={pageSizeFilterOptions}
				onChange={(value) => filters.update({ pageSize: Number(value), page: filters.values.page })}
				showChips={false}
			/>
		</>
	);

	const items = data.acquirers.items;
	const totalAcquirers = data.acquirers.totalItems;
	const activeAcquirers = items.filter((a) => a.isActive).length;
	const totalMerchantsLinked = items.reduce((sum, a) => sum + (a.totalMerchants ?? 0), 0);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={ServerStack01Icon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Processadoras PIX</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gestão de gateways de liquidação, PixHub, roteamento e chaves de integração
					</p>
				</div>

				{currentUserRole === UserRole.God && (
					<button
						type="button"
						onClick={openCreateModal}
						className="button-primary cursor-pointer text-xs self-start sm:self-auto"
					>
						<Icon icon={Add01Icon} className="icon-xs" />
						<span>+ Nova Processadora</span>
					</button>
				)}
			</div>

			{/* 3-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* Total */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total Cadastradas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={ServerStack01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{totalAcquirers}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Gateways e adquirentes</p>
					</div>
				</div>

				{/* Ativas */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Operando PIX SPI
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={QrCodeIcon} className="icon-xs text-[#00a87e]" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							{activeAcquirers}
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Captura ativa em produção</p>
					</div>
				</div>

				{/* Organizações */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Organizações Vinculadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Building02Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{totalMerchantsLinked}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Sellers com roteamento ativo</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
			<DataTable
				className="rounded-[24px] border border-white/12 bg-[#16181a]"
				columns={columns}
				data={data.acquirers.items}
				keyExtractor={(acquirer) => acquirer.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize ?? 10}
				emptyMessage="Nenhuma processadora encontrada"
				minWidth="min-w-250"
				renderMobileCard={renderMobileAcquirerCard}
				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.acquirers.page,
					pageSize: data.acquirers.pageSize,
					totalItems: data.acquirers.totalItems,
					totalPages: data.acquirers.totalPages,
					onPageChange: (page) => filters.update({ page }),
					sortBy: filters.values.sortBy,
					sortOrder: filters.values.sortOrder,
					onSortChange: (sortBy, sortOrder) => filters.update({ sortBy, sortOrder, page: 1 }),
					isNavigating: data.isLoading,
				}}
			/>
		</div>

			{selectedAcquirer && (
				<AcquirerMerchantsModal
					isOpen={isMerchantsModalOpen}
					onOpenChange={setIsMerchantsModalOpen}
					acquirerId={selectedAcquirer.id}
					acquirerDisplayName={selectedAcquirer.displayName ?? selectedAcquirer.name}
					acquirerNominal={selectedAcquirer.nominal}
				/>
			)}

			<Modal.Backdrop isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-md rounded-[28px] border border-white/12 bg-[#16181a] p-6 text-white">
						<Modal.CloseTrigger className="text-white/40 hover:text-white" />
						<Modal.Header className="pb-4 border-b border-white/8">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
									<Icon icon={Add01Icon} className="icon-md" />
								</div>
								<div>
									<Modal.Heading className="text-base font-bold text-white">Nova Processadora PIX</Modal.Heading>
									<p className="text-xs text-white/50">Cria uma nova instância de roteamento PIX.</p>
								</div>
							</div>
						</Modal.Header>
						<form action={createAction}>
							<Modal.Body className="py-4">
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-2">
										<Label className="text-xs font-semibold text-white/70">Categoria do Tipo</Label>
										<InternalTagTabs
											ariaLabel="Categoria do tipo de processadora"
											selectedKey={createTypeCategoryFilter}
											onSelectionChange={(key) => setCreateTypeCategoryFilter(key as 'all' | ProviderCategory)}
											items={createTypeCategoryTabItems}
											className={isCreating ? 'pointer-events-none opacity-60' : undefined}
										/>
									</div>

									<ComboBox
										className="w-full"
										allowsCustomValue={false}
										allowsEmptyCollection
										inputValue={acquirerTypeSearch}
										onInputChange={setAcquirerTypeSearch}
										items={acquirerTypeItems}
										selectedKey={createFormData.acquirerType || null}
										onSelectionChange={(key) => {
											const type = (key as AcquirerType | null) ?? null;
											setCreateFormData((prev) => ({ ...prev, acquirerType: type }));
											setAcquirerTypeSearch(type ? (acquirerTypeParse[type]?.label ?? String(type)) : '');
										}}
										isDisabled={isCreating}
										menuTrigger="focus"
									>
										<Label className="text-xs font-semibold text-white/70">Tipo de Processadora</Label>
										<ComboBox.InputGroup className="rounded-xl border border-white/10 bg-[#0a0a0a]">
											<Input variant="secondary" className="text-xs text-white" placeholder="Buscar tipo de processadora..." />
											<ComboBox.Trigger className="text-white/40" />
										</ComboBox.InputGroup>
										<ComboBox.Popover className="rounded-xl border border-white/12 bg-[#16181a]">
											<ListBox
												items={acquirerTypeItems}
												renderEmptyState={() => (
													<p className="p-4 text-center text-xs text-white/40">Nenhum tipo encontrado</p>
												)}
											>
												{(item) => (
													<ListBox.Item key={item.id} textValue={acquirerTypeParse[item.id]?.label ?? item.id} className="text-xs text-white hover:bg-white/5">
														<Chip
															variant="soft"
															color={mapParseColorToChipColor(acquirerTypeParse[item.id]?.color ?? 'default')}
															size="sm"
															className="gap-1 font-mono"
														>
															{acquirerTypeParse[item.id]?.icon}
															{acquirerTypeParse[item.id]?.label ?? item.id}
														</Chip>
														<ListBox.ItemIndicator />
													</ListBox.Item>
												)}
											</ListBox>
										</ComboBox.Popover>
									</ComboBox>
									<TextField variant="secondary">
										<Label className="text-xs font-semibold text-white/70">Nome de Exibição</Label>
										<Input
											variant="secondary"
											className="rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-white"
											placeholder="Ex: PixHub Primary SPI"
											value={createFormData.displayName}
											onChange={(e) => setCreateFormData((prev) => ({ ...prev, displayName: e.target.value }))}
											disabled={isCreating}
										/>
									</TextField>
									<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Icon icon={QrCodeIcon} className="icon-xs text-[#00a87e]" />
											<span className="text-xs font-bold text-white">Captura PIX Instantânea</span>
										</div>
										<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
											Habilitado
										</span>
									</div>
									{createState.error && (
										<p className="text-xs font-mono text-[#e23b4a]">{createState.error}</p>
									)}
								</div>
							</Modal.Body>
							<Modal.Footer className="pt-4 border-t border-white/8 flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsCreateModalOpen(false)}
									disabled={isCreating}
									className="button-outline-dark cursor-pointer text-xs"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isCreating}
									className="button-primary cursor-pointer text-xs"
								>
									{isCreating ? 'Criando...' : 'Criar Processadora'}
								</button>
							</Modal.Footer>
						</form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

