'use client';

import { Button, Tooltip, Dropdown } from '@heroui/react';
import {
	BankIcon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	Delete02Icon,
	InformationCircleIcon,
	MoreHorizontalCircle01Icon,
	StarIcon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type {
	CashoutAccountListData,
	ListCashoutAccountsData,
	CashoutAccountsFilters,
} from '@/types/merchant/cashout-accounts';
import type { ApiResponse } from '@/types/common';
import { PayoutAccountActionType, PayoutAccountStatus } from '@/types/enums';
import {
	pixKeyTypeParse,
	payoutAccountStatusParse,
	payoutAccountStatusOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { CreateAccountModal } from './modals/create-account-modal';
import { ConfirmCodeModal } from './modals/confirm-code-modal';
import { ViewAccountModal } from './modals/view-account-modal';
import { useCashoutAccountsTable } from './use-cashout-accounts-table';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutPlusIcon,
	RevolutLockIcon,
} from '@/components/ui/revolut-icons';

type AccountsPromise = Promise<ApiResponse<ListCashoutAccountsData>>;

interface CashoutAccountsTableProps {
	fetchPromise: AccountsPromise;
	merchantId: string;
	filters: CashoutAccountsFilters;
	readOnly?: boolean;
}

type StatusFilterKey = 'all' | PayoutAccountStatus;

const statusFilterOptions: {
	value: StatusFilterKey;
	label: string;
	color?: 'default' | 'success' | 'warning' | 'danger';
}[] = [
	{ value: 'all', label: 'Todas' },
	...payoutAccountStatusOptions
		.filter((o) => o.value !== PayoutAccountStatus.Inactive)
		.map((o) => ({
			value: o.value as StatusFilterKey,
			label: o.label,
			color: o.color as 'default' | 'success' | 'warning' | 'danger' | undefined,
		})),
];

interface ColumnsConfig {
	onView: (account: CashoutAccountListData) => void;
	onVerify: (account: CashoutAccountListData) => void;
	onSetDefault: (account: CashoutAccountListData) => void;
	onDelete: (account: CashoutAccountListData) => void;
	onCopyPixKey: (pixKey: string) => void;
	isActionPending: boolean;
	readOnly: boolean;
}

function getColumns(config: ColumnsConfig): DataTableColumn<CashoutAccountListData>[] {
	return [
		{
			key: 'pixKey',
			header: 'Chave PIX',
			render: (account) => {
				const keyTypeParse = pixKeyTypeParse[account.pixKeyType];
				return (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
								{keyTypeParse?.icon}
								{keyTypeParse?.label}
							</span>
							{account.isDefault && (
								<span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/15 px-2 py-0.5 text-xs font-mono font-semibold text-link">
									<Icon icon={StarIcon} className="icon-xs" />
									Padrão
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							<code className="rounded-lg bg-surface-deep border border-white/8 px-2.5 py-1 text-xs font-mono text-white font-medium">
								{account.pixKey}
							</code>
							<Tooltip>
								<button
									type="button"
									onClick={() => config.onCopyPixKey(account.pixKey)}
									className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
								>
									<Icon icon={Copy01Icon} className="icon-sm" />
								</button>
								<Tooltip.Content>Copiar chave PIX</Tooltip.Content>
							</Tooltip>
						</div>
					</div>
				);
			},
		},
		{
			key: 'holderName',
			header: 'Titular da Conta',
			render: (account) => <span className="text-sm font-semibold text-white truncate max-w-44 block">{account.holderName || '-'}</span>,
		},
		{
			key: 'bankName',
			header: 'Instituição Bancária',
			render: (account) => <span className="text-sm text-white/80 truncate max-w-44 block">{account.bankName || '-'}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (account) => (
				<RevolutStatusBadge
					status={account.status}
					label={payoutAccountStatusParse[account.status]?.label}
				/>
			),
		},
		{
			key: 'createdAt',
			header: 'Cadastrada em',
			render: (account) => <span className="text-xs font-mono text-white/50">{formatDate(account.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (account) => {
				const isPending = account.status === PayoutAccountStatus.Pending;
				const isReadOnly = config.readOnly;
				return (
					<div className="flex items-center justify-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => config.onView(account)}
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
							>
								<Icon icon={ViewIcon} className="icon-sm" />
							</button>
							<Tooltip.Content>Visualizar dados</Tooltip.Content>
						</Tooltip>
						{!isReadOnly && (isPending || !account.isDefault) && (
							<Dropdown>
								<Button
									isIconOnly
									isDisabled={config.isActionPending}
									aria-label="Mais ações"
									className="h-8 w-8 min-w-8 rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
								>
									<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
								</Button>
								<Dropdown.Popover className="min-w-52 bg-card border border-white/12 rounded-xl text-whitexl">
									<Dropdown.Menu aria-label="Ações da conta de saque">
										{isPending && (
											<Dropdown.Item id="verify" textValue="Verificar conta" className="text-success hover:bg-white/10" onPress={() => config.onVerify(account)}>
												<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
												Verificar conta
											</Dropdown.Item>
										)}
										{!isPending && !account.isDefault && (
											<Dropdown.Item id="set-default" textValue="Definir como padrão" className="text-link hover:bg-white/10" onPress={() => config.onSetDefault(account)}>
												<Icon icon={StarIcon} className="icon-xs text-link" />
												Definir como padrão
											</Dropdown.Item>
										)}
										<Dropdown.Item id="delete" textValue="Excluir conta" className="text-danger hover:bg-white/10" onPress={() => config.onDelete(account)}>
											<Icon icon={Delete02Icon} className="icon-xs text-danger" />
											Excluir conta
										</Dropdown.Item>
									</Dropdown.Menu>
								</Dropdown.Popover>
							</Dropdown>
						)}
					</div>
				);
			},
		},
	];
}

function renderMobileCashoutAccountCard(
	account: CashoutAccountListData,
	index: number,
	openActions?: () => void,
) {
	const keyTypeParsed = pixKeyTypeParse[account.pixKeyType];

	return (
		<div
			className={`rounded-2xl border border-white/10 bg-card p-4 text-white overflow-hidden transition-all ${openActions ? 'cursor-pointer hover:border-white/20' : ''}`}
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
				<div className="flex items-center gap-1.5 flex-wrap">
					<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/80">
						{keyTypeParsed?.label}
					</span>
					{account.isDefault && (
						<span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/15 px-2 py-0.5 text-xs font-mono font-semibold text-link">
							Padrão
						</span>
					)}
				</div>
				<RevolutStatusBadge status={account.status} label={payoutAccountStatusParse[account.status]?.label} />
			</div>
			<p className="mt-3 text-sm font-mono text-white font-medium truncate">{account.pixKey}</p>
			<p className="mt-1 text-sm text-white font-semibold truncate">{account.holderName}</p>
			{account.bankName && <p className="mt-0.5 text-xs text-white/50 truncate">{account.bankName}</p>}
			<p className="mt-2 text-xs font-mono text-white/40">{formatDate(account.createdAt)}</p>
		</div>
	);
}

export function CashoutAccountsTable({ fetchPromise, merchantId, filters, readOnly = false }: CashoutAccountsTableProps) {
	const { data, filters: tableFilters, modals, actions, context } = useCashoutAccountsTable({
		fetchPromise,
		merchantId,
		filters,
	});

	const columns = getColumns({
		onView: modals.view.open,
		onVerify: actions.verifyPendingAccount,
		onSetDefault: (account) => actions.requestAction(account, PayoutAccountActionType.SetDefault),
		onDelete: (account) => actions.requestAction(account, PayoutAccountActionType.Delete),
		onCopyPixKey: actions.copyPixKey,
		isActionPending: context.isActionPending,
		readOnly,
	});

	const renderFiltersContent = () => (
		<>
			<SelectFilter
				label="Status"
				value={tableFilters.status}
				options={statusFilterOptions}
				onChange={tableFilters.handleStatusChange}
				allLabel="Todas"
				allValue="all"
			/>
		</>
	);

	const modalContent = modals.confirmCode.getContent();

	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<RevolutPixIcon size={16} />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Contas Bancárias PIX</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gerenciamento de chaves PIX e contas de destino para saques
					</p>
				</div>

				{!readOnly && (
					<button
						type="button"
						onClick={modals.create.open}
						className="button-primary cursor-pointer self-start sm:self-auto"
					>
						<RevolutPlusIcon size={16} />
						<span>+ Nova Chave PIX</span>
					</button>
				)}
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(account) => account.id}
					isLoading={data.isLoading}
					skeletonRows={5}
					emptyMessage="Nenhuma conta de saque cadastrada."
					minWidth="min-w-150"
					renderMobileCard={renderMobileCashoutAccountCard}
					filters={{
						children: renderFiltersContent,
						hasFilters: tableFilters.hasFilters,
						onClear: tableFilters.clear,
						onRefresh: tableFilters.refresh,
						isRefreshing: data.isLoading,
					}}
				/>
			</div>

			{!readOnly && (
				<div className="flex items-start gap-3 rounded-[20px] border border-white/12 bg-card p-5 text-white">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/30">
						<Icon icon={InformationCircleIcon} className="icon-sm" />
					</div>
					<div className="flex flex-col gap-1">
						<p className="text-sm font-bold text-white">Segurança Operacional D+0</p>
						<p className="text-xs text-white/60 leading-relaxed">
							Para adicionar, remover ou alterar chaves PIX de saque, você precisará confirmar a operação através do código de segurança 2FA enviado para seu e-mail cadastrado.
						</p>
					</div>
				</div>
			)}

			{!readOnly && (
				<CreateAccountModal
					isOpen={modals.create.isOpen}
					onOpenChange={(isOpen) => !isOpen && modals.create.close()}
					merchantId={context.merchantId}
					onAccountCreated={modals.create.onAccountCreated}
				/>
			)}

			{!readOnly && (
				<ConfirmCodeModal
					isOpen={modals.confirmCode.isOpen}
					onOpenChange={(isOpen) => !isOpen && modals.confirmCode.close()}
					onConfirm={modals.confirmCode.confirm}
					onResend={modals.confirmCode.resend}
					isPending={context.isActionPending}
					title={modalContent.title}
					description={modalContent.description}
				/>
			)}

			<ViewAccountModal
				isOpen={modals.view.isOpen}
				onOpenChange={(isOpen) => !isOpen && modals.view.close()}
				merchantId={context.merchantId}
				account={modals.view.account}
			/>
		</div>
	);
}
