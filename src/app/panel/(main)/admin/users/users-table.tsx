'use client';

import { useState } from 'react';
import { Button, Chip, Avatar, Tooltip } from '@heroui/react';
import { Building02Icon, UserGroupIcon, ViewIcon, ChampionIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMinimalUser, AdminUserDetails } from '@/types/admin/users';
import type { ApiResponse, Paginated } from '@/types/common';
import type { Filters } from './page';
import { UserRole } from '@/types/enums';
import {
	userRoleParse,
	userStatusParse,
	emailVerifiedParse,
	parseToFilterOptions,
	pageSizeFilterOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmailLink, PhoneLink } from '@/components/ui/data-links';
import { adminGetUser } from '@/app/actions/admin/users';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { UserChangeRoleModal } from '@/components/admin/user-change-role-modal';
import { UserActionsDropdown, UserActionButtons } from '@/components/admin/user-actions-dropdown';
import { UserAssignReferrerModal } from '@/components/admin/user-assign-referrer-modal';
import { UserRankingSuspensionModal } from '@/components/admin/user-ranking-suspension-modal';
import { useUsersTable } from './use-users-table';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutWalletIcon,
	RevolutPlusIcon,
	RevolutCheckIcon,
	RevolutTrendingUpIcon,
} from '@/components/ui/revolut-icons';
import { AnimatedNumber } from '@/components/ui/animated-number';

type UsersPromise = Promise<ApiResponse<Paginated<AdminMinimalUser>>>;

interface UsersTableProps {
	fetchPromise: UsersPromise;
	filters: Filters;
	currentUserRole?: UserRole;
	currentUserId?: string;
}

type UserDetailsPromise = Promise<ApiResponse<AdminUserDetails>>;

const roleOptions = parseToFilterOptions(userRoleParse, 'Todos os cargos');
const statusOptions = parseToFilterOptions(userStatusParse, 'Todos os status');
const wasReferredOptions = [
	{ value: 'all', label: 'Todos' },
	{ value: 'true', label: 'Sim' },
	{ value: 'false', label: 'Não' },
];
const sortByOptions = [
	{ value: 'createdAt', label: 'Data de criação' },
	{ value: 'generatedReferralCommission', label: 'Comissão gerada' },
	{ value: 'availableCommissionBalance', label: 'Saldo comissão' },
];

