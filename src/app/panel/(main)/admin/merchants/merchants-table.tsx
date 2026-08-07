'use client';

import { Button, Chip, Avatar, Tooltip } from '@heroui/react';
import Image from 'next/image';
import { Building02Icon, ServerStack01Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import { UserRole } from '@/types/enums';
import {
	merchantStatusParse,
	merchantKycStatusParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency, formatFeeRate } from '@/utils/currency';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmailLink, DocumentDisplay } from '@/components/ui/data-links';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { MerchantActionsDropdown, MerchantActionButtons } from '@/components/admin/merchant-actions-dropdown';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';
import { SetAcquirerModal } from '@/components/admin/set-acquirer-modal';
import { useMerchantsTable } from './use-merchants-table';
import type { Filters } from './page';

interface MerchantsTableProps {
	initialFilters: Filters;
	currentUserRole?: UserRole;
}

const statusOptions = parseToFilterOptions(merchantStatusParse, 'Todos os status');
const kycStatusOptions = parseToFilterOptions(merchantKycStatusParse, 'Todos os KYC');

interface ColumnsConfig {
	currentUserRole: UserRole;
	isActionPending: boolean;
	onView: (merchantId: string) => void;
	onEvaluate: (merchantId: string) => void;
	onActivate: (merchant: AdminMinimalMerchant) => void;
	onSuspend: (merchant: AdminMinimalMerchant) => void;
	onInactivate: (merchant: AdminMinimalMerchant) => void;
	onSetAcquirer: (merchant: AdminMinimalMerchant) => void;
}

