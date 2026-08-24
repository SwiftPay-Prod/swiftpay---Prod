'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SectionAccordion } from '@/components/ui/system-accordion';
import {
	UserIcon,
	CallIcon,
	File01Icon,
	Location01Icon,
} from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { CheckoutSwitchSettingRow } from '../components/checkout-switch-setting-row';
import { CheckoutSectionPreview } from '../components/checkout-section-preview';
import type { CheckoutData } from '@/types/merchant/checkouts';
import type { CheckoutOnboardingFormData } from '../schemas/checkout-upsert-form-schema';

interface CustomerTabProps {
	checkout: CheckoutData;
	onSave: () => void;
	isSaving: boolean;
	onFormChange: (updates: Partial<CheckoutOnboardingFormData>) => void;
	onDraftChange?: (draft: {
		requireCustomerPhone: boolean;
		requireCustomerDocument: boolean;
		requireCustomerAddress: boolean;
		hasPendingChanges: boolean;
	}) => void;
}

export function CustomerTab({ checkout, onSave, isSaving, onFormChange, onDraftChange }: CustomerTabProps) {
	const config = checkout.config;
	const { control } = useFormContext<CheckoutOnboardingFormData>();
	const formValues = useWatch({ control });

	const requireCustomerPhone = formValues.requireCustomerPhone ?? (config?.requireCustomerPhone ?? false);
	const requireCustomerDocument = formValues.requireCustomerDocument ?? (config?.requireCustomerDocument ?? false);
	const requireCustomerAddress = formValues.requireCustomerAddress ?? (config?.requireCustomerAddress ?? false);

	const hasChanges =
		requireCustomerPhone !== (config?.requireCustomerPhone ?? false) ||
		requireCustomerDocument !== (config?.requireCustomerDocument ?? false) ||
		requireCustomerAddress !== (config?.requireCustomerAddress ?? false);

	useEffect(() => {
		onDraftChange?.({
			requireCustomerPhone,
			requireCustomerDocument,
			requireCustomerAddress,
			hasPendingChanges: hasChanges,
		});
	}, [
		requireCustomerPhone,
		requireCustomerDocument,
		requireCustomerAddress,
		hasChanges,
		onDraftChange,
	]);

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={onSave} isSaving={isSaving}>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-7">
					<SectionAccordion
						id="customer-data"
						icon={UserIcon}
						title="Dados do Cliente"
						summary={`Telefone ${requireCustomerPhone ? 'Ativo' : 'Inativo'} • Documento ${requireCustomerDocument ? 'Ativo' : 'Inativo'} • Endereço ${requireCustomerAddress ? 'Ativo' : 'Inativo'}`}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
							<div className="rounded-lg bg-accent-soft p-3">
								<p className="text-sm text-accent-soft-foreground">
									<strong>Nome</strong> e <strong>E-mail</strong> do cliente são sempre obrigatórios em todos os
									checkouts.
								</p>
							</div>

							<CheckoutSwitchSettingRow
								title="Exigir telefone"
								icon={CallIcon}
								isSelected={requireCustomerPhone}
								onChange={(isSelected) => onFormChange({ requireCustomerPhone: isSelected })}
							/>

							<CheckoutSwitchSettingRow
								title="Exigir CPF/CNPJ"
								icon={File01Icon}
								isSelected={requireCustomerDocument}
								onChange={(isSelected) => onFormChange({ requireCustomerDocument: isSelected })}
							/>

							<CheckoutSwitchSettingRow
								title="Exigir endereço"
								icon={Location01Icon}
								isSelected={requireCustomerAddress}
								onChange={(isSelected) => onFormChange({ requireCustomerAddress: isSelected })}
							/>
						</div>
					</SectionAccordion>
				</div>

				<div className="lg:col-span-5">
					<CheckoutSectionPreview
						title="Formulário do Cliente"
						description="Visualize como os campos de dados do cliente aparecem no checkout. Campos obrigatórios são marcados com asterisco."
						src="https://placehold.co/600x800?text=Preview+Dados+do+Cliente"
					/>
				</div>
			</div>
		</CheckoutTabSaveLayout>
	);
}

