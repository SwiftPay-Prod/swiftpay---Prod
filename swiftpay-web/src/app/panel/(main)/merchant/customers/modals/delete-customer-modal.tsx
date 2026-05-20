'use client';

import { useActionState } from 'react';
import { Modal, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Alert01Icon, Delete02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { deleteCustomer } from '@/app/actions/merchant/customers';
import type { MinimalCustomer } from '@/types/merchant/customers';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';

interface FormState {
	error: string | null;
}

interface DeleteCustomerModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	customer: MinimalCustomer | null;
	onSuccess: () => void;
}

export function DeleteCustomerModal({
	isOpen,
	onOpenChange,
	merchantId,
	customer,
	onSuccess,
}: DeleteCustomerModalProps) {
	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState): Promise<FormState> => {
			if (!customer) return { error: 'Cliente não encontrado' };

			const response = await deleteCustomer(merchantId, customer.id);

			if (response?.error) {
				return { error: response.error.message ?? 'Erro ao excluir cliente' };
			}

			toast('Cliente excluído', {
				description: response?.message ?? 'O cliente foi removido com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess();
			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		if (!isPending) {
			onOpenChange(false);
		}
	}

	if (!customer) {
		return null;
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-danger text-danger-foreground">
							<Icon icon={Alert01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Excluir Cliente</Modal.Heading>
						<p className="text-sm text-muted">Esta ação não pode ser desfeita</p>
					</Modal.Header>
					<form action={formAction}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<p className="text-sm text-foreground">
									Tem certeza que deseja excluir o cliente <strong>{customer.name}</strong>?
								</p>
								<p className="text-sm text-muted">
									O cliente será removido permanentemente e não poderá ser recuperado. Clientes com pagamentos
									associados não podem ser excluídos.
								</p>
								{state.error && (
									<div className="flex items-center gap-2 text-sm text-danger">
										<Icon icon={Alert01Icon} className="icon-sm" />
										<span>{state.error}</span>
									</div>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
								Cancelar
							</Button>
							<AsyncButton type="submit" variant="danger" isPending={isPending}>
								<Icon icon={Delete02Icon} className="icon-sm" />
								Excluir Cliente
							</AsyncButton>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

