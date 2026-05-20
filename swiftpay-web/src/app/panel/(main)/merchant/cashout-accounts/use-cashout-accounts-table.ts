'use client';

import { use, useState, useCallback, useTransition, createElement } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Mail01Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import {
	verifyCashoutAccount,
	resendVerificationCode,
	setDefaultCashoutAccount,
	deleteCashoutAccount,
	requestCashoutAccountAction,
} from '@/app/actions/merchant/cashout-accounts';
import { openWithDelay } from '@/utils/modal';
import type {
	CashoutAccountListData,
	ListCashoutAccountsData,
	CashoutAccountsFilters,
} from '@/types/merchant/cashout-accounts';
import type { ApiResponse } from '@/types/common';
import { PayoutAccountActionType, PayoutAccountStatus } from '@/types/enums';

type AccountsPromise = Promise<ApiResponse<ListCashoutAccountsData>>;
type StatusFilterKey = 'all' | PayoutAccountStatus;

interface ViewModalState {
	isOpen: boolean;
	account: CashoutAccountListData | null;
}

interface ConfirmCodeModalState {
	isOpen: boolean;
	account: CashoutAccountListData | null;
	actionType: PayoutAccountActionType | null;
}

const initialViewModal: ViewModalState = {
	isOpen: false,
	account: null,
};

const initialConfirmCodeModal: ConfirmCodeModalState = {
	isOpen: false,
	account: null,
	actionType: null,
};

interface UseCashoutAccountsTableProps {
	fetchPromise: AccountsPromise;
	merchantId: string;
	filters: CashoutAccountsFilters;
}

