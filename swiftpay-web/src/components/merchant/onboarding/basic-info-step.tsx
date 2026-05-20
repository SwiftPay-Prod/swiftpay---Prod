'use client';

import { useTransition } from 'react';
import { Input, Label, TextField, FieldError, Form } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import type { MerchantData, UpdateMerchantRequest } from '@/types/merchant/crud';
import type { BasicInfoFormData } from '@/types/merchant/onboarding';
import { merchantToBasicInfoFormData } from '@/types/merchant/onboarding';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { AsyncButton } from '@/components/ui/async-button';
import { isValidEmail, isValidPhone } from '@/utils/validations';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';

interface BasicInfoStepProps {
	merchant: MerchantData;
	onSaveFields: (data: Partial<UpdateMerchantRequest>, showToast?: boolean) => Promise<MerchantData | null>;
	onNext: () => void;
}

export function BasicInfoStep({ merchant, onSaveFields, onNext }: BasicInfoStepProps) {
	const [isPending, startTransition] = useTransition();
	const { control, getValues, handleSubmit, trigger } = useForm<BasicInfoFormData>({
		defaultValues: merchantToBasicInfoFormData(merchant),
		mode: 'onChange',
	});

	const debouncedSaveIfValid = useDebouncedCallback(async (field: keyof BasicInfoFormData, value: string | null) => {
		const isValid = await trigger(field);
		if (isValid) {
			onSaveFields({ [field]: value });
		}
	}, 350);

	function normalizeString(value: string | null | undefined): string | null {
		if (!value) return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	function handleFieldChange(field: keyof BasicInfoFormData, value: string) {
		debouncedSaveIfValid(field, value || null);
	}

	const addressCountry = merchant.address?.country?.trim().toLowerCase();
	const defaultCountry = addressCountry && addressCountry.length === 2 ? addressCountry : 'br';

	function onSubmit() {
		startTransition(async () => {
			const values = getValues();
			const payload: BasicInfoFormData = {
				name: normalizeString(values.name),
				email: normalizeString(values.email),
				whatsApp: normalizeString(values.whatsApp),
			};
			const result = await onSaveFields(payload, false);
			if (result) {
				onNext();
			}
		});
	}

	return (
		<Form className="flex flex-col gap-6" autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
			<div>
				<h2 className="text-xl font-semibold text-foreground">Informações Básicas</h2>
				<p className="text-default-500 mt-1">Preencha as informações de contato da sua organização.</p>
			</div>

			<div className="h-px bg-divider" />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Controller
					name="name"
					control={control}
					rules={{
						validate: (value) => {
							if (!value || value.trim().length < 3) {
								return 'Nome deve ter pelo menos 3 caracteres';
							}
							return true;
						},
					}}
					render={({ field, fieldState }) => (
						<TextField variant="secondary" isRequired name={field.name} className="md:col-span-2" isInvalid={!!fieldState.error}>
							<Label>Nome da Organização</Label>
							<Input
								variant="secondary"
									placeholder="Ex: Minha Empresa Ltda"
									autoComplete="off"
									value={field.value ?? ''}
								onChange={(e) => {
									field.onChange(e.target.value || null);
									handleFieldChange('name', e.target.value);
								}}
							/>
							<FieldError>{fieldState.error?.message}</FieldError>
						</TextField>
					)}
				/>

				<Controller
					name="email"
					control={control}
					rules={{
						validate: (value) => {
							if (!value) return 'Email é obrigatório';
							if (!isValidEmail(value)) {
								return 'Informe um email válido';
							}
							return true;
						},
					}}
					render={({ field, fieldState }) => (
						<TextField variant="secondary" isRequired name={field.name} isInvalid={!!fieldState.error}>
							<Label>Email Comercial</Label>
							<Input
								variant="secondary"
								placeholder="contato@empresa.com"
									type="email"
									autoComplete="off"
									value={field.value ?? ''}
								onChange={(e) => {
									field.onChange(e.target.value || null);
									handleFieldChange('email', e.target.value);
								}}
							/>
							<FieldError>{fieldState.error?.message}</FieldError>
						</TextField>
					)}
				/>

				<Controller
					name="whatsApp"
					control={control}
					rules={{
						validate: (value) => {
							if (!value) return 'WhatsApp é obrigatório';
							if (!isValidPhone(value)) {
								return 'Informe um WhatsApp válido com o DDI do país';
							}
							return true;
						},
					}}
					render={({ field, fieldState }) => (
						<TextField variant="secondary" isRequired name={field.name} isInvalid={!!fieldState.error}>
							<Label>WhatsApp</Label>
							<InternationalPhoneInput
								name={field.name}
								value={field.value}
								defaultCountry={defaultCountry}
								isInvalid={!!fieldState.error}
								required
								placeholder="Ex: +55 99 91234-5678"
								onBlur={field.onBlur}
								onChange={(value) => {
									field.onChange(value);
									handleFieldChange('whatsApp', value ?? '');
								}}
							/>
							<FieldError>{fieldState.error?.message}</FieldError>
						</TextField>
					)}
				/>
			</div>

			<div className="flex justify-end items-center pt-4">
				<AsyncButton variant="primary" type="submit" isPending={isPending}>
					Próximo
				</AsyncButton>
			</div>
		</Form>
	);
}

