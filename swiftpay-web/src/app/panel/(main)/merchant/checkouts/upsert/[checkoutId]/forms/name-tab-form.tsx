'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError, Input, Label, TextField } from '@heroui/react';
import { ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { checkoutNameFormSchema, type CheckoutNameFormData } from '../schemas/checkout-upsert-form-schema';

interface NameTabFormProps {
	defaultName: string;
	isPending: boolean;
	onSubmitName: (name: string) => void;
}

export function NameTabForm({
	defaultName,
	isPending,
	onSubmitName,
}: NameTabFormProps) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CheckoutNameFormData>({
		resolver: zodResolver(checkoutNameFormSchema),
		defaultValues: {
			name: defaultName,
		},
		mode: 'onSubmit',
	});

	useEffect(() => {
		reset({ name: defaultName });
	}, [defaultName, reset]);

	const onSubmit = handleSubmit((values) => onSubmitName(values.name.trim()));

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<SectionAccordion
				id="checkout-name"
				icon={ShoppingCart01Icon}
				title="Nome do checkout"
				summary="Identificação interna do checkout"
				defaultExpanded
				bodyClassName="p-4"
			>
				<div className="flex flex-col gap-2">
					<TextField variant="secondary" isRequired>
						<Label>Nome do Checkout</Label>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Input
									variant="secondary"
									placeholder="Ex: Checkout Principal, Black Friday, etc."
									autoFocus
									value={field.value ?? ''}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									name={field.name}
								/>
							)}
						/>
						<FieldError>{errors.name?.message}</FieldError>
					</TextField>
					<p className="text-xs text-muted">
						Este nome é apenas para sua organização interna. Seus clientes não verão esse nome.
					</p>
				</div>
			</SectionAccordion>

			<button
				type="submit"
				className="hidden"
				disabled={isPending || isSubmitting}
				data-checkout-name-submit="true"
			/>
		</form>
	);
}