'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input, Label, TextField, FieldError } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { Link01Icon, CheckmarkCircle02Icon, Notification01Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import type { CheckoutData } from '@/types/merchant/checkouts';
import type { CheckoutOnboardingFormData } from '../schemas/checkout-upsert-form-schema';

interface UrlsTabProps {
	checkout: CheckoutData;
	onSave: () => void;
	isSaving: boolean;
	onFormChange: (updates: Partial<CheckoutOnboardingFormData>) => void;
	onDraftChange?: (draft: {
		successUrl: string;
		cancelUrl: string;
		callbackUrl: string;
		hasPendingChanges: boolean;
	}) => void;
}

function validateUrl(url: string): string | null {
	if (!url.trim()) return null;
	try {
		new URL(url);
		return null;
	} catch {
		return 'URL inválida';
	}
}

function _isFormValid(formData: Pick<CheckoutOnboardingFormData, 'successUrl' | 'cancelUrl' | 'callbackUrl'>): boolean {
	const errors = [
		validateUrl(formData.successUrl),
		validateUrl(formData.cancelUrl),
		validateUrl(formData.callbackUrl),
	].filter(Boolean);
	return errors.length === 0;
}

export function UrlsTab({ checkout, onSave, isSaving, onFormChange, onDraftChange }: UrlsTabProps) {
	const config = checkout.config;
	const { control } = useFormContext<CheckoutOnboardingFormData>();
	const formValues = useWatch({ control });

	const successUrl = formValues.successUrl ?? (config?.successUrl ?? '');
	const cancelUrl = formValues.cancelUrl ?? (config?.cancelUrl ?? '');
	const callbackUrl = formValues.callbackUrl ?? (config?.callbackUrl ?? '');

	const hasChanges =
		successUrl !== (config?.successUrl ?? '') ||
		cancelUrl !== (config?.cancelUrl ?? '') ||
		callbackUrl !== (config?.callbackUrl ?? '');

	useEffect(() => {
		onDraftChange?.({
			successUrl,
			cancelUrl,
			callbackUrl,
			hasPendingChanges: hasChanges,
		});
	}, [successUrl, cancelUrl, callbackUrl, hasChanges, onDraftChange]);

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={onSave} isSaving={isSaving}>
				<SectionAccordion
					id="urls"
					icon={Link01Icon}
					title="URLs de Redirecionamento"
					summary="Sucesso, cancelamento e callback (webhook)"
					bodyClassName="p-4"
				>
					<div className="space-y-4">
					<TextField variant="secondary"
						value={successUrl}
						onChange={(value) => onFormChange({ successUrl: value })}
						validate={() => validateUrl(successUrl)}
					>
						<div className="flex items-center gap-2">
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
							<Label>URL de Sucesso</Label>
						</div>
						<Input variant="secondary" placeholder="https://seusite.com/obrigado" />
						<FieldError />
						<span className="text-xs text-muted">Cliente será redirecionado após pagamento confirmado</span>
					</TextField>

					<TextField variant="secondary"
						value={cancelUrl}
						onChange={(value) => onFormChange({ cancelUrl: value })}
						validate={() => validateUrl(cancelUrl)}
					>
						<div className="flex items-center gap-2">
							<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
							<Label>URL de Cancelamento</Label>
						</div>
						<Input variant="secondary" placeholder="https://seusite.com/cancelado" />
						<FieldError />
						<span className="text-xs text-muted">Cliente será redirecionado se cancelar o pagamento</span>
					</TextField>

					<TextField variant="secondary"
						value={callbackUrl}
						onChange={(value) => onFormChange({ callbackUrl: value })}
						validate={() => validateUrl(callbackUrl)}
					>
						<div className="flex items-center gap-2">
							<Icon icon={Notification01Icon} className="icon-sm text-warning" />
							<Label>URL de Callback (Webhook)</Label>
						</div>
						<Input variant="secondary" placeholder="https://seusite.com/api/webhook" />
						<FieldError />
						<span className="text-xs text-muted">
							Receberá notificações sobre mudanças de status do pagamento
						</span>
					</TextField>
					</div>
				</SectionAccordion>

		</CheckoutTabSaveLayout>
	);
}

