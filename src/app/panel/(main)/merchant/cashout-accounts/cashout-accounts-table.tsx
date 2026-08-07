'use client';

import { Button, Chip, Tooltip, Dropdown } from '@heroui/react';
import {
	AddSquareIcon,
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
import { PageHeader } from '@/components/ui/page-header';
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
	mapParseColorToChipColor,
	payoutAccountStatusOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { CreateAccountModal } from './modals/create-account-modal';
import { ConfirmCodeModal } from './modals/confirm-code-modal';
import { ViewAccountModal } from './modals/view-account-modal';
import { useCashoutAccountsTable } from './use-cashout-accounts-table';

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
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Chip variant="soft" color="default" size="sm" className="gap-1">
								{keyTypeParse.icon}
								{keyTypeParse.label}
							</Chip>
							{account.isDefault && (
								<Chip variant="soft" color="accent" size="sm" className="gap-1">
									<Icon icon={StarIcon} className="icon-xs" />
									Padrão
								</Chip>
							)}
						</div>
						<div className="flex items-center gap-2">
							<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
								{account.pixKey}
							</code>
							<Tooltip>
								<Button isIconOnly size="sm" variant="ghost" onPress={() => config.onCopyPixKey(account.pixKey)}>
									<Icon icon={Copy01Icon} className="icon-sm" />
									<Tooltip.Content>Copiar chave PIX</Tooltip.Content>
								</Button>
							</Tooltip>
						</div>
					</div>
				);
			},
		},
		{
			key: 'holderName',
			header: 'Titular',
			render: (account) => <span className="text-sm text-foreground">{account.holderName || '-'}</span>,
		},
		{
			key: 'bankName',
			header: 'Banco',
			render: (account) => <span className="text-sm text-foreground">{account.bankName || '-'}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (account) => {
				const statusParse = payoutAccountStatusParse[account.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			},
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (account) => <span className="text-sm text-muted">{formatDate(account.createdAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			render: (account) => {
				const isPending = account.status === PayoutAccountStatus.Pending;
				const isReadOnly = config.readOnly;
				return (
					<div className="flex items-center gap-1">
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" onPress={() => config.onView(account)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Visualizar dados</Tooltip.Content>
							</Button>
						</Tooltip>
						{!isReadOnly && (isPending || !account.isDefault) && (
							<Dropdown>
								<Tooltip>
									<Button isIconOnly size="sm" variant="tertiary" aria-label="Mais ações" isPending={config.isActionPending}>
										<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
										<Tooltip.Content>Mais ações</Tooltip.Content>
									</Button>
								</Tooltip>
								<Dropdown.Popover className="min-w-52">
									<Dropdown.Menu aria-label="Ações da conta de saque">
										{isPending && (
											<Dropdown.Item id="verify" textValue="Verificar conta" className="text-success" onPress={() => config.onVerify(account)}>
												<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
												Verificar conta
											</Dropdown.Item>
										)}
										{!isPending && !account.isDefault && (
											<Dropdown.Item id="set-default" textValue="Definir como padrão" className="text-accent" onPress={() => config.onSetDefault(account)}>
												<Icon icon={StarIcon} className="icon-xs text-accent" />
												Definir como padrão
											</Dropdown.Item>
										)}
										{!account.isDefault && (
											<Dropdown.Item id="delete" textValue="Remover conta" className="text-danger" onPress={() => config.onDelete(account)}>
												<Icon icon={Delete02Icon} className="icon-xs text-danger" />
												Remover conta
											</Dropdown.Item>
										)}
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
	_index: number,
	openActions?: () => void,
) {
	const keyTypeParsed = pixKeyTypeParse[account.pixKeyType];
	const statusParsed = payoutAccountStatusParse[account.status];

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
				<div className="flex items-center gap-1.5 flex-wrap">
					<Chip variant="soft" color={mapParseColorToChipColor(keyTypeParsed.color)} size="sm">
						{keyTypeParsed.label}
					</Chip>
					{account.isDefault && (
						<Chip variant="soft" color="accent" size="sm">
							Padrão
						</Chip>
					)}
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="shrink-0">
					{statusParsed.label}
				</Chip>
			</div>
			<p className="mt-2 text-sm font-mono truncate">{account.pixKey}</p>
			<p className="mt-1 text-sm truncate">{account.holderName}</p>
			{account.bankName && <p className="mt-0.5 text-xs text-muted truncate">{account.bankName}</p>}
			<p className="mt-2 text-xs text-muted">{formatDate(account.createdAt)}</p>
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
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={BankIcon} className="icon-md text-accent-foreground" />}
				title="Contas de Saque"
				description="Gerencie suas contas PIX para receber saques"
				action={
					readOnly
						? undefined
						: {
								label: 'Nova Conta',
								icon: <Icon icon={AddSquareIcon} className="icon-sm" />,
								onPress: modals.create.open,
						  }
				}
			/>

			<DataTable
				columns={columns}
				data={data.items.items}
				keyExtractor={(account) => account.id}
				isLoading={data.isLoading}
				skeletonRows={5}
				emptyMessage="Nenhuma conta de saque cadastrada"
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

			{!readOnly && (
				<div className="flex items-start gap-2 rounded-xl bg-warning/10 p-4">
					<Icon icon={InformationCircleIcon} className="icon-md shrink-0 text-warning" />
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium text-foreground">Importante</p>
						<p className="text-sm text-muted">
							Para adicionar, remover ou alterar contas de saque, você precisará confirmar a operação com um código
							enviado para seu e-mail. Isso garante a segurança das suas transações.
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

