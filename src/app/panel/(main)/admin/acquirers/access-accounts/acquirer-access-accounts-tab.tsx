'use client';

import { Chip } from '@heroui/react';
import { PlusSignIcon, UserCheck01Icon, ViewOffIcon, ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DataTable } from '@/components/ui/data-table';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { SelectFilter } from '@/components/ui/select-filter';
import { pageSizeFilterOptions } from '@/parse';
import type { UserRole } from '@/types/enums';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import { getAccessAccountColumns } from './columns';
import { AccessAccountDetailsModal } from './access-account-details-modal';
import { AddAccessAccountModal } from './add-access-account-modal';
import { DEFAULT_PAGE_SIZE } from './types';
import { useAccessAccounts } from './use-access-accounts';

interface AcquirerAccessAccountsTabProps {
	currentUserRole: UserRole;
	initialAcquirers: AdminAcquirerData[];
	onRefresh?: () => void;
}

function maskPassword(password: string): string {
	if (!password) return '-';
	return '*'.repeat(Math.max(password.length, 8));
}

function maskDescription(description: string | null): string {
	if (!description) return '-';
	const hiddenPreviewLength = 14;
	return '*'.repeat(hiddenPreviewLength);
}

function maskLogin(login: string): string {
	if (!login) return '-';

	if (login.includes('@')) {
		const [localPart = '', domainPart = ''] = login.split('@');
		const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
		const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(localPart.length - visibleLocal.length, 2))}`;

		const [domainName = '', ...domainSuffix] = domainPart.split('.');
		const visibleDomain = domainName.slice(0, Math.min(1, domainName.length));
		const maskedDomainName = `${visibleDomain}${'*'.repeat(Math.max(domainName.length - visibleDomain.length, 2))}`;
		const suffix = domainSuffix.length > 0 ? `.${domainSuffix.join('.')}` : '';

		return `${maskedLocal}@${maskedDomainName}${suffix}`;
	}

	const visiblePart = login.slice(0, Math.min(2, login.length));
	return `${visiblePart}${'*'.repeat(Math.max(login.length - visiblePart.length, 2))}`;
}

export function AcquirerAccessAccountsTab({
	currentUserRole,
	initialAcquirers,
	onRefresh,
}: AcquirerAccessAccountsTabProps) {
	const state = useAccessAccounts(currentUserRole, initialAcquirers, onRefresh);

	const columns = getAccessAccountColumns({
		isSensitiveVisible: state.isSensitiveVisible,
		onOpenDetails: state.openDetailsModal,
		onRemoveAccount: state.handleRemoveAccount,
		canEdit: state.canEdit,
		isPending: state.isPending,
	});

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={UserCheck01Icon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Contas de Acesso</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gestão consolidada de credenciais de acesso por processadora
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => state.setIsSensitiveVisible((prev) => !prev)}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={state.isSensitiveVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
						<span>{state.isSensitiveVisible ? 'Ocultar Credenciais' : 'Exibir Credenciais'}</span>
					</button>
					{state.canEdit && (
						<button
							type="button"
							onClick={state.openAddModal}
							disabled={state.isPending || state.isLoadingAcquirers || state.acquirers.length === 0}
							className="button-primary cursor-pointer text-xs"
						>
							<Icon icon={PlusSignIcon} className="icon-xs" />
							<span>+ Adicionar Conta</span>
						</button>
					)}
				</div>
			</div>

			{/* 2-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Total de Contas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={UserCheck01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{state.totalItems}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Contas e usuários cadastrados</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Processadoras Vinculadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={UserCheck01Icon} className="icon-xs text-[#00a87e]" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
							{state.acquirers.length}
						</span>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Gateways com credencial cadastrada</p>
					</div>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={state.paginatedRows}
					keyExtractor={(row) => row.rowId}
					isLoading={state.isLoadingAcquirers}
					skeletonRows={state.pageSize}
					emptyMessage="Nenhuma conta de acesso encontrada."
					minWidth="min-w-220"
					filters={{
						children: (
							<>
								<AsyncCombobox
									label="Processadora"
									placeholder="Selecione a processadora"
									searchPlaceholder="Buscar processadora"
									searchValue={state.acquirerFilterSearch}
									selectedValue={state.selectedAcquirerFilterLabel}
									isLoading={false}
									options={state.filteredAcquirerFilterOptions}
									value={state.selectedAcquirerFilter}
									onSearchChange={state.handleSearchAcquirerFilter}
									onChange={state.handleSelectAcquirerFilter}
									emptyMessage="Nenhuma processadora encontrada"
								/>
								<SelectFilter
									label="Por página"
									value={String(state.pageSize)}
									options={pageSizeFilterOptions}
									onChange={state.handleChangePageSize}
									showChips={false}
								/>
							</>
						),
						hasFilters: !!state.selectedAcquirerFilter || state.pageSize !== DEFAULT_PAGE_SIZE,
						onClear: state.handleClearFilters,
						onRefresh: state.handleRefreshTable,
						isRefreshing: state.isLoadingAcquirers,
					}}
					pagination={
						state.totalItems > 0
							? {
									page: state.effectivePage,
									pageSize: state.pageSize,
									totalItems: state.totalItems,
									totalPages: state.totalPages,
									onPageChange: (page) => state.setCurrentPage(page),
									isNavigating: state.isLoadingAcquirers,
								}
							: undefined
					}
				/>
			</div>

			<AccessAccountDetailsModal
				isOpen={state.isDetailsModalOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) state.closeDetailsModal();
				}}
				onClose={state.closeDetailsModal}
				selectedAccountRow={state.selectedAccountRow}
				isSensitiveVisible={state.isSensitiveVisible}
				maskLogin={maskLogin}
				maskPassword={maskPassword}
				maskDescription={maskDescription}
			/>

			{state.canEdit && (
				<AddAccessAccountModal
					isOpen={state.isAddModalOpen}
					onOpenChange={(isOpen) => {
						if (!isOpen) state.closeAddModal();
					}}
					onClose={state.closeAddModal}
					isPending={state.isPending}
					acquirers={state.acquirers}
					selectedAcquirerId={state.selectedAcquirerIdForNewAccount}
					onSelectAcquirerId={state.setSelectedAcquirerIdForNewAccount}
					searchValue={state.addModalAcquirerSearch}
					onSearchChange={state.setAddModalAcquirerSearch}
					isModalPasswordVisible={state.isModalPasswordVisible}
					onTogglePasswordVisible={() => state.setIsModalPasswordVisible((prev) => !prev)}
					newAccount={state.newAccount}
					onChangeNewAccount={state.setNewAccount}
					onAddAccount={state.handleAddAccount}
				/>
			)}
		</div>
	);
}
