'use client';

import { useState, useActionState } from 'react';
import { Button, Chip, Avatar, Tooltip, Modal, ComboBox, Switch, Label, TextField, Input, ListBox, toast } from '@heroui/react';
import { ServerStack01Icon, PencilEdit01Icon, QrCodeIcon, BarCodeIcon, CreditCardIcon, Building02Icon, Wallet01Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
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

	return <span className="text-sm text-foreground">{parts.join(' + ')}</span>;
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
				<span className="text-xs text-muted">
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
						<span className="text-sm font-medium text-foreground">{title}</span>
						<span className="text-xs text-muted">{subtitle}</span>
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
							<Chip key={type} variant="soft" size="sm" className={`gap-0.5 ${parsed?.className ?? ''}`}>
								{parsed?.icon}
								{parsed?.label ?? type}
							</Chip>
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
			render: (acquirer) => {
				const statusKey = acquirer.isActive ? 'true' : 'false';
				const parsed = acquirerStatusParse[statusKey];
				return (
					<Chip variant="soft" size="sm" color={mapParseColorToChipColor(parsed.color)} className="gap-0.5">
						{parsed.icon}
						{parsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'features',
			header: 'Funcionalidades',
			render: (acquirer) => {
				const features = [
					{ key: 'pix', label: 'PIX', icon: QrCodeIcon, supported: acquirer.supportsPix },
					{ key: 'boleto', label: 'Boleto', icon: BarCodeIcon, supported: acquirer.supportsBoleto },
					{ key: 'card', label: 'Cartão', icon: CreditCardIcon, supported: acquirer.supportsCreditCard },
					{ key: 'withdrawal', label: 'Saque', icon: Wallet01Icon, supported: acquirer.supportsWithdrawal },
				];

				return (
					<div className="flex flex-wrap gap-1">
						{features.map((feature) => (
							<Chip
								key={feature.key}
								variant={feature.supported ? 'primary' : 'soft'}
								color={feature.supported ? 'success' : 'default'}
								size="sm"
								className={`gap-0.5 ${!feature.supported ? 'opacity-50' : ''}`}
							>
								<Icon icon={feature.icon} size={14} />
								{feature.label}
							</Chip>
						))}
					</div>
				);
			},
		},
		{
			key: 'pixFees',
			header: 'PIX (Taxa/Limite)',
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
			key: 'boletoFees',
			header: 'Boleto (Taxa/Limite)',
			render: (acquirer) => {
				if (!acquirer.supportsBoleto) {
					return <span className="text-sm text-muted">—</span>;
				}
				return (
					<FeeAndLimitDisplay
						feeMode={acquirer.boletoInFeeMode}
						feeFixed={acquirer.boletoInFeeFixed}
						feePercentage={acquirer.boletoInFeePercentage}
						minAmount={acquirer.minBoletoAmount}
						maxAmount={acquirer.maxBoletoAmount}
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
					<Chip variant="soft" color={mapParseColorToChipColor(webhookAuthParsed.color)} size="sm" className="gap-1">
						{webhookAuthParsed.icon}
						{webhookAuthParsed.label}
					</Chip>
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
							<Chip
								key={type}
								variant="soft"
								color={mapParseColorToChipColor(parsed.color)}
								className="text-xs"
							>
								{parsed.label}
							</Chip>
						);
					})}
				</div>
				<Chip
					variant="soft"
					color={mapParseColorToChipColor(
						acquirerStatusParse[String(acquirer.isActive) as 'true' | 'false'].color
					)}
					className="text-xs w-fit"
				>
					{acquirerStatusParse[String(acquirer.isActive) as 'true' | 'false'].label}
				</Chip>
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted">Funcionalidades:</span>
					<div className="flex flex-wrap gap-1">
						{acquirer.supportsPix && (
							<Chip variant="soft" color="default" className="text-xs">
								PIX
							</Chip>
						)}
						{acquirer.supportsBoleto && (
							<Chip variant="soft" color="default" className="text-xs">
								Boleto
							</Chip>
						)}
						{acquirer.supportsCreditCard && (
							<Chip variant="soft" color="default" className="text-xs">
								Cartão
							</Chip>
						)}
						{acquirer.supportsWithdrawal && (
							<Chip variant="soft" color="default" className="text-xs">
								Saque
							</Chip>
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
		boletoEnabled: true,
		creditCardEnabled: true,
	});
	const [createState, createAction, isCreating] = useActionState(
		async (_prev: { error: string | null }) => {
			if (!createFormData.acquirerType) return { error: 'Tipo de processadora é obrigatório' };
			if (!createFormData.displayName.trim()) return { error: 'Nome de exibição é obrigatório' };
			const response = await adminCreateAcquirer({
				acquirerType: createFormData.acquirerType,
				displayName: createFormData.displayName.trim(),
				pixEnabled: createFormData.pixEnabled,
				boletoEnabled: createFormData.boletoEnabled,
				creditCardEnabled: createFormData.creditCardEnabled,
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
			boletoEnabled: true,
			creditCardEnabled: true,
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={ServerStack01Icon} size={24} />}
				title="Processadoras"
				description="Gerencie as processadoras de pagamento."
				actions={
					currentUserRole === UserRole.God && (
						<Button variant="primary" onPress={openCreateModal}>
							<Icon icon={Add01Icon} className="icon-sm" />
							Nova Processadora
						</Button>
					)
				}
			/>

			<DataTable
				columns={columns}
				data={data.acquirers.items}
				keyExtractor={(acquirer) => acquirer.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize ?? 10}
				emptyMessage="Nenhuma processadora encontrada"
				minWidth="min-w-250"			renderMobileCard={renderMobileAcquirerCard}				filters={{
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
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={Add01Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Nova Processadora</Modal.Heading>
							<p className="text-sm text-muted">Cria uma nova instância de processadora.</p>
						</Modal.Header>
						<form action={createAction}>
							<Modal.Body>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-2">
										<Label>Categoria do Tipo</Label>
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
										<Label>Tipo de Processadora</Label>
										<ComboBox.InputGroup>
											<Input variant="secondary" placeholder="Buscar tipo de processadora..." />
											<ComboBox.Trigger />
										</ComboBox.InputGroup>
										<ComboBox.Popover>
											<ListBox
												items={acquirerTypeItems}
												renderEmptyState={() => (
													<p className="p-4 text-center text-sm text-muted">Nenhum tipo encontrado</p>
												)}
											>
												{(item) => (
													<ListBox.Item key={item.id} textValue={acquirerTypeParse[item.id]?.label ?? item.id}>
														<Chip
															variant="soft"
															color={mapParseColorToChipColor(acquirerTypeParse[item.id]?.color ?? 'default')}
															size="sm"
															className="gap-1"
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
										<Label>Nome de Exibição</Label>
										<Input
											variant="secondary"
											placeholder="Ex: ActivePayments Black"
											value={createFormData.displayName}
											onChange={(e) => setCreateFormData((prev) => ({ ...prev, displayName: e.target.value }))}
											disabled={isCreating}
										/>
									</TextField>
									<div className="flex flex-col gap-2">
										<Label className="text-sm font-medium">Métodos Habilitados</Label>
										<div className="flex flex-col gap-2">
											<Switch
												isSelected={createFormData.pixEnabled}
												onChange={(isSelected) => setCreateFormData((prev) => ({ ...prev, pixEnabled: isSelected }))}
												isDisabled={isCreating}
											>
												<Switch.Control>
													<Switch.Thumb />
												</Switch.Control>
												<Label className="text-sm">PIX</Label>
											</Switch>
											<Switch
												isSelected={createFormData.boletoEnabled}
												onChange={(isSelected) => setCreateFormData((prev) => ({ ...prev, boletoEnabled: isSelected }))}
												isDisabled={isCreating}
											>
												<Switch.Control>
													<Switch.Thumb />
												</Switch.Control>
												<Label className="text-sm">Boleto</Label>
											</Switch>
											<Switch
												isSelected={createFormData.creditCardEnabled}
												onChange={(isSelected) => setCreateFormData((prev) => ({ ...prev, creditCardEnabled: isSelected }))}
												isDisabled={isCreating}
											>
												<Switch.Control>
													<Switch.Thumb />
												</Switch.Control>
												<Label className="text-sm">Cartão de Crédito</Label>
											</Switch>
										</div>
									</div>
									{createState.error && (
										<p className="text-sm text-danger">{createState.error}</p>
									)}
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button
									variant="tertiary"
									onPress={() => setIsCreateModalOpen(false)}
									isDisabled={isCreating}
								>
									Cancelar
								</Button>
								<AsyncButton type="submit" variant="primary" isPending={isCreating}>
									Criar
								</AsyncButton>
							</Modal.Footer>
						</form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