function getColumns(config: {
	onView: (userId: string) => void;
	onActivate: (user: AdminMinimalUser) => void;
	onSuspend: (user: AdminMinimalUser) => void;
	onInactivate: (user: AdminMinimalUser) => void;
	onChangeRole: (user: AdminMinimalUser) => void;
	onAssignReferrer: (user: AdminMinimalUser) => void;
	onSuspendFromRanking: (user: AdminMinimalUser) => void;
	currentUserRole: UserRole;
	currentUserId: string;
	isActionPending: boolean;
}): DataTableColumn<AdminMinimalUser>[] {
	const {
		onView,
		onActivate,
		onSuspend,
		onInactivate,
		onChangeRole,
		onAssignReferrer,
		onSuspendFromRanking,
		currentUserRole,
		currentUserId,
		isActionPending,
	} = config;

	return [
		{
			key: 'user',
			header: 'Usuário',
			render: (user) => (
				<div className="flex items-center gap-3">
					<Avatar size="sm" className="bg-white/5 border border-white/10 text-white">
						<Avatar.Fallback>
							{user.name
								? user.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2)
								: (user.email?.[0] ?? '?').toUpperCase()}
						</Avatar.Fallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-bold text-sm text-white truncate">{user.name || '-'}</span>
						<EmailLink email={user.email} className="text-xs text-white/50" />
						{user.whatsApp && <PhoneLink phone={user.whatsApp} className="text-xs text-white/50" />}
					</div>
				</div>
			),
		},
		{
			key: 'role',
			header: 'Cargo',
			render: (user) => {
				const roleParse = userRoleParse[user.role];
				return (
					<RevolutStatusBadge
						status={user.role}
						label={roleParse?.label}
					/>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (user) => {
				const statusParsed = userStatusParse[user.status];
				const isRankingSuspended = !!(user.rankingSuspendedUntil && new Date(user.rankingSuspendedUntil) > new Date());
				return (
					<div className="flex flex-col gap-1">
						<RevolutStatusBadge
							status={user.status}
							label={statusParsed?.label}
						/>
						{isRankingSuspended && (
							<RevolutStatusBadge
								status="ranking-suspended"
								label="Rank suspenso"
							/>
						)}
					</div>
				);
			},
		},
		{
			key: 'emailVerified',
			header: 'Email Verificado',
			render: (user) => {
				const emailParse = emailVerifiedParse[user.emailVerified ? 'verified' : 'pending'];
				return (
					<RevolutStatusBadge
						status={user.emailVerified ? 'verified' : 'pending'}
						label={emailParse?.label}
					/>
				);
			},
		},
		{
			key: 'merchantCount',
			header: 'Organizações',
			render: (user) => (
				<div className="flex items-center gap-2 text-sm text-white">
					<Icon icon={Building02Icon} className="icon-sm text-white/50" />
					<span className="font-mono tabular-nums">{user.merchantCount}</span>
				</div>
			),
		},
		{
			key: 'referredUsersCount',
			header: 'Indicados',
			render: (user) => (
				<div className="flex items-center gap-2 text-sm text-white">
					<Icon icon={UserGroupIcon} className="icon-sm text-white/50" />
					<span className="font-mono tabular-nums">{user.referredUsersCount}</span>
				</div>
			),
		},
		{
			key: 'wasReferred',
			header: 'Foi indicado?',
			render: (user) => (
				<RevolutStatusBadge
					status={user.wasReferred ? 'yes' : 'no'}
					label={user.wasReferred ? 'Sim' : 'Não'}
				/>
			),
		},
		{
			key: 'referredAt',
			header: 'Indicado em',
			render: (user) => <span className="text-xs font-mono text-white/50">{formatDate(user.referredAt)}</span>,
		},
		{
			key: 'generatedReferralCommission',
			header: 'Comissão gerada',
			render: (user) => <span className="text-sm font-bold font-mono text-[#00a87e] tabular-nums">{formatCurrency(user.generatedReferralCommission)}</span>,
		},
		{
			key: 'availableCommissionBalance',
			header: 'Saldo comissão',
			render: (user) => <span className="text-sm font-bold font-mono text-[#4f55f1] tabular-nums">{formatCurrency(user.availableCommissionBalance)}</span>,
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (user) => (
				<div className="flex items-center gap-2 text-xs font-mono text-white/50">{formatDate(user.createdAt)}</div>
			),
		},
		{
			key: 'lastLoginAt',
			header: 'Último login',
			render: (user) => <span className="text-xs font-mono text-white/50">{formatDate(user.lastLoginAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (user) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<button
							type="button"
							onClick={() => onView(user.id)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors"
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>
					<UserActionsDropdown
						user={user}
						currentUserRole={currentUserRole}
						currentUserId={currentUserId}
						isPending={isActionPending}
						onlyIcon={true}
						onActivate={() => onActivate(user)}
						onSuspend={() => onSuspend(user)}
						onInactivate={() => onInactivate(user)}
						onChangeRole={() => onChangeRole(user)}
						onAssignReferrer={() => onAssignReferrer(user)}
						onSuspendFromRanking={() => onSuspendFromRanking(user)}
					/>
				</div>
			),
		},
	];
}

function renderMobileUserCard(user: AdminMinimalUser, _index: number, openActions?: () => void) {
	const roleParsed = userRoleParse[user.role];
	const statusParsed = userStatusParse[user.status];
	const isRankingSuspended = !!(user.rankingSuspendedUntil && new Date(user.rankingSuspendedUntil) > new Date());

	return (
		<div
			className={`rounded-xl border border-white/12 bg-[#16181a] p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
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
					<div className="flex flex-col min-w-0 gap-2">
						<span className="font-medium text-white truncate">{user.name || '-'}</span>
						<span className="text-sm text-white/50 truncate">{user.email}</span>
						{user.whatsApp && <PhoneLink phone={user.whatsApp} className="text-xs text-white/50 truncate" />}
					</div>
					<RevolutStatusBadge status={user.role} label={roleParsed?.label} />
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<RevolutStatusBadge status={user.status} label={statusParsed?.label} />
					{isRankingSuspended && (
						<RevolutStatusBadge status="ranking-suspended" label="Rank suspenso" />
					)}
				</div>

				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1 text-sm text-white">
						<Icon icon={Building02Icon} className="icon-sm text-white/50" />
						<span className="font-mono tabular-nums">{user.merchantCount} {user.merchantCount === 1 ? 'org.' : 'orgs.'}</span>
					</div>
					<span className="text-sm font-bold font-mono text-[#00a87e] tabular-nums">{formatCurrency(user.generatedReferralCommission)}</span>
				</div>

				<span className="text-xs text-white/50">{formatDate(user.createdAt)}</span>
			</div>
		</div>
	);
}

export function UsersTable({ fetchPromise, filters, currentUserRole, currentUserId }: UsersTableProps) {
	const [assignReferrerUser, setAssignReferrerUser] = useState<AdminMinimalUser | null>(null);
	const [assignReferrerPromise, setAssignReferrerPromise] = useState<UserDetailsPromise | null>(null);
	const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);

	const { data, filters: filterState, modals, actions, context } = useUsersTable({
		fetchPromise,
		filters,
		currentUserRole,
		currentUserId,
	});

	function handleOpenAssignReferrerModal(user: AdminMinimalUser) {
		setAssignReferrerUser(user);
		setAssignReferrerPromise(adminGetUser(user.id));
		setIsAssignReferrerModalOpen(true);
	}

	function handleAssignReferrerModalChange(isOpen: boolean) {
		setIsAssignReferrerModalOpen(isOpen);
		if (!isOpen) {
			setAssignReferrerUser(null);
			setAssignReferrerPromise(null);
		}
	}

	const columns = getColumns({
		onView: actions.viewUser,
		onActivate: modals.activate.open,
		onSuspend: modals.suspend.open,
		onInactivate: modals.inactivate.open,
		onChangeRole: modals.role.open,
		onAssignReferrer: handleOpenAssignReferrerModal,
		onSuspendFromRanking: modals.rankingSuspension.open,
		currentUserRole: context.currentUserRole,
		currentUserId: context.currentUserId,
		isActionPending: modals.isActionPending,
	});

	const users = data.items.items;
	const totalUsers = data.items.totalItems;
	const activeUsers = users.filter((u) => userStatusParse[u.status]?.label === 'Ativo').length;
	const verifiedUsers = users.filter((u) => u.emailVerified).length;
	const totalCommission = users.reduce((acc, u) => acc + (u.availableCommissionBalance ?? 0), 0);

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				key={filterState.values.search === '' ? 'empty' : 'filled'}
				label="Buscar"
				placeholder="Nome ou email..."
				defaultValue={filterState.values.search}
				onChange={(value) => filterState.updateFilter('search', value)}
			/>

			<SelectFilter
				label="Cargo"
				value={filterState.values.role}
				options={roleOptions}
				onChange={(value) => filterState.updateFilter('role', value as typeof filterState.values.role)}
				allLabel="Todos os cargos"
			/>

			<SelectFilter
				label="Status"
				value={filterState.values.status}
				options={statusOptions}
				onChange={(value) => filterState.updateFilter('status', value as typeof filterState.values.status)}
				allLabel="Todos os status"
			/>

			<SelectFilter
				label="Foi indicado"
				value={filterState.values.wasReferred}
				options={wasReferredOptions}
				onChange={(value) => filterState.updateFilter('wasReferred', value as typeof filterState.values.wasReferred)}
				allLabel="Todos"
			/>

			<SelectFilter
				label="Ordenar por"
				value={filterState.values.sortBy}
				options={sortByOptions}
				onChange={(value) => filterState.updateFilter('sortBy', value as typeof filterState.values.sortBy)}
				showChips={false}
			/>

			<SelectFilter
				label="Por página"
				value={filterState.values.pageSize}
				options={pageSizeFilterOptions}
				onChange={(value) => filterState.updateFilter('pageSize', value)}
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
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={UserGroupIcon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Usuários</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Gerencie os usuários da plataforma.</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={actions.refresh}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<RevolutTrendingUpIcon size={16} />
						<span>Atualizar</span>
					</button>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Usuários
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={UserGroupIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={totalUsers} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Cadastrados</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Ativos
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<RevolutCheckIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							<AnimatedNumber value={activeUsers} />
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Habilitados</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Email verificado
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<RevolutWalletIcon size={14} />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={verifiedUsers} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Confirmados</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saldo comissão
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={ChampionIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#4f55f1] tracking-tight tabular-nums block">
							{formatCurrency(totalCommission)}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Disponível em indicações</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={data.items.items}
					keyExtractor={(user) => user.id}
					isLoading={data.isLoading}
					skeletonRows={data.pageSizeValue}
					emptyMessage="Nenhum usuário encontrado"
					minWidth="min-w-250"
					renderMobileCard={renderMobileUserCard}
					mobileActions={{
						title: (user) => user.name ?? user.email,
						subtitle: (user) => (user.name ? user.email : undefined),
						renderActions: (user, close) => (
							<div className="flex flex-col gap-2">
								<Button
									variant="secondary"
									className="w-full justify-start"
									onPress={() => {
										actions.viewUser(user.id);
										close();
									}}
								>
									<Icon icon={ViewIcon} className="icon-sm" />
									Ver detalhes
								</Button>
								<UserActionButtons
									user={user}
									currentUserRole={context.currentUserRole}
									currentUserId={context.currentUserId}
									isPending={modals.isActionPending}
									onActivate={() => { modals.activate.open(user); close(); }}
									onSuspend={() => { modals.suspend.open(user); close(); }}
									onInactivate={() => { modals.inactivate.open(user); close(); }}
									onChangeRole={() => { modals.role.open(user); close(); }}
									onAssignReferrer={() => { handleOpenAssignReferrerModal(user); close(); }}
									onSuspendFromRanking={() => { modals.rankingSuspension.open(user); close(); }}
								/>
							</div>
						),
					}}
					filters={{
						children: renderFiltersContent,
						hasFilters: filterState.hasFilters,
						onClear: filterState.clear,
						onRefresh: actions.refresh,
						isRefreshing: data.isLoading,
					}}
					pagination={{
						page: data.items.page,
						pageSize: data.items.pageSize,
						totalItems: data.items.totalItems,
						totalPages: data.items.totalPages,
						onPageChange: filterState.handlePageChange,
						sortBy: filterState.values.sortBy,
						sortOrder: filterState.values.sortOrder,
						onSortChange: (sortBy, sortOrder) => {
							filterState.updateFilter('sortBy', sortBy as typeof filterState.values.sortBy);
							filterState.updateFilter('sortOrder', sortOrder);
							filterState.handlePageChange(1);
						},
						isNavigating: data.isLoading,
					}}
				/>
			</div>

			<ConfirmationModal
				isOpen={modals.activate.isOpen}
				onOpenChange={(isOpen) => (isOpen ? null : modals.activate.close())}
				title="Ativar usuário"
				description={`Tem certeza que deseja ativar o usuário "${
					modals.activate.user?.name ?? modals.activate.user?.email
				}"? Ele poderá acessar a plataforma novamente.`}
				status="success"
				confirmLabel="Ativar"
				isPending={modals.isActionPending}
				onConfirm={actions.handleActivate}
			/>

			<ConfirmationModal
				isOpen={modals.suspend.isOpen}
				onOpenChange={(isOpen) => (isOpen ? null : modals.suspend.close())}
				title="Suspender usuário"
				description={`Você está prestes a suspender o usuário ${
					modals.suspend.user?.name || modals.suspend.user?.email
				}. Ele não poderá acessar a plataforma enquanto estiver suspenso.`}
				confirmLabel="Suspender"
				status="warning"
				requireReason
				reasonLabel="Motivo da suspensão"
				reasonPlaceholder="Informe o motivo da suspensão..."
				isPending={modals.isActionPending}
				onConfirm={actions.handleSuspend}
			/>

			<ConfirmationModal
				isOpen={modals.inactivate.isOpen}
				onOpenChange={(isOpen) => (isOpen ? null : modals.inactivate.close())}
				title="Inativar usuário"
				description={`Você está prestes a inativar o usuário ${
					modals.inactivate.user?.name || modals.inactivate.user?.email
				}. Esta ação é mais permanente que a suspensão.`}
				confirmLabel="Inativar"
				status="danger"
				requireReason
				reasonLabel="Motivo da inativação"
				reasonPlaceholder="Informe o motivo da inativação..."
				isPending={modals.isActionPending}
				onConfirm={actions.handleInactivate}
			/>

			<UserChangeRoleModal
				isOpen={modals.role.isOpen}
				onOpenChange={(isOpen) => (isOpen ? null : modals.role.close())}
				user={modals.role.user}
				currentUserRole={context.currentUserRole}
			/>

			<UserAssignReferrerModal
				isOpen={isAssignReferrerModalOpen}
				onOpenChange={handleAssignReferrerModalChange}
				targetUser={assignReferrerUser}
				detailsPromise={assignReferrerPromise}
				onAssigned={actions.refresh}
			/>

			<UserRankingSuspensionModal
				isOpen={modals.rankingSuspension.isOpen}
				onOpenChange={(open) => (!open ? modals.rankingSuspension.close() : null)}
				user={modals.rankingSuspension.user}
				isPending={modals.isActionPending}
				onConfirm={actions.handleSuspendFromRanking}
				onRemove={actions.handleRemoveRankingSuspension}
			/>
		</div>
	);
}
