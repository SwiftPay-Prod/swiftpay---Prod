'use client';

import { useEffect, useState } from 'react';
import { Button, Tooltip, Dropdown } from '@heroui/react';
import {
	CancelCircleIcon,
	Settings02Icon,
	ViewIcon,
	MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import {
	payoutStatusParse,
	pixKeyTypeParse,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { CashoutDetailsModal } from './modals/cashout-details-modal';
import { CreateCashoutModal } from './modals/create-cashout-modal';
import { CancelCashoutModal } from './modals/cancel-cashout-modal';
import { AutomaticCashoutConfigModal } from './modals/automatic-cashout-config-modal';
import { useCashoutsTable } from './use-cashouts-table';
import { getMerchantSettings } from '@/app/actions/merchant/settings';
import { adminGetMerchantSettings } from '@/app/actions/admin/merchants';
import { listCashoutAccounts } from '@/app/actions/merchant/cashout-accounts';
import { AutomaticCashoutFrequency, PaymentEnvironment, PayoutAccountStatus, PayoutStatus } from '@/types/enums';
import type { CashoutListItem } from '@/types/merchant/cashouts';
import type { ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { ReadSettingsData } from '@/types/merchant/settings';
import type { AdminMerchantSettingsData } from '@/types/admin/merchants';
import type { ApiResponse } from '@/types/common';
import { useEnvironment } from '@/contexts/environment-context';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutPlusIcon,
	RevolutWalletIcon,
	RevolutCheckIcon,
	RevolutArrowUpRightIcon,
} from '@/components/ui/revolut-icons';

type SettingsPromise = Promise<ApiResponse<ReadSettingsData>>;
type PayoutAccountsPromise = Promise<ApiResponse<ListCashoutAccountsData>>;

function mapAdminToReadSettings(
	res: ApiResponse<AdminMerchantSettingsData> | undefined,
	environment: PaymentEnvironment,
): ApiResponse<ReadSettingsData> {
	if (!res?.data) return { data: null, message: res?.message ?? null, error: res?.error ?? null };
	const d = res.data;
	const isSandbox = environment === PaymentEnvironment.Sandbox;
	return {
		...res,
		data: {
			id: d.id,
			merchantId: d.merchantId,
			selfNominalSwitchEnabled: d.selfNominalSwitchEnabled,
			isAutomaticCashoutEnabled: isSandbox ? d.isAutomaticCashoutEnabledSandbox : (d.isAutomaticCashoutEnabled ?? false),
			automaticCashoutFrequency: (
				isSandbox
					? d.automaticCashoutFrequencySandbox
					: (d.automaticCashoutFrequency ?? AutomaticCashoutFrequency.Daily)
			) as AutomaticCashoutFrequency,
			automaticCashoutMinAmount: isSandbox ? d.automaticCashoutMinAmountSandbox : d.automaticCashoutMinAmount,
			automaticCashoutMaxAmount: isSandbox ? d.automaticCashoutMaxAmountSandbox : d.automaticCashoutMaxAmount,
			automaticCashoutPayoutAccountId: isSandbox ? d.automaticCashoutPayoutAccountIdSandbox : d.automaticCashoutPayoutAccountId,
			nextAutomaticCashoutAttemptAt: isSandbox
				? d.nextAutomaticCashoutAttemptAtSandbox
				: d.nextAutomaticCashoutAttemptAt,
			updatedAt: d.updatedAt,
		},
	};
}

interface CashoutsTableProps {
	merchantId: string;
	readOnly?: boolean;
}

interface ColumnsConfig {
	onView: (id: string) => void;
	onCancel: (cashout: CashoutListItem) => void;
	canCancel: (cashout: CashoutListItem) => boolean;
}

function getColumns(config: ColumnsConfig): DataTableColumn<CashoutListItem>[] {
	const { onView, onCancel, canCancel } = config;

	return [
		{
			key: 'id',
			header: 'ID / Chave PIX',
			render: (cashout) => {
				const payoutAccount = cashout.payoutAccount;
				const keyTypeParse = payoutAccount ? pixKeyTypeParse[payoutAccount.pixKeyType] : null;

				return (
					<div className="flex flex-col">
						<span className="font-mono text-xs text-white font-medium">{cashout.id.slice(0, 12)}...</span>
						{payoutAccount && (
							<span className="text-[11px] font-mono text-white/50 truncate max-w-44">
								{keyTypeParse?.label}: {payoutAccount.pixKey}
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'totalDebited',
			header: 'Total Debitado',
			render: (cashout) => (
				<div className="flex flex-col font-mono">
					<span className="font-bold text-white tabular-nums">{formatCurrency(cashout.amount)}</span>
					<span className="text-[11px] text-white/40">Taxa: {formatCurrency(cashout.feeAmount)}</span>
				</div>
			),
		},
		{
			key: 'netAmount',
			header: 'Valor Recebido',
			render: (cashout) => (
				<span className="font-bold font-mono text-[#00a87e] tabular-nums">{formatCurrency(cashout.netAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (cashout) => (
				<RevolutStatusBadge
					status={cashout.status}
					label={payoutStatusParse[cashout.status]?.label}
				/>
			),
		},
		{
			key: 'bank',
			header: 'Chave PIX',
			sortable: false,
			render: (cashout) => {
				const payoutAccount = cashout.payoutAccount;
				if (!payoutAccount) {
					return <span className="text-xs text-white/40">-</span>;
				}
				const keyTypeParse = pixKeyTypeParse[payoutAccount.pixKeyType];
				return (
					<div className="flex flex-col">
						<span className="text-xs font-semibold text-white truncate max-w-40">{keyTypeParse?.label}</span>
						<span className="text-[11px] font-mono text-white/50 truncate max-w-40">{payoutAccount.pixKey}</span>
					</div>
				);
			},
		},
		{
			key: 'requestedAt',
			header: 'Solicitado em',
			render: (cashout) => (
				<span className="text-xs font-mono text-white/50">{formatDate(cashout.requestedAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			sortable: false,
			render: (cashout) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => onView(cashout.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>

					{canCancel(cashout) && (
						<Dropdown>
							<Button
								isIconOnly
								aria-label="Mais ações"
								className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
							</Button>
							<Dropdown.Popover className="min-w-48 bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
								<Dropdown.Menu aria-label="Ações do saque">
									<Dropdown.Item id="cancel" textValue="Cancelar saque" className="text-[#e23b4a] hover:bg-white/10" onPress={() => onCancel(cashout)}>
										<Icon icon={CancelCircleIcon} className="icon-xs text-[#e23b4a]" />
										Cancelar saque
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					)}
				</div>
			),
		},
	];
}

function renderMobileCashoutCard(
	cashout: CashoutListItem,
	index: number,
	openActions?: () => void,
) {
	const payoutAccount = cashout.payoutAccount;
	const keyTypeParse = payoutAccount ? pixKeyTypeParse[payoutAccount.pixKeyType] : null;

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
					<span className="font-bold text-sm text-white truncate block">
						Saque PIX • {cashout.id.slice(0, 8)}...
					</span>
					<p className="mt-0.5 text-xs text-white/50 font-mono truncate">
						{formatDate(cashout.requestedAt)}
					</p>
				</div>
				<RevolutStatusBadge status={cashout.status} label={payoutStatusParse[cashout.status]?.label} />
			</div>

			<div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
				<div className="min-w-0">
					<p className="text-[11px] uppercase tracking-wider text-white/40">Total Debitado</p>
					<p className="mt-0.5 text-sm font-bold font-mono text-white truncate">{formatCurrency(cashout.amount)}</p>
					<p className="text-[11px] font-mono text-white/40">Taxa: {formatCurrency(cashout.feeAmount)}</p>
				</div>
				<div className="min-w-0">
					<p className="text-[11px] uppercase tracking-wider text-white/40">Valor Recebido</p>
					<p className="mt-0.5 text-sm font-bold font-mono text-[#00a87e] truncate">{formatCurrency(cashout.netAmount)}</p>
				</div>
			</div>

			{payoutAccount && (
				<div className="mt-2 border-t border-white/8 pt-2">
					<p className="text-[11px] text-white/40 uppercase tracking-wider">Conta PIX de Destino</p>
					<p className="mt-0.5 text-xs text-white/80 font-mono font-medium truncate">
						{keyTypeParse?.label}: {payoutAccount.pixKey}
					</p>
				</div>
			)}
		</div>
	);
}

export function CashoutsTable({ merchantId, readOnly = false }: CashoutsTableProps) {
	const { data, filters, payoutAccounts, modals, actions, context } = useCashoutsTable({ merchantId, readOnly });
	const { environment } = useEnvironment();

	const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState<boolean | null>(null);
	const [configModalOpen, setConfigModalOpen] = useState(false);
	const [settingsPromise, setSettingsPromise] = useState<SettingsPromise | null>(null);
	const [payoutAccountsPromise, setPayoutAccountsPromise] = useState<PayoutAccountsPromise | null>(null);

	useEffect(() => {
		let cancelled = false;
		const loader = readOnly
			? adminGetMerchantSettings(merchantId).then((res) => mapAdminToReadSettings(res, environment))
			: getMerchantSettings(merchantId);
		loader.then((res) => {
			if (!cancelled) {
				setIsAutoCashoutEnabled(res?.data?.isAutomaticCashoutEnabled ?? false);
			}
		});
		return () => { cancelled = true; };
	}, [merchantId, readOnly, environment]);

	function handleOpenConfig() {
		if (readOnly) {
			setSettingsPromise(adminGetMerchantSettings(merchantId).then((res) => mapAdminToReadSettings(res, environment)));
			setPayoutAccountsPromise(null);
		} else {
			setSettingsPromise(getMerchantSettings(merchantId));
			setPayoutAccountsPromise(listCashoutAccounts(merchantId, { statuses: [PayoutAccountStatus.Active] }));
		}
		setConfigModalOpen(true);
	}

	function handleConfigSuccess() {
		getMerchantSettings(merchantId).then((res) => {
			setIsAutoCashoutEnabled(res?.data?.isAutomaticCashoutEnabled ?? false);
		});
	}

	const columns = getColumns({
		onView: modals.details.open,
		onCancel: modals.cancel.open,
		canCancel: actions.canCancel,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="ID, chave PIX, endToEnd ou titular..."
				value={filters.values.search}
				onChange={(value) => filters.updateFilter('search', value)}
			/>

			<AsyncCombobox
				label="Conta de saque"
				placeholder="Selecione uma conta"
				searchPlaceholder="Buscar conta"
				searchValue={filters.values.payoutAccountSearch}
				selectedValue={payoutAccounts.selected?.pixKey}
				value={filters.values.payoutAccountId || null}
				isLoading={payoutAccounts.isLoading}
				options={payoutAccounts.items.map((account) => {
					const descriptionParts = [account.holderName, account.bankName].filter(Boolean);
					return {
						key: account.id,
						label: account.pixKey,
						description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : undefined,
					};
				})}
				onSearchChange={(value: string) => filters.updateFilter('payoutAccountSearch', value)}
				onChange={(key: string | null) => filters.updateFilter('payoutAccountId', key || '')}
			/>
			<SelectFilter
				label="Por página"
				value={filters.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={(value) => filters.updateFilter('pageSize', value || '10')}
				showChips={false}
			/>
		</>
	);

	const rows = data.items.items;
	const totalDebited = rows.reduce((acc, item) => acc + item.amount, 0);
	const completedNet = rows.filter((item) => item.status === PayoutStatus.Completed).reduce((acc, item) => acc + item.netAmount, 0);
	const totalFees = rows.reduce((acc, item) => acc + item.feeAmount, 0);
	const totalRequests = data.items.totalItems;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<RevolutWalletIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Saques PIX</h1>
						{isAutoCashoutEnabled !== null && (
							<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold ${
								isAutoCashoutEnabled
									? 'bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30'
									: 'bg-white/5 text-white/50 border border-white/10'
							}`}>
								<span className={`h-1.5 w-1.5 rounded-full ${isAutoCashoutEnabled ? 'bg-[#00a87e]' : 'bg-white/40'}`} />
								{isAutoCashoutEnabled ? 'Automático Ativo' : 'Manual'}
							</span>
						)}
					</div>
					<p className="text-xs text-white/50 mt-1">
						Transferência instantânea de liquidez para contas bancárias cadastradas
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={handleOpenConfig}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={Settings02Icon} className="icon-sm" />
						<span>Configurar Saque Automático</span>
					</button>

					{!context.readOnly && (
						<button
							type="button"
							onClick={modals.create.open}
							className="button-primary cursor-pointer text-xs"
						>
							<RevolutPlusIcon size={16} />
							<span>+ Novo Saque PIX</span>
						</button>
					)}
				</div>
			</div>

			{/* High-Contrast 4-Tile KPI Summary */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Total Debitado */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total Debitado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutArrowUpRightIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalDebited}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Saldo deduzido em saques</p>
					</div>
				</div>

				{/* Valor Recebido */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Valor Recebido
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={completedNet}
							className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums"
						/>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Liquidado na conta bancária</p>
					</div>
				</div>

				{/* Taxas de Saque */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Taxas Operacionais
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutPixIcon size={14} />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={totalFees}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Custos de transferência PIX</p>
					</div>
				</div>

				{/* Solicitações */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Solicitações
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalRequests} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Total de ordens no histórico</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(cashout) => cashout.id}
					renderMobileCard={(cashout, index, openActions) =>
						renderMobileCashoutCard(cashout, index, openActions)
					}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum saque PIX encontrado no período selecionado."
					filters={{
						children: renderFiltersContent,
						hasFilters: filters.hasFilters,
						onClear: filters.clear,
						onRefresh: actions.refresh,
						isRefreshing: data.isRefreshing,
					}}
					pagination={{
						page: filters.values.page,
						pageSize: data.pageSizeValue,
						totalItems: data.items.totalItems,
						totalPages: data.items.totalPages,
						onPageChange: (nextPage) => filters.updateFilter('page', nextPage),
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

			{/* Modals */}
			<CashoutDetailsModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				cashoutPromise={modals.details.cashoutPromise}
			/>

			<CreateCashoutModal
				isOpen={modals.create.isOpen}
				onOpenChange={modals.create.close}
				merchantId={context.merchantId}
				dependenciesPromise={modals.create.dependenciesPromise}
				onSuccess={modals.create.onSuccess}
			/>

			<CancelCashoutModal
				isOpen={modals.cancel.isOpen}
				onOpenChange={modals.cancel.close}
				merchantId={context.merchantId}
				cashout={modals.cancel.cashout}
				onSuccess={modals.cancel.onSuccess}
			/>

			<AutomaticCashoutConfigModal
				isOpen={configModalOpen}
				onOpenChange={setConfigModalOpen}
				merchantId={merchantId}
				settingsPromise={settingsPromise}
				payoutAccountsPromise={payoutAccountsPromise}
				onSuccess={handleConfigSuccess}
				readOnly={readOnly}
			/>
		</div>
	);
}
