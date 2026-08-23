'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Label, Input, TextField, FieldError } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { QrCodeIcon, Clock01Icon } from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { CheckoutSwitchSettingRow } from '../components/checkout-switch-setting-row';
import type { CheckoutData } from '@/types/merchant/checkouts';
import type { CheckoutOnboardingFormData } from '../schemas/checkout-upsert-form-schema';

interface PaymentsTabProps {
	checkout: CheckoutData;
	onSave: () => void;
	isSaving: boolean;
	onFormChange: (updates: Partial<CheckoutOnboardingFormData>) => void;
	onDraftChange?: (draft: {
		pixEnabled: boolean;
		hasPendingChanges: boolean;
	}) => void;
}

export function PaymentsTab({ checkout, onSave, isSaving, onFormChange, onDraftChange }: PaymentsTabProps) {
	const config = checkout.config;
	const { control } = useFormContext<CheckoutOnboardingFormData>();
	const formValues = useWatch({ control });

	const pixEnabled = formValues.pixEnabled ?? (config?.pixEnabled ?? true);
	const pixExpirationMinutes = formValues.pixExpirationMinutes ?? (config?.pixExpirationMinutes ?? 30);
	const reservationExpirationMinutes =
		formValues.reservationExpirationMinutes ?? (config?.reservationExpirationMinutes ?? 15);

	const hasChanges =
		pixEnabled !== (config?.pixEnabled ?? true) ||
		pixExpirationMinutes !== (config?.pixExpirationMinutes ?? 30) ||
		reservationExpirationMinutes !== (config?.reservationExpirationMinutes ?? 15);

	useEffect(() => {
		onDraftChange?.({
			pixEnabled,
			hasPendingChanges: hasChanges,
		});
	}, [pixEnabled, hasChanges, onDraftChange]);

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={onSave} isSaving={isSaving}>
				<SectionAccordion
					id="pix"
					defaultExpanded={false}
						icon={QrCodeIcon}
					title="PIX"
					summary={pixEnabled ? 'Ativo • Pagamento instantâneo via QR Code' : 'Inativo • Pagamento instantâneo via QR Code'}
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success/10"
					iconClassName="icon-md text-success"
					bodyClassName="p-4"
				>
					<div className="space-y-4">
							<CheckoutSwitchSettingRow
								title="PIX habilitado"
								isSelected={pixEnabled}
								onChange={(isSelected) => onFormChange({ pixEnabled: isSelected })}
							/>

								{pixEnabled && (
									<TextField variant="secondary" className="max-w-xs">
										<Label>Expiração do PIX (minutos)</Label>
										<NumericFormat
											customInput={Input}
											value={pixExpirationMinutes}
											onValueChange={(values) => onFormChange({ pixExpirationMinutes: values.floatValue ?? 30 })}
											allowNegative={false}
											decimalScale={0}
											placeholder="30"
										/>
										<FieldError />
										<span className="text-xs text-muted">Tempo máximo para o cliente efetuar o pagamento (1-60 min)</span>
									</TextField>
								)}
							</div>
				</SectionAccordion>


				<SectionAccordion
					id="reserva"
					defaultExpanded={false}
					icon={Clock01Icon}
					title="Reserva de Estoque"
					summary={`Expira em ${reservationExpirationMinutes} min`}
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning/10"
					iconClassName="icon-md text-warning"
					bodyClassName="p-4"
				>
					<div className="space-y-4">
								<TextField variant="secondary" className="max-w-xs">
									<Label>Tempo de reserva (minutos)</Label>
									<NumericFormat
										customInput={Input}
										value={reservationExpirationMinutes}
										onValueChange={(values) =>
											onFormChange({ reservationExpirationMinutes: values.floatValue ?? 15 })
										}
										allowNegative={false}
										decimalScale={0}
										placeholder="15"
									/>
									<FieldError />
									<span className="text-xs text-muted">
										Tempo que o carrinho do cliente permanece ativo antes de expirar. Produtos com estoque limitado
										terão a quantidade reservada durante este período. (1-60 min)
									</span>
								</TextField>
					</div>
				</SectionAccordion>

		</CheckoutTabSaveLayout>
	);
}

