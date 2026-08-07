'use client';

import { use, useState, useCallback, useTransition, createElement } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
	createApiCredential,
	regenerateApiCredential,
	deleteApiCredential,
} from '@/app/actions/merchant/api-credentials';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Copy01Icon } from '@hugeicons/core-free-icons';
import type {
	ApiCredentialListData,
	ApiCredentialData,
	RegenerateApiCredentialData,
} from '@/types/merchant/api-credentials';
import type { Filters } from './page';
import type { Paginated, ApiResponse } from '@/types/common';
import { MerchantApiCredentialEnvironment, MerchantApiCredentialStatus } from '@/types/enums';

type CredentialsPromise = Promise<ApiResponse<Paginated<ApiCredentialListData>>>;

// State interfaces
interface FiltersState {
	name: string;
	environment: MerchantApiCredentialEnvironment | 'all';
	status: MerchantApiCredentialStatus | 'all';
	sortOrder: 'asc' | 'desc';
	pageSize: string;
}

interface CreateModalState {
	isOpen: boolean;
}

interface ViewModalState {
	isOpen: boolean;
	credential: ApiCredentialListData | null;
}

interface WarningModalState {
	isOpen: boolean;
	credential: ApiCredentialListData | null;
}

interface NewCredentialModalState {
	showModal: boolean;
	credential: ApiCredentialData | null;
}

interface RegeneratedCredentialModalState {
	showModal: boolean;
	credential: RegenerateApiCredentialData | null;
}

// Initial states
const initialFiltersState: FiltersState = {
	name: '',
	environment: 'all',
	status: MerchantApiCredentialStatus.Active,
	sortOrder: 'desc',
	pageSize: '10',
};

const initialCreateModalState: CreateModalState = {
	isOpen: false,
};

const initialViewModalState: ViewModalState = {
	isOpen: false,
	credential: null,
};

const initialWarningModalState: WarningModalState = {
	isOpen: false,
	credential: null,
};

const initialNewCredentialModalState: NewCredentialModalState = {
	showModal: false,
	credential: null,
};

const initialRegeneratedCredentialModalState: RegeneratedCredentialModalState = {
	showModal: false,
	credential: null,
};

interface UseApiCredentialsTableProps {
	fetchPromise: CredentialsPromise;
	merchantId: string;
	filters: Filters;
}

