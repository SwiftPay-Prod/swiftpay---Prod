'use client';

import { useState, useCallback, createElement, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { adminSuspendMerchant, adminActivateMerchant, adminInactivateMerchant, adminListMerchants } from '@/app/actions/admin/merchants';
import { adminListUsers } from '@/app/actions/admin/users';
import { useDebounce } from '@/hooks/use-debounce';
import { Routes } from '@/router/routes';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import type { ReadListMerchantsRequest } from '@/types/admin/merchants';
import type { AdminMinimalUser } from '@/types/admin/users';
import type { Paginated } from '@/types/common';
import type { Filters } from './page';

interface MerchantModalState {
	isOpen: boolean;
	merchant: AdminMinimalMerchant | null;
}

interface UserComboboxState {
	search: string;
	options: AdminMinimalUser[];
	isLoading: boolean;
	selected: AdminMinimalUser | null;
}

const initialMerchantModal: MerchantModalState = {
	isOpen: false,
	merchant: null,
};

const initialUserCombobox: UserComboboxState = {
	search: '',
	options: [],
	isLoading: false,
	selected: null,
};

const emptyPaginated: Paginated<AdminMinimalMerchant> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

interface UseMerchantsTableProps {
	initialFilters: Filters;
}

export function useMerchantsTable({ initialFilters }: UseMerchantsTableProps) {
	const router = useRouter();
	const [filters, setFilters] = useState<Filters>(initialFilters);
	const [items, setItems] = useState<Paginated<AdminMinimalMerchant>>(emptyPaginated);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState('');
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const [activateModal, setActivateModal] = useState<MerchantModalState>(initialMerchantModal);
	const [suspendModal, setSuspendModal] = useState<MerchantModalState>(initialMerchantModal);
	const [inactivateModal, setInactivateModal] = useState<MerchantModalState>(initialMerchantModal);
	const [setAcquirerModal, setSetAcquirerModal] = useState<MerchantModalState>(initialMerchantModal);
	const [userCombobox, setUserCombobox] = useState<UserComboboxState>(initialUserCombobox);
	const [isActionPending, setIsActionPending] = useState(false);
	const debouncedSearch = useDebounce(filters.search ?? '');

	const currentFiltersKey = JSON.stringify({ ...filters, search: debouncedSearch, refreshTrigger });
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	const debouncedUserSearch = useDebounce(userCombobox.search);
	const isUserSearchActive = userCombobox.search.trim().length > 0;

	const hasFilters = !!(
		filters.search ||
		filters.status ||
		filters.kycStatus ||
		filters.userId ||
		(filters.pageSize && filters.pageSize !== 10)
	);

	useEffect(() => {
		const key = currentFiltersKey;

		adminListMerchants({
			search: debouncedSearch ? debouncedSearch : undefined,
			status: filters.status ?? undefined,
			kycStatus: filters.kycStatus ?? undefined,
			userId: filters.userId ?? undefined,
				sortBy: filters.sortBy ?? undefined,
				sortOrder: filters.sortOrder ?? undefined,
			page: filters.page,
			pageSize: filters.pageSize,
		}).then((response) => {
			if (response?.data) {
				setItems(response.data);
			}
			setFetchedFiltersKey(key);
		});
	}, [currentFiltersKey, filters, debouncedSearch]);

	const updateFilters = useCallback((newParams: Partial<ReadListMerchantsRequest>) => {
		setFilters((prev) => ({
			...prev,
			...newParams,
			page: 'page' in newParams ? (newParams.page ?? 1) : 1,
		}));
	}, []);

	const refresh = useCallback(() => {
		setRefreshTrigger((value) => value + 1);
	}, []);

	const clearFilters = useCallback(() => {
		setUserCombobox(initialUserCombobox);
		setFilters((prev) => ({
			page: 1,
			pageSize: prev.pageSize,
			sortBy: 'createdAt',
			sortOrder: 'desc',
		}));
	}, []);

	useEffect(() => {
		const trimmedSearch = debouncedUserSearch.trim();
		if (trimmedSearch.length < 1) return;

		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setUserCombobox((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListUsers({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
		}).then((response) => {
			if (!cancelled) {
				setUserCombobox((prev) => ({
					...prev,
					options: response?.data?.items ?? [],
					isLoading: false,
				}));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [debouncedUserSearch]);

	const handleUserSearchChange = useCallback((value: string) => {
		setUserCombobox((prev) => {
			if (value.trim().length < 1) {
				return { ...prev, search: value, options: [], isLoading: false };
			}
			return { ...prev, search: value };
		});
	}, []);

	const handleUserChange = useCallback(
		(key: string | null) => {
			if (key === (filters.userId ?? null)) return;

			const nextUser = userCombobox.options.find((u) => u.id === key) ?? null;
			setUserCombobox((prev) => ({
				...prev,
				selected: nextUser,
				search: key ? prev.search : '',
			}));
			updateFilters({ userId: key });
		},
		[userCombobox.options, updateFilters, filters.userId]
	);

	const userComboboxOptions = useMemo(() => {
		const optionsToShow = isUserSearchActive ? userCombobox.options : [];
		return optionsToShow.map((user) => ({
			key: user.id,
			label: user.name ?? user.email,
			description: user.name ? user.email : null,
		}));
	}, [isUserSearchActive, userCombobox.options]);

	const viewMerchant = useCallback(
		(merchantId: string) => {
			router.push(Routes.panel.admin.merchantDetails(merchantId));
		},
		[router]
	);

	const evaluateMerchant = useCallback(
		(merchantId: string) => {
			router.push(Routes.panel.admin.merchantEvaluate(merchantId));
		},
		[router]
	);

	const openActivateModal = useCallback((merchant: AdminMinimalMerchant) => {
		setActivateModal({ isOpen: true, merchant });
	}, []);

	const closeActivateModal = useCallback(() => {
		setActivateModal(initialMerchantModal);
	}, []);

	const openSuspendModal = useCallback((merchant: AdminMinimalMerchant) => {
		setSuspendModal({ isOpen: true, merchant });
	}, []);

	const closeSuspendModal = useCallback(() => {
		setSuspendModal(initialMerchantModal);
	}, []);

	const openInactivateModal = useCallback((merchant: AdminMinimalMerchant) => {
		setInactivateModal({ isOpen: true, merchant });
	}, []);

	const closeInactivateModal = useCallback(() => {
		setInactivateModal(initialMerchantModal);
	}, []);

	const openSetAcquirerModal = useCallback((merchant: AdminMinimalMerchant) => {
		setSetAcquirerModal({ isOpen: true, merchant });
	}, []);

	const closeSetAcquirerModal = useCallback(() => {
		setSetAcquirerModal(initialMerchantModal);
	}, []);

	const confirmActivate = useCallback(async () => {
		if (!activateModal.merchant) return;

		setIsActionPending(true);
		try {
			const response = await adminActivateMerchant(activateModal.merchant.id);
			if (response.error) {
				toast('Erro ao ativar', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Organização ativada', {
					description: 'A organização foi ativada com sucesso.',
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				closeActivateModal();
				refresh();
			}
		} catch {
			toast('Erro ao ativar', {
				description: 'Ocorreu um erro ao ativar a organização.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [activateModal.merchant, closeActivateModal, refresh]);

	const confirmSuspend = useCallback(
		async (reason?: string) => {
			if (!suspendModal.merchant || !reason) return;

			setIsActionPending(true);
			try {
				const response = await adminSuspendMerchant(suspendModal.merchant.id, reason);
				if (response.error) {
					toast('Erro ao suspender', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Organização suspensa', {
						description: 'A organização foi suspensa com sucesso.',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					closeSuspendModal();
					refresh();
				}
			} catch {
				toast('Erro ao suspender', {
					description: 'Ocorreu um erro ao suspender a organização.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[suspendModal.merchant, closeSuspendModal, refresh]
	);

	const confirmInactivate = useCallback(
		async (reason?: string) => {
			if (!inactivateModal.merchant || !reason) return;

			setIsActionPending(true);
			try {
				const response = await adminInactivateMerchant(inactivateModal.merchant.id, reason);
				if (response.error) {
					toast('Erro ao inativar', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Organização inativada', {
						description: 'A organização foi inativada com sucesso.',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					closeInactivateModal();
					refresh();
				}
			} catch {
				toast('Erro ao inativar', {
					description: 'Ocorreu um erro ao inativar a organização.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[inactivateModal.merchant, closeInactivateModal, refresh]
	);

	return {
		data: {
			items,
			isLoading,
		},
		filters: {
			values: filters,
			hasFilters,
			update: updateFilters,
			clear: clearFilters,
			refresh,
			user: {
				search: userCombobox.search,
				options: userComboboxOptions,
				isLoading: isUserSearchActive && userCombobox.isLoading,
				selectedName: userCombobox.selected?.name ?? userCombobox.selected?.email,
				onSearchChange: handleUserSearchChange,
				onChange: handleUserChange,
			},
		},
		modals: {
			activate: {
				isOpen: activateModal.isOpen,
				merchant: activateModal.merchant,
				open: openActivateModal,
				close: closeActivateModal,
				confirm: confirmActivate,
			},
			suspend: {
				isOpen: suspendModal.isOpen,
				merchant: suspendModal.merchant,
				open: openSuspendModal,
				close: closeSuspendModal,
				confirm: confirmSuspend,
			},
			inactivate: {
				isOpen: inactivateModal.isOpen,
				merchant: inactivateModal.merchant,
				open: openInactivateModal,
				close: closeInactivateModal,
				confirm: confirmInactivate,
			},
			setAcquirer: {
				isOpen: setAcquirerModal.isOpen,
				merchant: setAcquirerModal.merchant,
				open: openSetAcquirerModal,
				close: closeSetAcquirerModal,
			},
		},
		actions: {
			viewMerchant,
			evaluateMerchant,
		},
		context: {
			isActionPending,
		},
	};
}