export function useCashoutAccountsTable({ fetchPromise, merchantId, filters }: UseCashoutAccountsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const { data: responseData } = use(fetchPromise) ?? { data: null };
	const items = responseData ?? { items: [], totalItems: 0 };

	const [isActionPending, setIsActionPending] = useState(false);
	const [statusFilter, setStatusFilter] = useState<StatusFilterKey>(
		filters.statuses && filters.statuses.length === 1 ? (filters.statuses[0] ?? 'all') : 'all'
	);

	const [createModal, setCreateModal] = useState(false);
	const [viewModal, setViewModal] = useState<ViewModalState>(initialViewModal);
	const [confirmCodeModal, setConfirmCodeModal] = useState<ConfirmCodeModalState>(initialConfirmCodeModal);

	const hasFilters = statusFilter !== 'all';

	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === 'all') {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[searchParams, pathname, router]
	);

	const refresh = useCallback(() => {
		startTransition(() => {
			router.refresh();
		});
	}, [router]);

	const handleStatusChange = useCallback(
		(value: StatusFilterKey) => {
			setStatusFilter(value);
			navigate({ status: value });
		},
		[navigate]
	);

	const clearFilters = useCallback(() => {
		setStatusFilter('all');
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
	}, [router, pathname]);

	const openCreateModal = useCallback(() => {
		setCreateModal(true);
	}, []);

	const closeCreateModal = useCallback(() => {
		setCreateModal(false);
	}, []);

	const handleAccountCreated = useCallback((account: CashoutAccountListData) => {
		setCreateModal(false);
		openWithDelay(() => {
			setConfirmCodeModal({ isOpen: true, account, actionType: PayoutAccountActionType.Activate });
		}, 300);
	}, []);

	const openViewModal = useCallback((account: CashoutAccountListData) => {
		setViewModal({ isOpen: true, account });
	}, []);

	const closeViewModal = useCallback(() => {
		setViewModal(initialViewModal);
	}, []);

	const openConfirmCodeModal = useCallback((account: CashoutAccountListData, actionType: PayoutAccountActionType) => {
		setConfirmCodeModal({ isOpen: true, account, actionType });
	}, []);

	const closeConfirmCodeModal = useCallback(() => {
		setConfirmCodeModal(initialConfirmCodeModal);
	}, []);

	const verifyPendingAccount = useCallback((account: CashoutAccountListData) => {
		setConfirmCodeModal({ isOpen: true, account, actionType: PayoutAccountActionType.Activate });
	}, []);

	const requestAction = useCallback(
		async (account: CashoutAccountListData, actionType: PayoutAccountActionType) => {
			setIsActionPending(true);
			try {
				const response = await requestCashoutAccountAction(merchantId, account.id, actionType);
				if (response.error) {
					toast('Erro ao solicitar código', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Código enviado', {
						description: response.message ?? 'Verifique seu e-mail.',
						variant: 'success',
						indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
					});
					setConfirmCodeModal({ isOpen: true, account, actionType });
				}
			} catch {
				toast('Erro ao solicitar código', {
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

	const confirmCode = useCallback(
		async (code: string) => {
			const { account, actionType } = confirmCodeModal;
			if (!account || !actionType) return;

			setIsActionPending(true);
			try {
				if (actionType === 'Activate') {
					const response = await verifyCashoutAccount(merchantId, account.id, code);
					if (response.error) {
						toast('Erro ao verificar conta', {
							description: response.error.message,
							variant: 'danger',
							indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
						});
					} else {
						toast('Conta verificada', {
							description: 'A conta foi verificada com sucesso!',
							variant: 'success',
							indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
						});
						closeConfirmCodeModal();
						refresh();
					}
				} else if (actionType === 'SetDefault') {
					const response = await setDefaultCashoutAccount(merchantId, account.id, code);
					if (response.error) {
						toast('Erro ao definir padrão', {
							description: response.error.message,
							variant: 'danger',
							indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
						});
					} else {
						toast('Conta padrão definida', {
							description: 'A conta foi definida como padrão!',
							variant: 'success',
							indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
						});
						closeConfirmCodeModal();
						refresh();
					}
				} else if (actionType === 'Delete') {
					const response = await deleteCashoutAccount(merchantId, account.id, code);
					if (response.error) {
						toast('Erro ao remover conta', {
							description: response.error.message,
							variant: 'danger',
							indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
						});
					} else {
						toast('Conta removida', {
							description: 'A conta foi removida com sucesso!',
							variant: 'success',
							indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
						});
						closeConfirmCodeModal();
						refresh();
					}
				}
			} catch {
				toast('Erro ao executar ação', {
					description: 'Ocorreu um erro inesperado.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} finally {
				setIsActionPending(false);
			}
		},
		[confirmCodeModal, merchantId, closeConfirmCodeModal, refresh]
	);

	const resendCode = useCallback(async () => {
		const { account, actionType } = confirmCodeModal;
		if (!account || !actionType) return;

		setIsActionPending(true);
		try {
			if (actionType === 'Activate') {
				const response = await resendVerificationCode(merchantId, account.id);
				if (response.error) {
					toast('Erro ao reenviar código', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Código reenviado', {
						description: 'Verifique seu e-mail!',
						variant: 'success',
						indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
					});
				}
			} else {
				const response = await requestCashoutAccountAction(merchantId, account.id, actionType);
				if (response.error) {
					toast('Erro ao reenviar código', {
						description: response.error.message,
						variant: 'danger',
						indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
					});
				} else {
					toast('Código reenviado', {
						description: 'Verifique seu e-mail!',
						variant: 'success',
						indicator: createElement(Icon, { icon: Mail01Icon, className: 'icon-sm' }),
					});
				}
			}
		} catch {
			toast('Erro ao reenviar código', {
				description: 'Ocorreu um erro inesperado.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} finally {
			setIsActionPending(false);
		}
	}, [confirmCodeModal, merchantId]);

	const copyPixKey = useCallback((pixKey: string) => {
		void navigator.clipboard.writeText(pixKey).catch(() => undefined);
		toast('Chave PIX copiada', {
			description: 'A chave foi copiada para a área de transferência.',
			variant: 'success',
			indicator: createElement(Icon, { icon: Copy01Icon, className: 'icon-sm' }),
		});
	}, []);

	const getConfirmCodeModalContent = useCallback(() => {
		const { account, actionType } = confirmCodeModal;
		if (!account || !actionType || actionType == null) return { title: '', description: '' };

		const truncatedKey = account.pixKey.length > 20 ? `${account.pixKey.slice(0, 20)}...` : account.pixKey;

		switch (actionType) {
			case 'Activate':
				return {
					title: 'Verificar Conta',
					description: `Insira o código de 6 dígitos enviado para seu e-mail para ativar a conta com chave PIX "${truncatedKey}".`,
				};
			case 'SetDefault':
				return {
					title: 'Definir como Padrão',
					description: `Insira o código de 6 dígitos enviado para seu e-mail para definir a conta "${truncatedKey}" como padrão.`,
				};
			case 'Delete':
				return {
					title: 'Remover Conta',
					description: `Insira o código de 6 dígitos enviado para seu e-mail para remover a conta "${truncatedKey}".`,
				};
			default:
				return {
					title: '',
					description: '',
				};
		}
	}, [confirmCodeModal]);

	return {
		data: {
			items,
			isLoading: isPending,
		},
		filters: {
			status: statusFilter,
			hasFilters,
			handleStatusChange,
			clear: clearFilters,
			refresh,
		},
		modals: {
			create: {
				isOpen: createModal,
				open: openCreateModal,
				close: closeCreateModal,
				onAccountCreated: handleAccountCreated,
			},
			view: {
				isOpen: viewModal.isOpen,
				account: viewModal.account,
				open: openViewModal,
				close: closeViewModal,
			},
			confirmCode: {
				isOpen: confirmCodeModal.isOpen,
				account: confirmCodeModal.account,
				actionType: confirmCodeModal.actionType,
				open: openConfirmCodeModal,
				close: closeConfirmCodeModal,
				confirm: confirmCode,
				resend: resendCode,
				getContent: getConfirmCodeModalContent,
			},
		},
		actions: {
			verifyPendingAccount,
			requestAction,
			copyPixKey,
		},
		context: {
			merchantId,
			isActionPending,
		},
	};
}