export function useApiCredentialsTable({ fetchPromise, merchantId, filters }: UseApiCredentialsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [isActionPending, setIsActionPending] = useState(false);

	// Fetch data
	const { data: responseData } = use(fetchPromise) ?? { data: null };
	const data = responseData ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	// Filter states
	const [filtersState, setFiltersState] = useState<FiltersState>({
		name: filters.name ?? '',
		environment: filters.environment ?? 'all',
		status: filters.status ?? MerchantApiCredentialStatus.Active,
		sortOrder: filters.sortOrder ?? 'desc',
		pageSize: String(filters.pageSize ?? 10),
	});

	// Modal states
	const [createModal, setCreateModal] = useState<CreateModalState>(initialCreateModalState);
	const [viewModal, setViewModal] = useState<ViewModalState>(initialViewModalState);
	const [regenerateWarningModal, setRegenerateWarningModal] = useState<WarningModalState>(initialWarningModalState);
	const [deleteWarningModal, setDeleteWarningModal] = useState<WarningModalState>(initialWarningModalState);
	const [newCredentialModal, setNewCredentialModal] = useState<NewCredentialModalState>(initialNewCredentialModalState);
	const [regeneratedCredentialModal, setRegeneratedCredentialModal] = useState<RegeneratedCredentialModalState>(
		initialRegeneratedCredentialModalState
	);

	// Navigate helper
	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === 'all') {
						params.delete(key);
					} else if (key === 'pageSize' && value === 10) {
						params.delete(key);
					} else if (key === 'sortOrder' && value === 'desc') {
						params.delete(key);
					} else if (key === 'status' && value === MerchantApiCredentialStatus.Active) {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				if (!('page' in newParams)) {
					params.delete('page');
				}

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[pathname, router, searchParams, startTransition]
	);

	// Filter handlers
	const handleSearchChange = useCallback(
		(value: string) => {
			setFiltersState((prev) => ({ ...prev, name: value }));
			navigate({ name: value || undefined });
		},
		[navigate]
	);

	const handleEnvironmentChange = useCallback(
		(value: string) => {
			const newEnvironment = (value || 'all') as MerchantApiCredentialEnvironment | 'all';
			setFiltersState((prev) => ({ ...prev, environment: newEnvironment }));
			navigate({ environment: newEnvironment });
		},
		[navigate]
	);

	const handleStatusChange = useCallback(
		(value: string) => {
			const newStatus = (value || 'all') as MerchantApiCredentialStatus | 'all';
			setFiltersState((prev) => ({ ...prev, status: newStatus }));
			navigate({ status: newStatus });
		},
		[navigate]
	);

	const handleSortToggle = useCallback(() => {
		const newOrder = filtersState.sortOrder === 'desc' ? 'asc' : 'desc';
		setFiltersState((prev) => ({ ...prev, sortOrder: newOrder }));
		navigate({ sortOrder: newOrder });
	}, [filtersState.sortOrder, navigate]);

	const handlePageSizeChange = useCallback(
		(value: string) => {
			const newPageSize = value || '10';
			setFiltersState((prev) => ({ ...prev, pageSize: newPageSize }));
			navigate({ pageSize: Number(newPageSize) });
		},
		[navigate]
	);

	const handleClearFilters = useCallback(() => {
		setFiltersState(initialFiltersState);
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
	}, [pathname, router, startTransition]);

	const handlePageChange = useCallback(
		(page: number) => {
			navigate({ page: page > 1 ? page : undefined });
		},
		[navigate]
	);

	const handleRefresh = useCallback(() => {
		startTransition(() => {
			router.refresh();
		});
	}, [router, startTransition]);

	// Compute hasFilters
	const hasFilters = !!(
		filtersState.name ||
		filtersState.environment !== 'all' ||
		filtersState.status !== 'all' ||
		filtersState.sortOrder !== 'desc' ||
		filtersState.pageSize !== '10'
	);

	// Copy handler
	const handleCopyClientId = useCallback((clientId: string) => {
		void navigator.clipboard.writeText(clientId).catch(() => undefined);
		toast('Public Key copiado', {
			description: 'A chave foi copiada para a área de transferência.',
			variant: 'success',
			indicator: createElement(Icon, { icon: Copy01Icon, className: 'icon-sm' }),
		});
	}, []);

	// Modal open handlers
	const openCreateModal = useCallback(() => {
		setCreateModal({ isOpen: true });
	}, []);

	const closeCreateModal = useCallback(() => {
		setCreateModal(initialCreateModalState);
	}, []);

	const openViewModal = useCallback((credential: ApiCredentialListData) => {
		setViewModal({ isOpen: true, credential });
	}, []);

	const closeViewModal = useCallback(() => {
		setViewModal(initialViewModalState);
	}, []);

	const openRegenerateWarningModal = useCallback((credential: ApiCredentialListData) => {
		setRegenerateWarningModal({ isOpen: true, credential });
	}, []);

	const closeRegenerateWarningModal = useCallback(() => {
		setRegenerateWarningModal(initialWarningModalState);
	}, []);

	const openDeleteWarningModal = useCallback((credential: ApiCredentialListData) => {
		setDeleteWarningModal({ isOpen: true, credential });
	}, []);

	const closeDeleteWarningModal = useCallback(() => {
		setDeleteWarningModal(initialWarningModalState);
	}, []);

	const closeNewCredentialModal = useCallback(() => {
		setNewCredentialModal(initialNewCredentialModalState);
	}, []);

	const closeRegeneratedCredentialModal = useCallback(() => {
		setRegeneratedCredentialModal(initialRegeneratedCredentialModalState);
	}, []);

	// Request Create (sem verificação por e-mail)
	const handleRequestCreate = useCallback(
		async (createData: { name?: string; environment: MerchantApiCredentialEnvironment; allowedIpRange?: string }) => {
			setIsActionPending(true);
			try {
				const response = await createApiCredential(merchantId, createData);
				if (response.error) {
					toast('Erro ao criar credencial', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else if (response.data) {
					toast('Credencial criada', {
						description: 'A credencial foi criada com sucesso!',
						variant: 'success',
						indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
					});
					setCreateModal({ isOpen: false });
					setNewCredentialModal({ showModal: true, credential: response.data });
					startTransition(() => {
						router.refresh();
					});
				}
			} catch {
				toast('Erro ao criar credencial', {
					description: 'Ocorreu um erro inesperado.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[merchantId, router, startTransition]
	);

	// Request Regenerate (sem verificação por e-mail)
	const handleRequestRegenerate = useCallback(async () => {
		if (!regenerateWarningModal.credential) return;

		setIsActionPending(true);
		try {
			const response = await regenerateApiCredential(merchantId, {
				credentialId: regenerateWarningModal.credential.id,
			});
			if (response.error) {
				toast('Erro ao regenerar credencial', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else if (response.data) {
				toast('Credencial regenerada', {
					description: 'A credencial foi regenerada com sucesso!',
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				setRegenerateWarningModal(initialWarningModalState);
				setRegeneratedCredentialModal({ showModal: true, credential: response.data });
				startTransition(() => {
					router.refresh();
				});
			}
		} catch {
			toast('Erro ao regenerar credencial', {
				description: 'Ocorreu um erro inesperado.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [merchantId, regenerateWarningModal.credential, router, startTransition]);

	// Request Delete (sem verificação por e-mail)
	const handleRequestDelete = useCallback(async () => {
		if (!deleteWarningModal.credential) return;

		setIsActionPending(true);
		try {
			const response = await deleteApiCredential(merchantId, deleteWarningModal.credential.id);
			if (response.error) {
				toast('Erro ao revogar credencial', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Credencial revogada', {
					description: 'A credencial foi revogada com sucesso!',
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				setDeleteWarningModal(initialWarningModalState);
				startTransition(() => {
					router.refresh();
				});
			}
		} catch {
			toast('Erro ao revogar credencial', {
				description: 'Ocorreu um erro inesperado.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [merchantId, deleteWarningModal.credential, router, startTransition]);

	return {
		// Data
		data: {
			items: data,
			isLoading: isPending,
		},
		// Filters
		filters: {
			values: filtersState,
			hasFilters,
			onSearchChange: handleSearchChange,
			onEnvironmentChange: handleEnvironmentChange,
			onStatusChange: handleStatusChange,
			onSortToggle: handleSortToggle,
			onPageSizeChange: handlePageSizeChange,
			onClear: handleClearFilters,
			onPageChange: handlePageChange,
		},
		// Modals
		modals: {
			create: {
				isOpen: createModal.isOpen,
				open: openCreateModal,
				close: closeCreateModal,
			},
			view: {
				isOpen: viewModal.isOpen,
				credential: viewModal.credential,
				open: openViewModal,
				close: closeViewModal,
			},
			regenerateWarning: {
				isOpen: regenerateWarningModal.isOpen,
				credential: regenerateWarningModal.credential,
				open: openRegenerateWarningModal,
				close: closeRegenerateWarningModal,
			},
			deleteWarning: {
				isOpen: deleteWarningModal.isOpen,
				credential: deleteWarningModal.credential,
				open: openDeleteWarningModal,
				close: closeDeleteWarningModal,
			},
			newCredential: {
				isOpen: newCredentialModal.showModal,
				credential: newCredentialModal.credential,
				close: closeNewCredentialModal,
			},
			regeneratedCredential: {
				isOpen: regeneratedCredentialModal.showModal,
				credential: regeneratedCredentialModal.credential,
				close: closeRegeneratedCredentialModal,
			},
		},
		// Actions
		actions: {
			refresh: handleRefresh,
			copyClientId: handleCopyClientId,
			requestCreate: handleRequestCreate,
			requestRegenerate: handleRequestRegenerate,
			requestDelete: handleRequestDelete,
		},
		// Context
		context: {
			merchantId,
			isActionPending,
			filtersFromPage: filters,
		},
	};
}

