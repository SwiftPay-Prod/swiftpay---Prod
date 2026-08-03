'use client';

import { use, useState, useCallback, useTransition, useEffect, createElement } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
	requestCreateApiCredential,
	confirmCreateApiCredential,
	requestRegenerateApiCredential,
	confirmRegenerateApiCredential,
	requestDeleteApiCredential,
	confirmDeleteApiCredential,
} from '@/app/actions/merchant/api-credentials';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Mail01Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import type {
	ApiCredentialListData,
	ApiCredentialData,
	ConfirmRegenerateApiCredentialData,
	RequestCreateApiCredentialRequest,
} from '@/types/merchant/api-credentials';
import type { Filters } from './page';
import type { Paginated, ApiResponse } from '@/types/common';
import { MerchantApiCredentialEnvironment, MerchantApiCredentialStatus } from '@/types/enums';

type CredentialsPromise = Promise<ApiResponse<Paginated<ApiCredentialListData>>>;
type PendingAction = 'create' | 'regenerate' | 'delete' | null;

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
	pendingData: Omit<RequestCreateApiCredentialRequest, 'merchantId'> | null;
}

interface ConfirmCodeModalState {
	isOpen: boolean;
	pendingAction: PendingAction;
	pendingCredentialId: string | null;
	pendingCredentialName: string | null;
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
	credential: ConfirmRegenerateApiCredentialData | null;
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
	pendingData: null,
};

