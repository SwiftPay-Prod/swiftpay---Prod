'use client';

import { useState } from 'react';
import { Button, Tooltip, Chip } from '@heroui/react';
import {
	PencilEdit01Icon,
	Delete02Icon,
	Add01Icon,
	BankIcon,
	StarIcon,
	ViewIcon,
	CheckmarkCircle02Icon,
	ArrowReloadHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';
import type { PixKeyType } from '@/types/enums';
import { pixKeyTypeParse, mapParseColorToChipColor, pageSizeFilterOptions } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AdminUpsertPlatformPayoutAccountModal } from './modals/admin-upsert-platform-payout-account-modal';
import { AdminDeletePlatformPayoutAccountModal } from './modals/admin-delete-platform-payout-account-modal';
import { usePlatformPayoutAccountsTable } from './use-platform-payout-accounts-table';
function maskValue(value: string | null): string {
	if (!value) return '—';
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const visible = trimmed.slice(-4);
	return `****${visible}`;
}

function getColumns(
	onEdit: (account: AdminPlatformPayoutAccountData) => void,
	onDelete: (account: AdminPlatformPayoutAccountData) => void,
	onSetDefault: (account: AdminPlatformPayoutAccountData) => void,
	isActionPending: boolean,
	isRevealed: (accountId: string) => boolean,
	onToggleReveal: (accountId: string) => void
): DataTableColumn<AdminPlatformPayoutAccountData>[] {
	return [
		{
			key: 'pixKeyType',
			header: 'Tipo de Chave',
			width: '140px',
			render: (account) => {
				const parse = pixKeyTypeParse[account.pixKeyType as PixKeyType];
				if (!parse) return <span className="text-sm">{account.pixKeyType}</span>;
				return (
					<div className="flex items-center gap-2">
						<Chip variant="soft" color={mapParseColorToChipColor(parse.color)}>
							{parse.icon}
							{parse.label}
						</Chip>
						{account.isActive && (
							<Chip variant="soft" color="accent" size="sm" className="gap-1">
								<Icon icon={StarIcon} className="icon-xs" />
								Padrão
							</Chip>
						)}
					</div>
				);
			},
		},
		{
			key: 'pixKey',
			header: 'Chave PIX',
			render: (account) => {
				const revealed = isRevealed(account.id);
				const value = revealed ? account.pixKey : maskValue(account.pixKey);
				return (
					<div className="flex items-center gap-2">
						<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
							{value}
						</code>
						<Tooltip>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => onToggleReveal(account.id)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>{revealed ? 'Ocultar' : 'Exibir'}</Tooltip.Content>
							</Button>
						</Tooltip>
					</div>
				);
			},
		},
		{
			key: 'holderName',
			header: 'Titular',
			render: (account) => (
				<span className="text-sm">{account.holderName || '—'}</span>
			),
		},
		{
			key: 'holderDocument',
			header: 'Documento',
			render: (account) => {
				if (!account.holderDocument) return <span className="text-sm">—</span>;
				const revealed = isRevealed(account.id);
				const value = revealed ? account.holderDocument : maskValue(account.holderDocument);
				return (
					<div className="flex items-center gap-2">
						<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
							{value}
						</code>
						<Tooltip>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => onToggleReveal(account.id)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>{revealed ? 'Ocultar' : 'Exibir'}</Tooltip.Content>
							</Button>
						</Tooltip>
					</div>
				);
			},
		},
		{
			key: 'bankName',
			header: 'Banco',
			render: (account) => (
				<span className="text-sm">{account.bankName || '—'}</span>
			),
		},
		{
			key: 'isActive',
			header: 'Status',
			width: '100px',
			align: 'center',
			render: (account) => {
				if (account.deactivatedAt) {
					return (
						<Chip variant="soft" color="danger">
							Desativada
						</Chip>
					);
				}
				return (
					<Chip variant="soft" color={account.isActive ? 'success' : 'default'}>
						{account.isActive ? 'Padrão' : 'Disponível'}
					</Chip>
				);
			},
		},
		{
			key: 'createdByUserName',
			header: 'Criado por',
			render: (account) => (
				<span className="text-sm">{account.createdByUserName || '—'}</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Data',
			width: '160px',
			render: (account) => (
				<span className="text-sm text-muted">{formatDate(account.createdAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			width: '100px',
			align: 'center',
				render: (account) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onPress={() => onEdit(account)}>
							<Icon icon={PencilEdit01Icon} className="icon-sm" />
							<Tooltip.Content>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
						{!account.isActive && !account.deactivatedAt && (
							<Tooltip>
								<Button
									isIconOnly
									variant="primary"
									isPending={isActionPending}
									onPress={() => onSetDefault(account)}
								>
									<Icon icon={StarIcon} className="icon-sm" />
									<Tooltip.Content>Definir como padrão</Tooltip.Content>
								</Button>
							</Tooltip>
						)}
						{!account.isActive && !account.deactivatedAt && (
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							className="text-danger"
							onPress={() => onDelete(account)}
						>
							<Icon icon={Delete02Icon} className="icon-sm" />
							<Tooltip.Content>Excluir</Tooltip.Content>
						</Button>
					</Tooltip>
						)}
				</div>
			),
		},
	];
}

function renderMobilePayoutAccountCard(account: AdminPlatformPayoutAccountData, _index: number, openActions?: () => void) {
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
					<Chip
						variant="soft"
						color={mapParseColorToChipColor(pixKeyTypeParse[account.pixKeyType as PixKeyType].color)}
						className="text-xs"
					>
						{pixKeyTypeParse[account.pixKeyType as PixKeyType].label}
					</Chip>
					{account.deactivatedAt ? (
						<Chip variant="soft" color="danger" className="text-xs">
							Desativada
						</Chip>
					) : account.isActive ? (
						<Chip variant="soft" color="success" className="text-xs">
							Padrão
						</Chip>
					) : (
						<Chip variant="soft" color="default" className="text-xs">
							Disponível
						</Chip>
					)}
				</div>
				<span className="font-mono text-sm">{maskValue(account.pixKey)}</span>
				{account.holderName && <span className="text-sm">{account.holderName}</span>}
				{account.holderDocument && (
					<span className="text-sm text-muted">{maskValue(account.holderDocument)}</span>
				)}
				{account.bankName && (
					<div className="flex items-center gap-1.5">
						<Icon icon={BankIcon} className="icon-xs text-muted shrink-0" />
						<span className="text-xs text-muted">{account.bankName}</span>
					</div>
				)}
				{account.createdByUserName && (
					<span className="text-xs text-muted">{account.createdByUserName}</span>
				)}
				<span className="text-xs text-muted">{formatDate(account.createdAt)}</span>
			</div>
		</div>
	);
}

export function PlatformPayoutAccountsTable() {
	const { data, filters, modals, actions, context } = usePlatformPayoutAccountsTable();
	const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

	const handleToggleReveal = (accountId: string) => {
		setRevealedIds((prev) => {
			const next = new Set(prev);
			if (next.has(accountId)) {
				next.delete(accountId);
			} else {
				next.add(accountId);
			}
			return next;
		});
	};

	const isRevealed = (accountId: string) => revealedIds.has(accountId);

	const columns = getColumns(
		actions.openEditModal,
		actions.openDeleteModal,
		actions.setDefault,
		context.isActionPending,
		isRevealed,
		handleToggleReveal
	);
	const itemsList = data.items.items;
	const defaultAccount = itemsList.find((a) => a.isActive) ?? null;

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={BankIcon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Contas de Saque da Plataforma</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gerenciamento seguro de contas PIX e chaves bancárias de liquidação
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={actions.openCreateModal}
						className="button-primary cursor-pointer text-xs"
					>
						<Icon icon={Add01Icon} className="icon-xs" />
						<span>+ Nova Conta PIX</span>
					</button>
				</div>
			</div>

			{/* 2-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total de Contas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={BankIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={data.items.totalItems} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Contas de liquidação registradas</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Conta Padrão Ativa
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-[#00a87e]" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block truncate">
							{defaultAccount ? (defaultAccount.bankName || defaultAccount.holderName || maskValue(defaultAccount.pixKey)) : 'Nenhuma'}
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">
							{defaultAccount ? `Chave: ${maskValue(defaultAccount.pixKey)}` : 'Defina uma conta padrão'}
						</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(item) => item.id}
					isLoading={data.isLoading}
					emptyMessage="Nenhuma conta de saque cadastrada."
					renderMobileCard={renderMobilePayoutAccountCard}
					filters={{
						children: (
							<SelectFilter
								label="Por página"
								options={pageSizeFilterOptions}
								value={String(filters.values.pageSize)}
								onChange={(value) => filters.updateFilter('pageSize', Number(value))}
							/>
						),
						onRefresh: actions.refresh,
					}}
					pagination={{
						page: data.items.page,
						pageSize: data.items.pageSize,
						totalItems: data.items.totalItems,
						totalPages: data.items.totalPages,
						onPageChange: (page) => filters.updateFilter('page', page),
						isNavigating: data.isLoading,
					}}
				/>
			</div>
			<AdminUpsertPlatformPayoutAccountModal
				isOpen={modals.upsert.isOpen}
				account={modals.upsert.account}
				onOpenChange={modals.upsert.close}
				onSuccess={modals.upsert.onSuccess}
			/>

			<AdminDeletePlatformPayoutAccountModal
				isOpen={modals.delete.isOpen}
				account={modals.delete.account}
				onOpenChange={modals.delete.close}
				isDeleting={modals.delete.isDeleting}
				onConfirm={modals.delete.onConfirm}
			/>
		</div>
	);
}

