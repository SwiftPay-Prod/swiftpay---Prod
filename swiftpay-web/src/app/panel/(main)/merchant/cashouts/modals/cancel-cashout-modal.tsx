'use client';

import { useActionState, useTransition } from 'react';
import { cancelCashout } from '@/app/actions/merchant/cashouts';
import { formatCurrency } from '@/utils/currency';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { CashoutListItem } from '@/types/merchant/cashouts';

interface CancelCashoutModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	cashout: CashoutListItem | null;
	onSuccess: () => void;
}

interface FormState {
	error: string | null;
}

export function CancelCashoutModal({
	isOpen,
	onOpenChange,
	merchantId,
	cashout,
	onSuccess,
}: CancelCashoutModalProps) {
	const [, startTransition] = useTransition();

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState): Promise<FormState> => {
			if (!cashout) return { error: 'Saque não encontrado' };

			const response = await cancelCashout(merchantId, cashout.id);

			if (response?.error) {
				return { error: response.error.message ?? 'Erro ao cancelar saque' };
			}

			toast('Saque cancelado', {
				description: 'O valor foi devolvido ao seu saldo disponível.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			onSuccess();
			return { error: null };
		},
		{ error: null }
	);

	if (!cashout) {
		return null;
	}

	return (
		<ConfirmationModal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Cancelar Saque"
			description={`Tem certeza que deseja cancelar o saque de ${formatCurrency(cashout.netAmount)}? O valor será devolvido ao seu saldo disponível.`}
			confirmLabel="Cancelar Saque"
			cancelLabel="Voltar"
			status="danger"
			isPending={isPending}
			onConfirm={() => {
				startTransition(() => {
					formAction();
				});
			}}
			error={state.error}
		/>
	);
}

