'use client';

import { useState } from 'react';
import { Button, Chip, Avatar, Tooltip } from '@heroui/react';
import Image from 'next/image';
import { Building02Icon, ServerStack01Icon, ViewIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import { UserRole } from '@/types/enums';
import {
	merchantStatusParse,
	merchantKycStatusParse,
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
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import { AnimatedNumber } from '@/components/ui/animated-number';

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
	const {
		currentUserRole,
		isActionPending,
		onView,
		onEvaluate,
		onActivate,
		onSuspend,
		onInactivate,
		onSetAcquirer,
	} = config;

	return [
		{
			key: 'organization',
			header: 'Organização',
			render: (merchant) => (
				<div className="flex items-center gap-3">
					<Avatar size="sm" className="bg-white/5 border border-white/10 text-white">
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
							className="font-bold text-sm text-white truncate"
						/>
						{merchant.document ? (
							<DocumentDisplay document={merchant.document} className="text-xs text-white/50" />
						) : (
							<EmailLink email={merchant.email} className="text-xs text-white/50" fallback="-" />
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
					<span className="text-sm font-medium text-white">{merchant.userName || '-'}</span>
					<EmailLink email={merchant.userEmail} className="text-xs text-white/50" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (merchant) => (
				<RevolutStatusBadge
					status={merchant.status}
					label={merchantStatusParse[merchant.status]?.label}
				/>
			),
		},
		{
			key: 'kyc',
			header: 'KYC',
			render: (merchant) => (
				<RevolutStatusBadge
					status={merchant.kycStatus}
					label={merchantKycStatusParse[merchant.kycStatus]?.label}
				/>
			),
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
							<Icon icon={ServerStack01Icon} className="icon-sm text-white/50" />
						)}
						<div className="flex min-w-0 flex-col">
							<Tooltip>
								<span className="truncate font-medium text-white">{merchant.acquirerName}</span>
								<Tooltip.Content>{merchant.acquirerName}</Tooltip.Content>
							</Tooltip>
							<ProviderCategoryChip category={merchant.acquirerProviderCategory} size="sm" />
							{merchant.acquirerNominal && (
								<Tooltip>
									<span className="truncate font-mono text-xs text-white/50">{merchant.acquirerNominal}</span>
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
						<span className="text-sm text-white/50">-</span>
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
					<span className="text-sm font-bold font-mono text-white tabular-nums">{formatCurrency(merchant.lifetimeVolume)}</span>
					<span className="text-xs text-warning font-mono">{formatCurrency(merchant.totalFeesPaid)} em taxas</span>
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
					<span className={`text-sm font-bold font-mono tabular-nums ${isNegative ? 'text-danger' : 'text-success'}`}>
						{isNegative ? '-' : ''}{formatCurrency(Math.abs(balance))}
					</span>
				);
			},
		},
		{
			key: 'feeRate',
			header: 'Taxa PIX',
			render: (merchant) => (
				<span className="text-sm font-mono text-white tabular-nums">{formatFeeRate(merchant.pixApiFeeMode, merchant.pixApiFeeFixed, merchant.pixApiFeePercentage)}</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (merchant) => (
				<div className="flex items-center gap-2 text-xs font-mono text-white/50">{formatDate(merchant.createdAt)}</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (merchant) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => onView(merchant.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>
					<MerchantActionsDropdown
						merchant={merchant}
						currentUserRole={currentUserRole}
						isPending={isActionPending}
						onlyIcon={true}
						onActivate={() => onActivate(merchant)}
						onSuspend={() => onSuspend(merchant)}
						onInactivate={() => onInactivate(merchant)}
						onEvaluate={() => onEvaluate(merchant.id)}
						onSetAcquirer={() => onSetAcquirer(merchant)}
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
			className={`rounded-xl border border-white/12 bg-card p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<span className="font-medium text-white">{merchant.name || 'Sem nome'}</span>
					<RevolutStatusBadge status={merchant.status} label={statusParsed?.label} />
				</div>

				{merchant.document ? (
					<DocumentDisplay document={merchant.document} className="text-sm text-white/70" />
				) : (
					<span className="text-sm text-white/50">{merchant.email || '-'}</span>
				)}

				<div className="flex items-center gap-2">
					<RevolutStatusBadge status={merchant.kycStatus} label={kycStatusParsed?.label} />
					{merchant.isNominalAbTestActive && (
						<Chip variant="soft" color="warning" size="sm" className="gap-1 min-w-18 w-fit shrink-0 justify-center text-center whitespace-nowrap">
							A/B ativo
						</Chip>
					)}
				</div>

				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-col">
						<span className="text-xs text-white/50">Volume</span>
						<span className="text-sm font-bold font-mono text-white tabular-nums">{formatCurrency(merchant.lifetimeVolume)}</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs text-white/50">Saldo</span>
						<span className={`text-sm font-bold font-mono tabular-nums ${isNegativeBalance ? 'text-danger' : 'text-success'}`}>
							{isNegativeBalance ? '-' : ''}{formatCurrency(Math.abs(merchant.availableBalance))}
						</span>
					</div>
				</div>

				<span className="text-xs text-white/50">{formatDate(merchant.createdAt)}</span>
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

	const merchants = data.items.items;
	const totalMerchants = data.items.totalItems;
	const activeMerchants = merchants.filter((m) => merchantStatusParse[m.status]?.label === 'Ativo').length;
	const totalVolume = merchants.reduce((acc, m) => acc + (m.lifetimeVolume ?? 0), 0);
	const kycPendingCount = merchants.filter((m) => m.kycStatus === 'Pending' || m.kycStatus === 'UnderReview').length;

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
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={Building02Icon} className="icon-sm text-link" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Organizações</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Gerencie as organizações da plataforma.</p>
				</div>

			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Organizações
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={Building02Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalMerchants} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Cadastradas</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Ativas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-success tracking-tight tabular-nums block">
							<AnimatedNumber value={activeMerchants} />
						</span>
						<p className="text-xs text-success/80 font-mono mt-0.5">Operando</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Volume
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{formatCurrency(totalVolume)}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Faturamento listado</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							KYC Pendente
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
							<Icon icon={Tag01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-warning tracking-tight tabular-nums block">
							<AnimatedNumber value={kycPendingCount} />
						</span>
						<p className="text-xs text-warning/80 font-mono mt-0.5">Aguardando análise</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
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
			</div>

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
