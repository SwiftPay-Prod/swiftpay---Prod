'use client';

import { useState, useCallback, useEffect, useTransition, useRef, createElement } from 'react';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import {
	adminListPlatformPayoutAccounts,
	adminDeletePlatformPayoutAccount,
	adminSetDefaultPlatformPayoutAccount,
} from '@/app/actions/admin/platform-payouts';
import type {
	AdminPlatformPayoutAccountData,
} from '@/types/admin/platform-payouts';
import type { Paginated } from '@/types/common';

interface FiltersState {
	page: number;
	pageSize: number;
}

interface UpsertModalState {
	isOpen: boolean;
	account: AdminPlatformPayoutAccountData | null;
}

interface DeleteModalState {
	isOpen: boolean;
	account: AdminPlatformPayoutAccountData | null;
}

const initialFilters: FiltersState = { page: 1, pageSize: 20 };

const emptyData: Paginated<AdminPlatformPayoutAccountData> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 20,
	totalPages: 0,
};

export function usePlatformPayoutAccountsTable() {
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [data, setData] = useState<Paginated<AdminPlatformPayoutAccountData>>(emptyData);
	const [isPending, startTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();
	const [isActionPending, startActionTransition] = useTransition();

	const [upsertModal, setUpsertModal] = useState<UpsertModalState>({ isOpen: false, account: null });
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, account: null });

	const fetchedParamsRef = useRef<string | null>(null);

	const fetchData = useCallback(
		(force = false) => {
			const paramsKey = JSON.stringify(filters);
			if (!force && fetchedParamsRef.current === paramsKey) return;
			fetchedParamsRef.current = paramsKey;

			startTransition(async () => {
				const response = await adminListPlatformPayoutAccounts({
					page: filters.page,
					pageSize: filters.pageSize,
				});
				setData(response?.data ?? emptyData);
			});
		},
		[filters]
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const refresh = useCallback(() => {
		fetchedParamsRef.current = null;
		fetchData(true);
	}, [fetchData]);

	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			...(key !== 'page' && { page: 1 }),
		}));
	}, []);

	const openCreateModal = useCallback(() => {
		setUpsertModal({ isOpen: true, account: null });
	}, []);

	const openEditModal = useCallback((account: AdminPlatformPayoutAccountData) => {
		setUpsertModal({ isOpen: true, account });
	}, []);

	const closeUpsertModal = useCallback(() => {
		setUpsertModal({ isOpen: false, account: null });
	}, []);

	const openDeleteModal = useCallback((account: AdminPlatformPayoutAccountData) => {
		setDeleteModal({ isOpen: true, account });
	}, []);

	const closeDeleteModal = useCallback(() => {
		setDeleteModal({ isOpen: false, account: null });
	}, []);

	const handleDelete = useCallback(() => {
		const account = deleteModal.account;
		if (!account) return;

		startDeleteTransition(async () => {
			const response = await adminDeletePlatformPayoutAccount(account.id);
			if (response?.error) {
				toast('Erro ao remover conta', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
				return;
			}
			toast('Conta removida', {
				description: response?.message || 'A conta foi removida com sucesso!',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			closeDeleteModal();
			refresh();
		});
	}, [deleteModal.account, closeDeleteModal, refresh]);

	const handleSetDefault = useCallback((account: AdminPlatformPayoutAccountData) => {
		startActionTransition(async () => {
			const response = await adminSetDefaultPlatformPayoutAccount(account.id);
			if (response?.error) {
				toast('Erro ao definir padrão', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
				return;
			}
			toast('Conta padrão definida', {
				description: response?.message || 'A conta foi definida como padrão!',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			refresh();
		});
	}, [refresh]);

	const handleUpsertSuccess = useCallback(() => {
		closeUpsertModal();
		refresh();
	}, [closeUpsertModal, refresh]);

	return {
		data: { items: data, isLoading: isPending },
		filters: { values: filters, updateFilter },
		modals: {
			upsert: {
				isOpen: upsertModal.isOpen,
				account: upsertModal.account,
				close: closeUpsertModal,
				onSuccess: handleUpsertSuccess,
			},
			delete: {
				isOpen: deleteModal.isOpen,
				account: deleteModal.account,
				close: closeDeleteModal,
				isDeleting,
				onConfirm: handleDelete,
			},
		},
		actions: { openCreateModal, openEditModal, openDeleteModal, refresh, setDefault: handleSetDefault },
		context: { isActionPending },
	};
}

