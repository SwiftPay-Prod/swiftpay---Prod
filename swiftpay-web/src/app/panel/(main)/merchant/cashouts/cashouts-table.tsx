'use client';

import { useEffect, useState } from 'react';
import { Button, Chip, Tooltip, Dropdown } from '@heroui/react';
import { AddCircleIcon, CancelCircleIcon, Settings02Icon, PlayCircleIcon, ViewIcon, Wallet03Icon, MoreHorizontalCircle01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import {
	payoutStatusParse,
	pixKeyTypeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
	pageSizeFilterOptions,
	simulateCashoutActionOptions,
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
import { AutomaticCashoutFrequency, PaymentEnvironment, PayoutAccountStatus, PayoutStatus, SimulateCashoutAction } from '@/types/enums';
import type { CashoutListItem } from '@/types/merchant/cashouts';
import type { ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { ReadSettingsData } from '@/types/merchant/settings';
import type { AdminMerchantSettingsData } from '@/types/admin/merchants';
import type { ApiResponse } from '@/types/common';
import { useEnvironment } from '@/contexts/environment-context';

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

const statusOptions = parseToFilterOptions(payoutStatusParse, 'Todos os status');

interface ColumnsConfig {
	onView: (id: string) => void;
	onCancel: (cashout: CashoutListItem) => void;
	onSimulate: (cashoutId: string, action: SimulateCashoutAction) => void;
	simulatingCashoutId: string | null;
	canCancel: (cashout: CashoutListItem) => boolean;
	canSimulate: (cashout: CashoutListItem) => boolean;
}

function getColumns(config: ColumnsConfig): DataTableColumn<CashoutListItem>[] {
	const { onView, onCancel, onSimulate, simulatingCashoutId, canCancel, canSimulate } = config;

	return [
		{
			key: 'id',
			header: 'ID',
			width: '140px',
			render: (cashout) => (
				<span className="font-mono text-xs text-muted">{cashout.id.slice(0, 8)}...</span>
			),
		},
		{
			key: 'totalDebited',
			header: 'Total Debitado',
			render: (cashout) => (
				<div className="flex flex-col">
					<span className="font-medium">{formatCurrency(cashout.amount)}</span>
					<span className="text-xs text-danger">Taxa: {formatCurrency(cashout.feeAmount)}</span>
				</div>
			),
		},
		{
			key: 'netAmount',
			header: 'Valor Recebido',
			render: (cashout) => (
				<span className="font-medium text-success">{formatCurrency(cashout.netAmount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (cashout) => {
				const statusParsed = payoutStatusParse[cashout.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'payoutAccount',
			header: 'Conta',
			render: (cashout) => {
				const payoutAccount = cashout.payoutAccount;
				if (!payoutAccount) {
					return <span className="text-sm text-muted">Conta não informada</span>;
				}

				const keyTypeParse = pixKeyTypeParse[payoutAccount.pixKeyType];
				return (
					<div className="flex flex-col">
						<span className="text-sm">{keyTypeParse.label}</span>
						<span className="text-xs text-muted font-mono truncate max-w-32">
							{payoutAccount.pixKey}
						</span>
					</div>
				);
			},
		},
		{
			key: 'requestedAt',
			header: 'Solicitado em',
			render: (cashout) => (
				<span className="text-sm text-muted">{formatDate(cashout.requestedAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (cashout) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onView(cashout.id)}>
								<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					{(canSimulate(cashout) || canCancel(cashout)) && (
						<Dropdown>
							<Tooltip>
								<Button isIconOnly variant="tertiary" aria-label="Mais ações" isPending={simulatingCashoutId === cashout.id}>
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
									<Tooltip.Content>Mais ações</Tooltip.Content>
								</Button>
							</Tooltip>
							<Dropdown.Popover className="min-w-48">
								<Dropdown.Menu aria-label="Ações do saque">
									{canSimulate(cashout) && simulateCashoutActionOptions.map((item) => {
										const colorClass = {
											success: 'text-success',
											warning: 'text-warning',
											danger: 'text-danger',
											secondary: 'text-secondary',
											accent: 'text-accent',
											default: 'text-foreground',
										}[item.color] || 'text-foreground';

										return (
											<Dropdown.Item key={item.value} id={item.value} textValue={item.label} className={colorClass} onPress={() => onSimulate(cashout.id, item.value)}>
												{item.icon}
												{item.label}
											</Dropdown.Item>
										);
									})}
									{canCancel(cashout) && (
										<Dropdown.Item id="cancel" textValue="Cancelar saque" className="text-danger" onPress={() => onCancel(cashout)}>
											<Icon icon={CancelCircleIcon} className="icon-xs text-danger" />
											Cancelar saque
										</Dropdown.Item>
									)}
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
	const statusParsed = payoutStatusParse[cashout.status];
	const payoutAccount = cashout.payoutAccount;
	const keyTypeParse = payoutAccount ? pixKeyTypeParse[payoutAccount.pixKeyType] : null;

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
					<span className="font-semibold text-sm truncate block">Saque</span>
					<p className="mt-0.5 text-xs text-muted truncate">
						{cashout.id.slice(0, 12)} • {formatDate(cashout.requestedAt)}
					</p>
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1 shrink-0">
					{statusParsed.label}
				</Chip>
			</div>

			<div className="">
				<div className="grid grid-cols-2 gap-3">
					<div className="min-w-0">
						<p className="text-xs text-muted">Debitado</p>
						<p className="mt-1 text-sm font-semibold truncate">{formatCurrency(cashout.amount)}</p>
					<p className="text-xs text-danger">Taxa: {formatCurrency(cashout.feeAmount)}</p>
				</div>
				<div className="min-w-0">
					<p className="text-xs text-muted">Recebido</p>
					<p className="mt-1 text-sm font-semibold text-success truncate">{formatCurrency(cashout.netAmount)}</p>
				</div>
			</div>
			<div className="mt-2 border-t border-divider pt-2">
				<p className="text-xs text-muted">Conta</p>
				{payoutAccount && keyTypeParse ? (
					<>
						<p className="mt-1 text-sm">{keyTypeParse.label}</p>
						<p className="text-xs text-muted font-mono truncate">{payoutAccount.pixKey}</p>
					</>
				) : (
					<p className="mt-1 text-sm text-muted">Conta não informada</p>
				)}
				</div>
			</div>
		</div>
	);
}

export function CashoutsTable({ merchantId, readOnly = false }: CashoutsTableProps) {
	const { data, filters, payoutAccounts, modals, actions, context } = useCashoutsTable({ merchantId, readOnly });
	const { environment } = useEnvironment();

	const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState<boolean | null>(null);
	const [nextAutoCashoutAttemptAt, setNextAutoCashoutAttemptAt] = useState<string | null>(null);
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
				setNextAutoCashoutAttemptAt(res?.data?.nextAutomaticCashoutAttemptAt ?? null);
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
			setNextAutoCashoutAttemptAt(res?.data?.nextAutomaticCashoutAttemptAt ?? null);
		});
	}

	const columns = getColumns({
		onView: modals.details.open,
		onCancel: modals.cancel.open,
		onSimulate: actions.simulate,
		simulatingCashoutId: actions.simulatingCashoutId,
		canCancel: actions.canCancel,
		canSimulate: actions.canSimulate,
	});

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="ID, chave PIX, endToEnd ou titular"
				value={filters.values.search}
				onChange={(value) => filters.updateFilter('search', value)}
			/>

			<AsyncCombobox
				label="Conta de saque"
				placeholder="Selecione uma conta"
				searchPlaceholder="Buscar conta"
				searchValue={filters.values.payoutAccountSearch}
				selectedValue={payoutAccounts.selected?.pixKey}
				isLoading={payoutAccounts.isLoading}
				options={payoutAccounts.items.map((account) => {
					const descriptionParts = [account.holderName, account.bankName].filter(Boolean);
					return {
						key: account.id,
						label: account.pixKey,
						description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : null,
					};
				})}
				value={filters.values.payoutAccountId}
				onSearchChange={(value) => filters.updateFilter('payoutAccountSearch', value)}
				onChange={(key) => {
					filters.updateFilter('payoutAccountId', key);
					if (!key) {
						filters.updateFilter('payoutAccountSearch', '');
					}
				}}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.status}
				options={statusOptions}
				onChange={(value) => filters.updateFilter('status', (value || 'all') as PayoutStatus | 'all')}
				allLabel="Todos os status"
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Wallet03Icon} className="icon-md text-accent-foreground" />}
				title="Saques"
				description={
					<div className="flex flex-col items-start gap-2">
						<span>Gerencie os saques do saldo disponível da sua organização</span>
						{isAutoCashoutEnabled !== null && (
								<div className="flex flex-col items-start gap-1">
									<Chip variant="soft" color={isAutoCashoutEnabled ? 'success' : 'default'} size="sm">
										{isAutoCashoutEnabled ? 'Saque automatizado Ativo' : 'Saque automatizado Inativo'}
									</Chip>
									{isAutoCashoutEnabled && nextAutoCashoutAttemptAt && (
										<span className="text-xs text-muted">
											Próxima tentativa: {formatDate(nextAutoCashoutAttemptAt)}
										</span>
									)}
								</div>
						)}
					</div>
				}
				actions={
					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" onPress={handleOpenConfig}>
							<Icon icon={Settings02Icon} className="icon-sm" />
							Configurar saque automatizado
						</Button>
						{!context.readOnly && (
							<Button variant="primary" size="sm" onPress={modals.create.open}>
								<Icon icon={AddCircleIcon} className="icon-sm" />
								Novo Saque
							</Button>
						)}
					</div>
				}
			/>
			<DataTable
				columns={columns}
				data={data.items.items}
				keyExtractor={(cashout) => cashout.id}
				renderMobileCard={(cashout, index, openActions) =>
					renderMobileCashoutCard(cashout, index, openActions)
				}
				mobileActions={{
					title: (cashout) => `Saque ${cashout.id.slice(0, 8)}...`,
					subtitle: (cashout) => formatCurrency(cashout.amount),
					renderActions: (cashout, close) => (
						<div className="flex flex-col gap-2">
							<Button
								variant="secondary"
								className="w-full justify-start"
								onPress={() => { modals.details.open(cashout.id); close(); }}
							>
								<Icon icon={ViewIcon} className="icon-sm" />
								Ver detalhes
							</Button>
							{actions.canSimulate(cashout) && (
								<>
									<div className="h-px bg-divider my-1" />
									<p className="text-xs text-muted px-1">Simular ação</p>
									{simulateCashoutActionOptions.map((item) => (
										<Button
											key={item.value}
											variant="secondary"
											className="w-full justify-start"
											isPending={actions.simulatingCashoutId === cashout.id}
											onPress={() => { actions.simulate(cashout.id, item.value); close(); }}
										>
											{item.icon}
											{item.label}
										</Button>
									))}
								</>
							)}
							{actions.canCancel(cashout) && (
								<Button
									variant="secondary"
									className="w-full justify-start text-danger"
									onPress={() => { modals.cancel.open(cashout); close(); }}
								>
									<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
									Cancelar saque
								</Button>
							)}
						</div>
					),
				}}
				isLoading={data.isLoading}
				skeletonRows={data.pageSizeValue}
				emptyMessage="Nenhum saque encontrado"
				minWidth="min-w-200"
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