function getColumns(config: ColumnsConfig): DataTableColumn<AdminMinimalMerchant>[] {
	return [
		{
			key: 'organization',
			header: 'Organização',
			render: (merchant) => (
				<div className="flex items-center gap-3">
					<Avatar size="sm">
						<Avatar.Fallback>
							{merchant.name
								? merchant.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2)
								: 'OR'}
						</Avatar.Fallback>
					</Avatar>
					<div className="flex flex-col">
						<AdminMerchantLink
							merchantId={merchant.id}
							name={merchant.name}
							className="font-medium text-accent hover:underline"
						/>
						{merchant.document ? (
							<DocumentDisplay document={merchant.document} className="text-sm" />
						) : (
							<EmailLink email={merchant.email} className="text-sm" fallback="-" />
						)}
					</div>
				</div>
			),
		},
		{
			key: 'owner',
			header: 'Proprietário',
			sortable: false,
			render: (merchant) => (
				<div className="flex flex-col">
					<span className="font-medium text-foreground">{merchant.userName || '-'}</span>
					<EmailLink email={merchant.userEmail} className="text-sm" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (merchant) => {
				const statusParsed = merchantStatusParse[merchant.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'kyc',
			header: 'KYC',
			render: (merchant) => {
				const kycStatusParsed = merchantKycStatusParse[merchant.kycStatus];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(kycStatusParsed.color)} size="sm" className="gap-1">
						{kycStatusParsed.icon}
						{kycStatusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'acquirer',
			header: 'Processadora',
			sortable: false,
			render: (merchant) =>
				merchant.acquirerName ? (
					<div className="flex min-w-0 max-w-56 items-center gap-2 text-sm">
						{merchant.acquirerLogoUrl ? (
							<Image
								src={merchant.acquirerLogoUrl}
								alt={merchant.acquirerName}
								width={20}
								height={20}
								className="rounded object-contain"
							/>
						) : (
							<Icon icon={ServerStack01Icon} className="icon-sm text-muted" />
						)}
						<div className="flex min-w-0 flex-col">
							<Tooltip>
								<span className="truncate font-medium text-foreground">{merchant.acquirerName}</span>
								<Tooltip.Content>{merchant.acquirerName}</Tooltip.Content>
							</Tooltip>
							<ProviderCategoryChip category={merchant.acquirerProviderCategory} size="sm" />
							{merchant.acquirerNominal && (
								<Tooltip>
									<span className="truncate font-mono text-xs text-muted">{merchant.acquirerNominal}</span>
									<Tooltip.Content>{merchant.acquirerNominal}</Tooltip.Content>
								</Tooltip>
							)}
							{merchant.isNominalAbTestActive && (
								<Chip
									size="sm"
									variant="soft"
									color="warning"
									className="mt-1 h-5 min-w-18 w-fit shrink-0 justify-center text-center whitespace-nowrap text-xs"
								>
									A/B ativo
								</Chip>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-1">
						<span className="text-sm text-muted">-</span>
						{merchant.isNominalAbTestActive && (
							<Chip
								size="sm"
								variant="soft"
								color="warning"
								className="h-5 min-w-18 w-fit shrink-0 justify-center text-center whitespace-nowrap text-xs"
							>
								A/B ativo
							</Chip>
						)}
					</div>
				),
		},
		{
			key: 'volume',
			header: 'Faturamento / Taxas',
			render: (merchant) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium">{formatCurrency(merchant.lifetimeVolume)}</span>
					<span className="text-xs text-warning">{formatCurrency(merchant.totalFeesPaid)} em taxas</span>
				</div>
			),
		},
		{
			key: 'balance',
			header: 'Saldo Disponível',
			render: (merchant) => {
				const balance = merchant.availableBalance;
				const isNegative = balance < 0;
				return (
					<span className={`font-medium ${isNegative ? 'text-danger' : 'text-success'}`}>
						{isNegative ? '-' : ''}{formatCurrency(Math.abs(balance))}
					</span>
				);
			},
		},
		{
			key: 'feeRate',
			header: 'Taxa PIX',
			render: (merchant) => (
				<span className="text-sm">
					{formatFeeRate(merchant.pixApiFeeMode, merchant.pixApiFeeFixed, merchant.pixApiFeePercentage)}
				</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (merchant) => (
				<div className="flex items-center gap-2 text-sm text-muted">{formatDate(merchant.createdAt)}</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (merchant) => (
				<div className="flex flex-row gap-x-2 justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => config.onView(merchant.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					<MerchantActionsDropdown
						merchant={merchant}
						currentUserRole={config.currentUserRole}
						isPending={config.isActionPending}
						onlyIcon={true}
						onActivate={() => config.onActivate(merchant)}
						onSuspend={() => config.onSuspend(merchant)}
						onInactivate={() => config.onInactivate(merchant)}
						onEvaluate={() => config.onEvaluate(merchant.id)}
						onSetAcquirer={() => config.onSetAcquirer(merchant)}
					/>
				</div>
			),
		},
	];
}

function renderMobileMerchantCard(merchant: AdminMinimalMerchant, _index: number, openActions?: () => void) {
	const statusParsed = merchantStatusParse[merchant.status];
	const kycStatusParsed = merchantKycStatusParse[merchant.kycStatus];
	const isNegativeBalance = merchant.availableBalance < 0;

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
				<div className="flex items-start justify-between gap-2">
					<span className="font-medium">{merchant.name || 'Sem nome'}</span>
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				</div>

				{merchant.document ? (
					<DocumentDisplay document={merchant.document} className="text-sm" />
				) : (
					<span className="text-sm text-muted">{merchant.email || '-'}</span>
				)}

				<div className="flex items-center gap-2">
					<Chip variant="soft" color={mapParseColorToChipColor(kycStatusParsed.color)} size="sm" className="gap-1">
						{kycStatusParsed.icon}
						{kycStatusParsed.label}
					</Chip>
					{merchant.isNominalAbTestActive && (
						<Chip variant="soft" color="warning" size="sm" className="gap-1 min-w-18 w-fit shrink-0 justify-center text-center whitespace-nowrap">
							A/B ativo
						</Chip>
					)}
				</div>

				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-col">
						<span className="text-xs text-muted">Volume</span>
						<span className="text-sm font-medium">{formatCurrency(merchant.lifetimeVolume)}</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs text-muted">Saldo</span>
						<span className={`text-sm font-medium ${isNegativeBalance ? 'text-danger' : 'text-success'}`}>
							{isNegativeBalance ? '-' : ''}{formatCurrency(Math.abs(merchant.availableBalance))}
						</span>
					</div>
				</div>

				<span className="text-xs text-muted">{formatDate(merchant.createdAt)}</span>
			</div>
		</div>
	);
}

export function MerchantsTable({ initialFilters, currentUserRole = UserRole.Admin }: MerchantsTableProps) {
	const { data, filters: tableFilters, modals, actions, context } = useMerchantsTable({ initialFilters });

	const columns = getColumns({
		currentUserRole,
		isActionPending: context.isActionPending,
		onView: actions.viewMerchant,
		onEvaluate: actions.evaluateMerchant,
		onActivate: modals.activate.open,
		onSuspend: modals.suspend.open,
		onInactivate: modals.inactivate.open,
		onSetAcquirer: modals.setAcquirer.open,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Nome, documento, email..."
				value={tableFilters.values.search ?? ''}
				onChange={(value) => tableFilters.update({ search: value || null })}
			/>

			<AsyncCombobox
				label="Proprietário"
				placeholder="Selecione um proprietário"
				searchPlaceholder="Buscar por nome ou email"
				searchValue={tableFilters.user.search}
				selectedValue={tableFilters.user.selectedName}
				isLoading={tableFilters.user.isLoading}
				options={tableFilters.user.options}
				value={tableFilters.values.userId ?? null}
				onSearchChange={tableFilters.user.onSearchChange}
				onChange={tableFilters.user.onChange}
			/>

			<SelectFilter
				label="Status"
				value={tableFilters.values.status ?? 'all'}
				options={statusOptions}
				onChange={(value) => tableFilters.update({ status: value === 'all' ? null : value })}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="KYC"
				value={tableFilters.values.kycStatus ?? 'all'}
				options={kycStatusOptions}
				onChange={(value) => tableFilters.update({ kycStatus: value === 'all' ? null : value })}
				allLabel="Todos os KYC"
			/>

			<SelectFilter
				label="Por página"
				value={String(tableFilters.values.pageSize ?? 10)}
				options={pageSizeFilterOptions}
				onChange={(value) => tableFilters.update({ pageSize: Number(value) })}
				showChips={false}
			/>
		</>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Building02Icon} size={24} />}
				title="Organizações"
				description="Gerencie as organizações da plataforma."
			/>

			<DataTable
				columns={columns}
				data={data.items.items}
				keyExtractor={(merchant) => merchant.id}
				isLoading={data.isLoading}
				skeletonRows={tableFilters.values.pageSize ?? 10}
				emptyMessage="Nenhuma organização encontrada"
				minWidth="min-w-250"
				renderMobileCard={renderMobileMerchantCard}
				mobileActions={{
					title: (merchant) => merchant.name || 'Organização',
					subtitle: (merchant) => merchant.email || undefined,
					renderActions: (merchant, close) => (
						<div className="flex flex-col gap-2">
							<Button variant="secondary" className="w-full justify-start" onPress={() => { actions.viewMerchant(merchant.id); close(); }}>
								<Icon icon={ViewIcon} className="icon-sm" />
								Ver detalhes
							</Button>
							<MerchantActionButtons
								merchant={merchant}
								currentUserRole={currentUserRole}
								isPending={context.isActionPending}
								onActivate={() => { modals.activate.open(merchant); close(); }}
								onSuspend={() => { modals.suspend.open(merchant); close(); }}
								onInactivate={() => { modals.inactivate.open(merchant); close(); }}
								onEvaluate={() => { actions.evaluateMerchant(merchant.id); close(); }}
								onSetAcquirer={() => { modals.setAcquirer.open(merchant); close(); }}
							/>
						</div>
					),
				}}
				filters={{
					children: renderFiltersContent,
					hasFilters: tableFilters.hasFilters,
					onClear: tableFilters.clear,
					onRefresh: tableFilters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.items.page,
					pageSize: data.items.pageSize,
					totalItems: data.items.totalItems,
					totalPages: data.items.totalPages,
					onPageChange: (page) => tableFilters.update({ page }),
					sortBy: tableFilters.values.sortBy ?? undefined,
					sortOrder: tableFilters.values.sortOrder ?? undefined,
					onSortChange: (sortBy, sortOrder) => tableFilters.update({ sortBy, sortOrder, page: 1 }),
					isNavigating: data.isLoading,
				}}
			/>

			<ConfirmationModal
				isOpen={modals.activate.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.activate.close()}
				title="Ativar organização"
				description={`Tem certeza que deseja ativar a organização "${
					modals.activate.merchant?.name ?? 'Sem nome'
				}"? Ela poderá operar normalmente.`}
				status="success"
				confirmLabel="Ativar"
				isPending={context.isActionPending}
				onConfirm={modals.activate.confirm}
			/>

			<ConfirmationModal
				isOpen={modals.suspend.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.suspend.close()}
				title="Suspender organização"
				description={`Você está prestes a suspender a organização ${
					modals.suspend.merchant?.name || 'Sem nome'
				}. Ela não poderá operar enquanto estiver suspensa.`}
				confirmLabel="Suspender"
				status="warning"
				requireReason
				reasonLabel="Motivo da suspensão"
				reasonPlaceholder="Informe o motivo da suspensão..."
				isPending={context.isActionPending}
				onConfirm={modals.suspend.confirm}
			/>

			<ConfirmationModal
				isOpen={modals.inactivate.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.inactivate.close()}
				title="Inativar organização"
				description={`Você está prestes a inativar a organização ${
					modals.inactivate.merchant?.name || 'Sem nome'
				}. Ela não poderá operar enquanto estiver inativa.`}
				confirmLabel="Inativar"
				status="danger"
				requireReason
				reasonLabel="Motivo da inativação"
				reasonPlaceholder="Informe o motivo da inativação..."
				isPending={context.isActionPending}
				onConfirm={modals.inactivate.confirm}
			/>

			{modals.setAcquirer.merchant && (
				<SetAcquirerModal
					isOpen={modals.setAcquirer.isOpen}
					onOpenChange={(isOpen) => !isOpen && modals.setAcquirer.close()}
					merchantId={modals.setAcquirer.merchant.id}
					merchantName={modals.setAcquirer.merchant.name}
					currentAcquirerId={modals.setAcquirer.merchant.acquirerId}
					currentAcquirerName={modals.setAcquirer.merchant.acquirerName}
					onSuccess={tableFilters.refresh}
				/>
			)}


		</div>
	);
}

