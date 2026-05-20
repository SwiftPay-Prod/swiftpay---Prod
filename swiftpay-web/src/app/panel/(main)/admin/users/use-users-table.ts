'use client';

import { use, useState, useCallback, useTransition, createElement } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { adminSuspendUser, adminInactivateUser, adminActivateUser, adminSuspendFromRanking, adminRemoveRankingSuspension } from '@/app/actions/admin/users';
import { Routes } from '@/router/routes';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import type { AdminMinimalUser, AdminSuspendFromRankingRequest } from '@/types/admin/users';
import type { ApiResponse, Paginated } from '@/types/common';
import type { Filters } from './page';
import { UserRole, UserStatus } from '@/types/enums';

type UsersPromise = Promise<ApiResponse<Paginated<AdminMinimalUser>>>;

interface FiltersState {
	search: string;
	role: UserRole | 'all';
	status: UserStatus | 'all';
	wasReferred: 'all' | 'true' | 'false';
	sortBy: 'createdAt' | 'referredUsersCount' | 'availableCommissionBalance' | 'generatedReferralCommission';
	sortOrder: 'asc' | 'desc';
	pageSize: string;
}

interface UserModalState {
	isOpen: boolean;
	user: AdminMinimalUser | null;
}

interface ModalsState {
	activate: UserModalState;
	suspend: UserModalState;
	inactivate: UserModalState;
	role: UserModalState;
	rankingSuspension: UserModalState;
}

const initialFilters: FiltersState = {
	search: '',
	role: 'all',
	status: 'all',
	wasReferred: 'all',
	sortBy: 'createdAt',
	sortOrder: 'desc',
	pageSize: '10',
};

const initialModalState: UserModalState = { isOpen: false, user: null };

const initialModals: ModalsState = {
	activate: initialModalState,
	suspend: initialModalState,
	inactivate: initialModalState,
	role: initialModalState,
	rankingSuspension: initialModalState,
};

interface UseUsersTableProps {
	fetchPromise: UsersPromise;
	filters: Filters;
	currentUserRole?: UserRole;
	currentUserId?: string;
}

