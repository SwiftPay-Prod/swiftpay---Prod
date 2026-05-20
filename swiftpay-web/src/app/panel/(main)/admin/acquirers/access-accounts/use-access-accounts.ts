'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { toast } from '@heroui/react';
import {
	adminCreateAcquirerAccessAccount,
	adminDeleteAcquirerAccessAccount,
	adminListAcquirers,
} from '@/app/actions/admin/acquirers';
import type { AsyncComboboxOption } from '@/components/ui/async-combobox';
import type { AcquirerAccessAccount, AdminAcquirerData } from '@/types/admin/acquirers';
import type { UserRole } from '@/types/enums';
import { DEFAULT_PAGE_SIZE, EMPTY_ACCESS_ACCOUNT, type AccessAccountRow, type LoadAcquirersOptions } from './types';

function getAcquirerLabel(acquirer: Pick<AdminAcquirerData, 'displayName' | 'name'>): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

export function useAccessAccounts(
	currentUserRole: UserRole,
	initialAcquirers: AdminAcquirerData[],
	onRefresh?: () => void
) {
	const [isPending, startTransition] = useTransition();
	const [isLoadingAcquirers, setIsLoadingAcquirers] = useState(false);
	const [acquirers, setAcquirers] = useState<AdminAcquirerData[]>(initialAcquirers);
	const [selectedAcquirerFilter, setSelectedAcquirerFilter] = useState<string | null>(null);
	const [acquirerFilterSearch, setAcquirerFilterSearch] = useState('');
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedAcquirerIdForNewAccount, setSelectedAcquirerIdForNewAccount] = useState<string>('');
	const [addModalAcquirerSearch, setAddModalAcquirerSearch] = useState('');
	const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const [isModalPasswordVisible, setIsModalPasswordVisible] = useState(false);
	const [selectedAccountRow, setSelectedAccountRow] = useState<AccessAccountRow | null>(null);
	const [newAccount, setNewAccount] = useState<AcquirerAccessAccount>(EMPTY_ACCESS_ACCOUNT);

	const canEdit = currentUserRole === 'God' || currentUserRole === 'Admin';

	function applyLoadedAcquirers(items: AdminAcquirerData[]) {
		setAcquirers(items);

		setSelectedAcquirerIdForNewAccount((prev) => {
			if (prev && items.some((item) => item.id === prev)) {
				return prev;
			}
			return '';
		});

		setSelectedAcquirerFilter((prev) => {
			if (!prev) {
				return prev;
			}
			return items.some((item) => item.id === prev) ? prev : null;
		});
	}

	const loadAcquirers = useCallback(async ({ showErrorToast = true, startLoading = true }: LoadAcquirersOptions = {}) => {
		if (startLoading) {
			setIsLoadingAcquirers(true);
		}

		const response = await adminListAcquirers({ page: 1, pageSize: 100 });
		if (response?.error) {
			if (showErrorToast) {
				toast('Erro ao carregar adquirentes', {
					description: response.error.message || 'Nao foi possivel listar as adquirentes.',
					variant: 'danger',
				});
			}
			setAcquirers([]);
			setSelectedAcquirerIdForNewAccount('');
			setSelectedAcquirerFilter(null);
			setIsLoadingAcquirers(false);
			return;
		}

		const items = response?.data?.items ?? [];
		applyLoadedAcquirers(items);
		setIsLoadingAcquirers(false);
	}, []);

	const allAccessAccountRows = useMemo<AccessAccountRow[]>(() => {
		return acquirers.flatMap((acquirer) => {
			const acquirerDisplayName = getAcquirerLabel(acquirer);

			return (acquirer.accessAccounts ?? []).map((account, accountIndex) => ({
				rowId: `${acquirer.id}-${accountIndex}-${account.login}`,
				acquirerId: acquirer.id,
				acquirerDisplayName,
				acquirerNominal: acquirer.nominal,
				acquirerLogoUrl: acquirer.logoUrl,
				accountIndex,
				login: account.login,
				password: account.password,
				description: account.description,
			}));
		});
	}, [acquirers]);

	const acquirerFilterOptions = useMemo(() => {
		return acquirers.map((acquirer) => ({
			value: acquirer.id,
			label: getAcquirerLabel(acquirer),
		}));
	}, [acquirers]);

	const isAcquirerFilterSearchActive = acquirerFilterSearch.trim().length > 0;

	const selectedAcquirerFilterLabel = useMemo(() => {
		if (!selectedAcquirerFilter) {
			return null;
		}

		return acquirerFilterOptions.find((option) => option.value === selectedAcquirerFilter)?.label ?? null;
	}, [acquirerFilterOptions, selectedAcquirerFilter]);

	const filteredAcquirerFilterOptions = useMemo<AsyncComboboxOption[]>(() => {
		if (!isAcquirerFilterSearchActive) {
			return [];
		}

		const normalizedSearch = acquirerFilterSearch.trim().toLowerCase();

		return acquirerFilterOptions
			.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
			.map((option) => ({
				key: option.value,
				label: option.label,
			}));
	}, [acquirerFilterOptions, acquirerFilterSearch, isAcquirerFilterSearchActive]);

	const filteredRows = useMemo(() => {
		if (!selectedAcquirerFilter) {
			return allAccessAccountRows;
		}

		return allAccessAccountRows.filter((row) => row.acquirerId === selectedAcquirerFilter);
	}, [allAccessAccountRows, selectedAcquirerFilter]);

	const totalItems = filteredRows.length;
	const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
	const effectivePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

	const paginatedRows = useMemo(() => {
		const start = (effectivePage - 1) * pageSize;
		return filteredRows.slice(start, start + pageSize);
	}, [effectivePage, filteredRows, pageSize]);

	function resetAddModalState() {
		setNewAccount(EMPTY_ACCESS_ACCOUNT);
		setSelectedAcquirerIdForNewAccount('');
		setAddModalAcquirerSearch('');
		setIsModalPasswordVisible(false);
	}

	function openAddModal() {
		resetAddModalState();
		setIsAddModalOpen(true);
	}

	function closeAddModal() {
		setIsAddModalOpen(false);
		resetAddModalState();
	}

	function openDetailsModal(row: AccessAccountRow) {
		setSelectedAccountRow(row);
		setIsDetailsModalOpen(true);
	}

	function closeDetailsModal() {
		setIsDetailsModalOpen(false);
		setSelectedAccountRow(null);
	}

	function applyAccessAccountsToLocalState(acquirerId: string, accessAccounts: AcquirerAccessAccount[]) {
		setAcquirers((prev) => prev.map((item) => (item.id === acquirerId ? { ...item, accessAccounts } : item)));
	}

	function handleChangeAcquirerFilter(value: string | null) {
		setSelectedAcquirerFilter(value);
		setCurrentPage(1);
	}

	function handleSearchAcquirerFilter(value: string) {
		setAcquirerFilterSearch(value);
	}

	function handleSelectAcquirerFilter(value: string | null) {
		handleChangeAcquirerFilter(value);

		if (!value) {
			setAcquirerFilterSearch('');
		}
	}

	function handleChangePageSize(value: string) {
		setPageSize(Number(value));
		setCurrentPage(1);
	}

	function handleClearFilters() {
		setSelectedAcquirerFilter(null);
		setAcquirerFilterSearch('');
		setPageSize(DEFAULT_PAGE_SIZE);
		setCurrentPage(1);
	}

	function handleRefreshTable() {
		void loadAcquirers({ showErrorToast: true, startLoading: true });
	}

	function handleAddAccount() {
		const acquirerId = selectedAcquirerIdForNewAccount;
		if (!acquirerId) {
			toast('Selecione a processadora', {
				description: 'Informe a qual processadora a conta de acesso pertence.',
				variant: 'danger',
			});
			return;
		}

		const login = newAccount.login.trim();
		const password = newAccount.password.trim();
		const description = newAccount.description?.trim() || null;

		if (!login || !password) {
			toast('Preencha os campos obrigatorios', {
				description: 'Login e senha sao obrigatorios para adicionar a conta.',
				variant: 'danger',
			});
			return;
		}

		const acquirer = acquirers.find((item) => item.id === acquirerId);
		if (!acquirer) {
			toast('Processadora nao encontrada', {
				description: 'Atualize a pagina e tente novamente.',
				variant: 'danger',
			});
			return;
		}

		startTransition(async () => {
			const response = await adminCreateAcquirerAccessAccount({
				acquirerId,
				login,
				password,
				description,
			});

			if (response?.error) {
				toast('Erro ao adicionar conta de acesso', {
					description: response.error.message || 'Tente novamente mais tarde.',
					variant: 'danger',
				});
				return;
			}

			const updatedAccounts = response?.data?.accessAccounts ?? [];
			applyAccessAccountsToLocalState(acquirerId, updatedAccounts);
			closeAddModal();
			toast('Contas de acesso atualizadas', {
				description: 'Nova conta adicionada com sucesso.',
				variant: 'success',
			});
			onRefresh?.();
		});
	}

	function handleRemoveAccount(row: AccessAccountRow) {
		startTransition(async () => {
			const response = await adminDeleteAcquirerAccessAccount({
				acquirerId: row.acquirerId,
				accountIndex: row.accountIndex,
			});

			if (response?.error) {
				toast('Erro ao remover conta de acesso', {
					description: response.error.message || 'Tente novamente mais tarde.',
					variant: 'danger',
				});
				return;
			}

			const updatedAccounts = response?.data?.accessAccounts ?? [];
			applyAccessAccountsToLocalState(row.acquirerId, updatedAccounts);
			toast('Contas de acesso atualizadas', {
				description: 'Conta removida com sucesso.',
				variant: 'success',
			});

			if (selectedAccountRow?.rowId === row.rowId) {
				closeDetailsModal();
			}

			onRefresh?.();
		});
	}

	return {
		isPending,
		canEdit,
		acquirers,
		isLoadingAcquirers,
		isSensitiveVisible,
		setIsSensitiveVisible,
		paginatedRows,
		totalItems,
		totalPages,
		effectivePage,
		pageSize,
		currentPage,
		setCurrentPage,
		selectedAcquirerFilter,
		acquirerFilterOptions,
		selectedAcquirerFilterLabel,
		filteredAcquirerFilterOptions,
		acquirerFilterSearch,
		handleChangeAcquirerFilter,
		handleSearchAcquirerFilter,
		handleSelectAcquirerFilter,
		handleChangePageSize,
		handleClearFilters,
		handleRefreshTable,
		isAddModalOpen,
		isDetailsModalOpen,
		openAddModal,
		closeAddModal,
		openDetailsModal,
		closeDetailsModal,
		selectedAccountRow,
		selectedAcquirerIdForNewAccount,
		setSelectedAcquirerIdForNewAccount,
		addModalAcquirerSearch,
		setAddModalAcquirerSearch,
		newAccount,
		setNewAccount,
		isModalPasswordVisible,
		setIsModalPasswordVisible,
		handleAddAccount,
		handleRemoveAccount,
	};
}
