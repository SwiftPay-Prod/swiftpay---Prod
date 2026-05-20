'use client';

import { useActionState } from 'react';
import { Modal, Button, TextField, Input, Label } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Alert01Icon, CheckmarkCircle02Icon, ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { createMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import type { PaymentEnvironment } from '@/types/enums';

interface FormState {
	error: string | null;
}

interface CreateCheckoutModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	environment: PaymentEnvironment;
	onSuccess: (checkoutId: string) => void;
}

export function CreateCheckoutModal({
	isOpen,
	onOpenChange,
	merchantId,
	environment,
	onSuccess,
}: CreateCheckoutModalProps) {
	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const name = formData.get('name') as string;

			if (!name.trim()) return { error: 'Informe o nome do checkout' };

			const res = await createMerchantCheckout(merchantId, {
				name: name.trim(),
				environment,
			});

			if (res?.error) return { error: res.error.message };

			if (res?.data) {
				toast('Checkout criado', {
					description: res?.message || 'Checkout criado com sucesso!',
					variant: 'success',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				});
				onSuccess(res.data.id);
			}

			return { error: null };
		},
		{ error: null }
	);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-sm">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={ShoppingCart01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Novo Checkout</Modal.Heading>
						<p className="text-sm text-muted">Crie um novo link de pagamento para sua organização</p>
					</Modal.Header>
					<form action={formAction}>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<TextField variant="secondary" aria-label="Nome do checkout" name="name" isRequired>
									<Label>Nome do checkout</Label>
									<Input variant="secondary" placeholder="Ex: Loja Principal, Evento X..." autoFocus />
								</TextField>

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
							<AsyncButton type="submit" variant="primary" isPending={isPending}>
								<Icon icon={ShoppingCart01Icon} className="icon-sm" />
								Criar Checkout
							</AsyncButton>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