export function useUsersTable({ fetchPromise, filters, currentUserRole, currentUserId }: UseUsersTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const { data: responseData } = use(fetchPromise) ?? { data: null };
	const items = responseData ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	const [filterValues, setFilterValues] = useState<FiltersState>({
		search: filters.search ?? '',
		role: filters.role ?? 'all',
		status: filters.status ?? 'all',
		wasReferred: typeof filters.wasReferred === 'boolean' ? String(filters.wasReferred) as 'true' | 'false' : 'all',
		sortBy: filters.sortBy ?? 'createdAt',
		sortOrder: filters.sortOrder ?? 'desc',
		pageSize: String(filters.pageSize ?? 10),
	});

	const [modals, setModals] = useState<ModalsState>(initialModals);
	const [isActionPending, setIsActionPending] = useState(false);

	const hasFilters =
		filterValues.search !== '' ||
		filterValues.role !== 'all' ||
		filterValues.status !== 'all' ||
		filterValues.wasReferred !== 'all' ||
		filterValues.sortBy !== 'createdAt' ||
		filterValues.sortOrder !== 'desc' ||
		filterValues.pageSize !== '10';

	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === 'all' || (key === 'pageSize' && value === 10)) {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				if (!('page' in newParams)) params.delete('page');

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[pathname, router, searchParams]
	);

	const updateFilter = useCallback(
		<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
			setFilterValues((prev) => ({ ...prev, [key]: value }));
			navigate({ [key]: value === '' || value === 'all' ? null : value });
		},
		[navigate]
	);

	const clearFilters = useCallback(() => {
		setFilterValues(initialFilters);
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
	}, [pathname, router]);

	const handlePageChange = useCallback(
		(page: number) => {
			navigate({ page: page > 1 ? page : null });
		},
		[navigate]
	);

	const refresh = useCallback(() => {
		startTransition(() => {
			router.refresh();
		});
	}, [router]);

	const viewUser = useCallback(
		(userId: string) => {
			router.push(Routes.panel.admin.userDetails(userId));
		},
		[router]
	);

	const viewReferralMovements = useCallback(
		(userId: string) => {
			router.push(`${Routes.panel.admin.userDetails(userId)}?tab=referrals`);
		},
		[router]
	);

	const openModal = useCallback(
		(type: keyof ModalsState, user: AdminMinimalUser) => {
			setModals((prev) => ({ ...prev, [type]: { isOpen: true, user } }));
		},
		[]
	);

	const closeModal = useCallback((type: keyof ModalsState) => {
		setModals((prev) => ({ ...prev, [type]: { isOpen: false, user: null } }));
	}, []);

	const handleActivate = useCallback(async () => {
		if (!modals.activate.user) return;

		setIsActionPending(true);
		try {
			const response = await adminActivateUser(modals.activate.user.id);
			if (response.error) {
				toast('Erro ao ativar', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Usuário ativado', {
					description: 'O usuário foi ativado com sucesso.',
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				closeModal('activate');
				refresh();
			}
		} catch {
			toast('Erro ao ativar', {
				description: 'Ocorreu um erro ao ativar o usuário.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [modals.activate.user, closeModal, refresh]);

	const handleSuspend = useCallback(
		async (reason?: string) => {
			if (!modals.suspend.user || !reason) return;

			setIsActionPending(true);
			try {
				const response = await adminSuspendUser(modals.suspend.user.id, reason);
				if (response.error) {
					toast('Erro ao suspender', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Usuário suspenso', {
						description: 'O usuário foi suspenso com sucesso.',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					closeModal('suspend');
					refresh();
				}
			} catch {
				toast('Erro ao suspender', {
					description: 'Ocorreu um erro ao suspender o usuário.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[modals.suspend.user, closeModal, refresh]
	);

	const handleInactivate = useCallback(
		async (reason?: string) => {
			if (!modals.inactivate.user || !reason) return;

			setIsActionPending(true);
			try {
				const response = await adminInactivateUser(modals.inactivate.user.id, reason);
				if (response.error) {
					toast('Erro ao inativar', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Usuário inativado', {
						description: 'O usuário foi inativado com sucesso.',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					closeModal('inactivate');
					refresh();
				}
			} catch {
				toast('Erro ao inativar', {
					description: 'Ocorreu um erro ao inativar o usuário.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[modals.inactivate.user, closeModal, refresh]
	);

	const handleSuspendFromRanking = useCallback(
		async (data: AdminSuspendFromRankingRequest) => {
			if (!modals.rankingSuspension.user) return;

			setIsActionPending(true);
			try {
				const response = await adminSuspendFromRanking(modals.rankingSuspension.user.id, data);
				if (response.error) {
					toast('Erro ao suspender do ranking', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Suspenso do ranking', {
						description: 'Usuário suspenso do ranking com sucesso.',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					closeModal('rankingSuspension');
					refresh();
				}
			} catch {
				toast('Erro ao suspender do ranking', {
					description: 'Ocorreu um erro ao suspender o usuário do ranking.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[modals.rankingSuspension.user, closeModal, refresh]
	);

	const handleRemoveRankingSuspension = useCallback(async () => {
		if (!modals.rankingSuspension.user) return;

		setIsActionPending(true);
		try {
			const response = await adminRemoveRankingSuspension(modals.rankingSuspension.user.id);
			if (response.error) {
				toast('Erro ao remover suspensão', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Suspensão removida', {
					description: 'Suspensão do ranking removida com sucesso.',
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				closeModal('rankingSuspension');
				refresh();
			}
		} catch {
			toast('Erro ao remover suspensão', {
				description: 'Ocorreu um erro ao remover a suspensão.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [modals.rankingSuspension.user, closeModal, refresh]);

	return {
		data: {
			items,
			isLoading: isPending,
			pageSizeValue: filters.pageSize ?? 10,
		},
		filters: {
			values: filterValues,
			hasFilters,
			updateFilter,
			clear: clearFilters,
			handlePageChange,
		},
		modals: {
			activate: {
				isOpen: modals.activate.isOpen,
				user: modals.activate.user,
				open: (user: AdminMinimalUser) => openModal('activate', user),
				close: () => closeModal('activate'),
			},
			suspend: {
				isOpen: modals.suspend.isOpen,
				user: modals.suspend.user,
				open: (user: AdminMinimalUser) => openModal('suspend', user),
				close: () => closeModal('suspend'),
			},
			inactivate: {
				isOpen: modals.inactivate.isOpen,
				user: modals.inactivate.user,
				open: (user: AdminMinimalUser) => openModal('inactivate', user),
				close: () => closeModal('inactivate'),
			},
			role: {
				isOpen: modals.role.isOpen,
				user: modals.role.user,
				open: (user: AdminMinimalUser) => openModal('role', user),
				close: () => closeModal('role'),
			},
			rankingSuspension: {
				isOpen: modals.rankingSuspension.isOpen,
				user: modals.rankingSuspension.user,
				open: (user: AdminMinimalUser) => openModal('rankingSuspension', user),
				close: () => closeModal('rankingSuspension'),
			},
			isActionPending,
		},
		actions: {
			refresh,
			viewUser,
			viewReferralMovements,
			handleActivate,
			handleSuspend,
			handleInactivate,
			handleSuspendFromRanking,
			handleRemoveRankingSuspension,
		},
		context: {
			currentUserRole: currentUserRole ?? UserRole.Admin,
			currentUserId: currentUserId ?? '',
		},
	};
}

