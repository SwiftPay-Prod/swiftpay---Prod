'use client';

import { Chip } from '@heroui/react';
import { PlusSignIcon, UserCheck01Icon, ViewOffIcon, ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
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
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={UserCheck01Icon} className="icon-md text-accent-foreground" />}
				title="Contas de acesso"
				description="Listagem consolidada de contas com filtro por processadora."
				action={
					state.canEdit
						? {
								label: 'Adicionar conta',
								icon: <Icon icon={PlusSignIcon} className="icon-sm" />,
								onPress: state.openAddModal,
								isDisabled: state.isPending || state.isLoadingAcquirers || state.acquirers.length === 0,
							}
						: undefined
				}
				secondaryAction={{
					label: state.isSensitiveVisible ? 'Ocultar informações' : 'Visualizar informações',
					icon: <Icon icon={state.isSensitiveVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />,
					onPress: () => state.setIsSensitiveVisible((prev) => !prev),
				}}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<Chip variant="soft" size="sm" color="default">
					{state.totalItems} conta(s)
				</Chip>
				<Chip variant="soft" size="sm" color="accent">
					{state.acquirers.length} processadora(s)
				</Chip>
			</div>

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
								label="Por pagina"
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
