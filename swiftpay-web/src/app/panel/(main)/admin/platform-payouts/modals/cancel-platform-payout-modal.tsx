'use client';

import { useActionState, useTransition } from 'react';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { formatCurrency } from '@/utils/currency';
import { adminCancelPlatformPayout } from '@/app/actions/admin/platform-payouts';
import type { AdminPlatformPayoutData } from '@/types/admin/platform-payouts';

interface CancelPlatformPayoutModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	payout: AdminPlatformPayoutData | null;
	onSuccess: () => void;
}

interface FormState {
	error: string | null;
}

export function CancelPlatformPayoutModal({
	isOpen,
	onOpenChange,
	payout,
	onSuccess,
}: CancelPlatformPayoutModalProps) {
	const [, startTransition] = useTransition();

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState): Promise<FormState> => {
			if (!payout) return { error: 'Saque não encontrado' };

			const response = await adminCancelPlatformPayout(payout.id);

			if (response?.error) {
				return { error: response.error.message ?? 'Erro ao cancelar saque da plataforma' };
			}

			toast('Saque cancelado', {
				description:
					response?.message ?? 'O valor foi devolvido ao saldo disponível da plataforma.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			onSuccess();
			return { error: null };
		},
		{ error: null }
	);

	if (!payout) {
		return null;
	}

	return (
		<ConfirmationModal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Cancelar Saque"
			description={`Tem certeza que deseja cancelar o saque de ${formatCurrency(payout.totalNetAmount)}? O valor será devolvido ao saldo disponível da plataforma.`}
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
