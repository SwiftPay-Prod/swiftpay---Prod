'use client';

import { useEffect, useTransition } from 'react';
import { Button, Input, Label, TextField, TextArea, FieldError, Form } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import type { MerchantData, UpdateMerchantRequest } from '@/types/merchant/crud';
import type { BillingFormData } from '@/types/merchant/onboarding';
import { merchantToBillingFormData } from '@/types/merchant/onboarding';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { AsyncButton } from '@/components/ui/async-button';
import { isValidURL } from '@/utils/validations';
import { formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';

interface BillingStepProps {
	merchant: MerchantData;
	onSaveFields: (data: Partial<UpdateMerchantRequest>, showToast?: boolean) => Promise<MerchantData | null>;
	onNext: () => void;
	onBack: () => void;
}

export function BillingStep({ merchant, onSaveFields, onNext, onBack }: BillingStepProps) {
	const { control, setValue, handleSubmit, trigger } = useForm<BillingFormData>({
		defaultValues: merchantToBillingFormData(merchant),
		mode: 'onChange',
	});

	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setValue(
			'monthlyRevenue',
			merchant.kyc?.monthlyRevenue != null ? merchant.kyc.monthlyRevenue / 100 : null,
			{ shouldDirty: false, shouldValidate: false }
		);
	}, [merchant.kyc?.monthlyRevenue, setValue]);

	useEffect(() => {
		setValue(
			'averageTicket',
			merchant.kyc?.averageTicket != null ? merchant.kyc.averageTicket / 100 : null,
			{ shouldDirty: false, shouldValidate: false }
		);
	}, [merchant.kyc?.averageTicket, setValue]);

	const debouncedSaveIfValid = useDebouncedCallback(
		async (field: keyof BillingFormData, value: string | number | null) => {
			const isValid = await trigger(field);
			if (!isValid) return;
			if (field === 'monthlyRevenue' || field === 'averageTicket') {
				const centsValue = typeof value === 'number' ? Math.round(value * 100) : null;
				onSaveFields({ [field]: centsValue });
			} else {
				onSaveFields({ [field]: value as string | null });
			}
		},
		350
	);

	function normalizeString(value: string | null | undefined): string | null {
		if (!value) return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	function handleFieldChange(field: keyof BillingFormData, value: string | number | null) {
		debouncedSaveIfValid(field, value);
	}

	function onSubmit(values: BillingFormData) {
		const payload: Partial<UpdateMerchantRequest> = {
			website: normalizeString(values.website),
			businessDescription: normalizeString(values.businessDescription),
			monthlyRevenue:
				typeof values.monthlyRevenue === 'number'
					? Math.round(values.monthlyRevenue * 100)
					: null,
			averageTicket:
				typeof values.averageTicket === 'number'
					? Math.round(values.averageTicket * 100)
					: null,
		};
		startTransition(async () => {
			const result = await onSaveFields(payload, false);
			if (result) {
				onNext();
			}
		});
	}

	return (
		<Form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
			<div>
				<h2 className="text-xl font-semibold text-foreground">Faturamento</h2>
				<p className="text-default-500 mt-1">Informe dados sobre a receita e volume de transações da sua organização.</p>
			</div>

			<div className="h-px bg-divider" />

			<div className="space-y-6">
				<div>
					<h3 className="text-medium font-medium text-foreground mb-4">Informações do Negócio</h3>
					<div className="grid grid-cols-1 gap-4">
						<Controller
							name="website"
							control={control}
							rules={{
								validate: (value) => {
									if (!value) return 'Website é obrigatório';
									if (!isValidURL(value)) return 'URL inválida (ex: https://exemplo.com.br)';
									return true;
								},
							}}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired name={field.name} isInvalid={!!fieldState.error}>
									<Label>Website</Label>
									<Input
										variant="secondary"
										placeholder="https://exemplo.com.br"
										value={field.value ?? ''}
										onChange={(e) => {
											field.onChange(e.target.value || null);
											handleFieldChange('website', e.target.value);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>

						<Controller
							name="businessDescription"
							control={control}
							rules={{ validate: (value) => (value ? true : 'Descrição do negócio é obrigatória') }}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired name={field.name} className="md:col-span-2" isInvalid={!!fieldState.error}>
									<Label>Descrição do Negócio</Label>
									<TextArea
										variant="secondary"
										placeholder="Descreva brevemente o que sua empresa faz..."
										rows={3}
										value={field.value ?? ''}
										onChange={(e) => {
											field.onChange(e.target.value || null);
											handleFieldChange('businessDescription', e.target.value);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>
					</div>
				</div>

				<div className="h-px bg-divider" />

				<div>
					<h3 className="text-medium font-medium text-foreground mb-4">Volumes Financeiros</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Controller
							name="monthlyRevenue"
							control={control}
							rules={{
								validate: (value) => {
									if (!value) return 'Faturamento mensal é obrigatório';
									if (value < 0) return 'Faturamento não pode ser negativo';
									return true;
								},
							}}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired name={field.name} isInvalid={!!fieldState.error}>
									<Label>Faturamento Mensal (R$)</Label>
									<CurrencyCentsInput
										initialValueInCents={field.value != null ? Math.round(field.value * 100) : undefined}
										variant="secondary"
										placeholder="R$ 0,00"
										onValueChange={(v) => {
											const cents = formattedCurrencyToCents(v);
											const floatVal = cents != null ? cents / 100 : null;
											field.onChange(floatVal);
											handleFieldChange('monthlyRevenue', floatVal);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>

						<Controller
							name="averageTicket"
							control={control}
							rules={{
								validate: (value) => {
									if (!value) return 'Ticket médio é obrigatório';
									if (value < 0) return 'Ticket médio não pode ser negativo';
									return true;
								},
							}}
							render={({ field, fieldState }) => (
								<TextField variant="secondary" isRequired name={field.name} isInvalid={!!fieldState.error}>
									<Label>Ticket Médio (R$)</Label>
									<CurrencyCentsInput
										initialValueInCents={field.value != null ? Math.round(field.value * 100) : undefined}
										variant="secondary"
										placeholder="R$ 0,00"
										onValueChange={(v) => {
											const cents = formattedCurrencyToCents(v);
											const floatVal = cents != null ? cents / 100 : null;
											field.onChange(floatVal);
											handleFieldChange('averageTicket', floatVal);
										}}
									/>
									<FieldError>{fieldState.error?.message}</FieldError>
								</TextField>
							)}
						/>
					</div>
				</div>
			</div>

			<div className="flex justify-between items-center pt-4">
				<Button variant="secondary" type="button" onPress={onBack}>
					Voltar
				</Button>
				<AsyncButton variant="primary" type="submit" isPending={isPending}>
					Próximo
				</AsyncButton>
			</div>
		</Form>
	);
}
