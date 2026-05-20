'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, TextField, Input, Label, FieldError } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowRight02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { createMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { Routes } from '@/router/routes';
import { toast } from '@heroui/react';
import type { PaymentEnvironment } from '@/types/enums';

interface FormState {
	errors: Record<string, string> | null;
}

interface NameStepProps {
	merchantId: string;
	environment: PaymentEnvironment;
}

export function NameStep({ merchantId, environment }: NameStepProps) {
	const router = useRouter();

	const [state, formAction, isPending] = useActionState(
		async (_prev: FormState, formData: FormData): Promise<FormState> => {
			const name = formData.get('name') as string;

			if (!name?.trim()) {
				return { errors: { name: 'Nome é obrigatório' } };
			}

			const res = await createMerchantCheckout(merchantId, {
				name: name.trim(),
				environment,
			});

			if (res?.error) {
				return { errors: { _form: res.error.message ?? 'Erro ao criar checkout' } };
			}

			if (res?.data?.id) {
				toast('Checkout criado', {
					description: 'O checkout foi criado com sucesso!',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				router.push(Routes.panel.merchant.checkoutsUpsert(res.data.id));
			}

			return { errors: null };
		},
		{ errors: null }
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold">Nome do checkout</h2>
				<p className="text-muted">
					Defina um nome claro para identificar este checkout no painel e continuar para as proximas etapas.
				</p>
			</div>

			<Form
				action={formAction}
				validationErrors={state.errors ?? undefined}
				className="flex flex-col gap-4 rounded-xl border border-divider bg-surface p-4"
			>
				<TextField variant="secondary" name="name" isRequired autoFocus>
					<Label>Nome do checkout</Label>
					<Input variant="secondary" placeholder="Ex: Checkout principal, Checkout campanha maio" />
					<FieldError />
				</TextField>

				{state.errors?._form && <p className="text-sm text-danger">{state.errors._form}</p>}

				<div className="flex justify-end">
					<AsyncButton type="submit" variant="primary" isPending={isPending}>
						Continuar
						<Icon icon={ArrowRight02Icon} className="icon-sm" />
					</AsyncButton>
				</div>
			</Form>
		</div>
	);
}