const initialConfirmCodeModalState: ConfirmCodeModalState = {
	isOpen: false,
	pendingAction: null,
	pendingCredentialId: null,
	pendingCredentialName: null,
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
	const [confirmCodeModal, setConfirmCodeModal] = useState<ConfirmCodeModalState>(initialConfirmCodeModalState);
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
		setCreateModal({ isOpen: true, pendingData: null });
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

	const closeConfirmCodeModal = useCallback(() => {
		setConfirmCodeModal(initialConfirmCodeModalState);
	}, []);

	const closeNewCredentialModal = useCallback(() => {
		setNewCredentialModal(initialNewCredentialModalState);
	}, []);

	const closeRegeneratedCredentialModal = useCallback(() => {
		setRegeneratedCredentialModal(initialRegeneratedCredentialModalState);
	}, []);

	// Reset pending state helper
	const resetPendingState = useCallback(() => {
		setCreateModal((prev) => ({ ...prev, pendingData: null }));
	}, []);

	// Request Create
	const handleRequestCreate = useCallback(
		async (createData: { name?: string; environment: MerchantApiCredentialEnvironment; allowedIpRange?: string }) => {
			setIsActionPending(true);
			try {
				const response = await requestCreateApiCredential(merchantId, createData);
				if (response.error) {
					toast('Erro ao criar credencial', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Código enviado', {
						description: 'Confirmação enviada para seu e-mail!',
						variant: 'success',
						indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
					});
					setCreateModal({ isOpen: false, pendingData: createData });
					setConfirmCodeModal({
						isOpen: true,
						pendingAction: 'create',
						pendingCredentialId: null,
						pendingCredentialName: createData.name || `Credencial ${createData.environment}`,
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
		[merchantId]
	);

	// Request Regenerate
	const handleRequestRegenerate = useCallback(async () => {
		if (!regenerateWarningModal.credential) return;

		setIsActionPending(true);
		try {
			const response = await requestRegenerateApiCredential(merchantId, regenerateWarningModal.credential.id);
			if (response.error) {
				toast('Erro ao regenerar credencial', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Código enviado', {
					description: 'Confirmação enviada para seu e-mail!',
					variant: 'success',
					indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
				});
				const credentialId = regenerateWarningModal.credential.id;
				const credentialName = regenerateWarningModal.credential.name || 'Sem nome';
				setRegenerateWarningModal(initialWarningModalState);
				setTimeout(() => {
					setConfirmCodeModal({
						isOpen: true,
						pendingAction: 'regenerate',
						pendingCredentialId: credentialId,
						pendingCredentialName: credentialName,
					});
				}, 300);
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
	}, [merchantId, regenerateWarningModal.credential]);

	// Request Delete
	const handleRequestDelete = useCallback(async () => {
		if (!deleteWarningModal.credential) return;

		setIsActionPending(true);
		try {
			const response = await requestDeleteApiCredential(merchantId, deleteWarningModal.credential.id);
			if (response.error) {
				toast('Erro ao revogar credencial', {
					description: response.error.message,
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Código enviado', {
					description: 'Confirmação enviada para seu e-mail!',
					variant: 'success',
					indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
				});
				const credentialId = deleteWarningModal.credential.id;
				const credentialName = deleteWarningModal.credential.name || 'Sem nome';
				setDeleteWarningModal(initialWarningModalState);
				setTimeout(() => {
					setConfirmCodeModal({
						isOpen: true,
						pendingAction: 'delete',
						pendingCredentialId: credentialId,
						pendingCredentialName: credentialName,
					});
				}, 300);
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
	}, [merchantId, deleteWarningModal.credential]);

	// Confirm Code
	const handleConfirmCode = useCallback(
		async (code: string) => {
			setIsActionPending(true);
			try {
				if (confirmCodeModal.pendingAction === 'create' && createModal.pendingData) {
					const response = await confirmCreateApiCredential(merchantId, { code });
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
						setNewCredentialModal({ showModal: false, credential: response.data });
						setConfirmCodeModal(initialConfirmCodeModalState);
						resetPendingState();
						startTransition(() => {
							router.refresh();
						});
					}
				} else if (confirmCodeModal.pendingAction === 'regenerate' && confirmCodeModal.pendingCredentialId) {
					const response = await confirmRegenerateApiCredential(merchantId, confirmCodeModal.pendingCredentialId, {
						code,
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
						setRegeneratedCredentialModal({ showModal: false, credential: response.data });
						setConfirmCodeModal(initialConfirmCodeModalState);
						resetPendingState();
						startTransition(() => {
							router.refresh();
						});
					}
				} else if (confirmCodeModal.pendingAction === 'delete' && confirmCodeModal.pendingCredentialId) {
					const response = await confirmDeleteApiCredential(merchantId, confirmCodeModal.pendingCredentialId, { code });
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
						setConfirmCodeModal(initialConfirmCodeModalState);
						resetPendingState();
						startTransition(() => {
							router.refresh();
						});
					}
				}
			} catch {
				toast('Erro ao confirmar operação', {
					description: 'Ocorreu um erro inesperado.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[
			confirmCodeModal.pendingAction,
			confirmCodeModal.pendingCredentialId,
			createModal.pendingData,
			merchantId,
			resetPendingState,
			router,
			startTransition,
		]
	);

	// Effects to show credential modals after confirm code closes
	useEffect(() => {
		if (!confirmCodeModal.isOpen && newCredentialModal.credential && !newCredentialModal.showModal) {
			const timer = setTimeout(() => {
				setNewCredentialModal((prev) => ({ ...prev, showModal: true }));
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [confirmCodeModal.isOpen, newCredentialModal.credential, newCredentialModal.showModal]);

	useEffect(() => {
		if (!confirmCodeModal.isOpen && regeneratedCredentialModal.credential && !regeneratedCredentialModal.showModal) {
			const timer = setTimeout(() => {
				setRegeneratedCredentialModal((prev) => ({ ...prev, showModal: true }));
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [confirmCodeModal.isOpen, regeneratedCredentialModal.credential, regeneratedCredentialModal.showModal]);

	// Helper functions for confirm code modal
	const getConfirmCodeTitle = useCallback(() => {
		switch (confirmCodeModal.pendingAction) {
			case 'create':
				return 'Confirmar Criação';
			case 'regenerate':
				return 'Confirmar Regeneração';
			case 'delete':
				return 'Confirmar Revogação';
			default:
				return 'Confirmar Operação';
		}
	}, [confirmCodeModal.pendingAction]);

	const getConfirmCodeDescription = useCallback(() => {
		switch (confirmCodeModal.pendingAction) {
			case 'create':
				return `Insira o código de 6 dígitos enviado para seu e-mail para criar a credencial "${confirmCodeModal.pendingCredentialName}".`;
			case 'regenerate':
				return `Insira o código de 6 dígitos enviado para seu e-mail para regenerar a credencial "${confirmCodeModal.pendingCredentialName}".`;
			case 'delete':
				return `Insira o código de 6 dígitos enviado para seu e-mail para revogar a credencial "${confirmCodeModal.pendingCredentialName}".`;
			default:
				return 'Insira o código de 6 dígitos enviado para seu e-mail.';
		}
	}, [confirmCodeModal.pendingAction, confirmCodeModal.pendingCredentialName]);

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
			confirmCode: {
				isOpen: confirmCodeModal.isOpen,
				close: closeConfirmCodeModal,
				title: getConfirmCodeTitle(),
				description: getConfirmCodeDescription(),
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
			confirmCode: handleConfirmCode,
		},
		// Context
		context: {
			merchantId,
			isActionPending,
			filtersFromPage: filters,
		},
	};
}

