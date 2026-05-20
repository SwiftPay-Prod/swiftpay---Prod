'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Input, Label, TextField, toast } from '@heroui/react';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { WhatsappIcon, TelegramIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { CheckoutSwitchSettingRow } from '../components/checkout-switch-setting-row';
import type { CheckoutData } from '@/types/merchant/checkouts';

interface ContactTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
	onDraftChange?: (draft: {
		contactWhatsAppEnabled: boolean;
		contactTelegramEnabled: boolean;
		contactEmailEnabled: boolean;
		hasPendingChanges: boolean;
	}) => void;
}

interface FormData {
	contactWhatsAppEnabled: boolean;
	contactWhatsAppNumber: string;
	contactTelegramEnabled: boolean;
	contactTelegramUsername: string;
	contactEmailEnabled: boolean;
	contactEmail: string;
}

function createInitialFormData(config: CheckoutData['config']): FormData {
	return {
		contactWhatsAppEnabled: config?.contactWhatsAppEnabled ?? false,
		contactWhatsAppNumber: config?.contactWhatsAppNumber ?? '',
		contactTelegramEnabled: config?.contactTelegramEnabled ?? false,
		contactTelegramUsername: config?.contactTelegramUsername ?? '',
		contactEmailEnabled: config?.contactEmailEnabled ?? false,
		contactEmail: config?.contactEmail ?? '',
	};
}

export function ContactTab({ checkout, merchantId, onRefresh, onDraftChange }: ContactTabProps) {
	const config = checkout.config;

	const [formData, setFormData] = useState<FormData>(() => createInitialFormData(config));
	const [isSaving, startTransition] = useTransition();

	function handleSave() {
		startTransition(async () => {
			try {
				const response = await updateMerchantCheckout(merchantId, checkout.id, {
					contactWhatsAppEnabled: formData.contactWhatsAppEnabled,
					contactWhatsAppNumber: formData.contactWhatsAppNumber,
					contactTelegramEnabled: formData.contactTelegramEnabled,
					contactTelegramUsername: formData.contactTelegramUsername,
					contactEmailEnabled: formData.contactEmailEnabled,
					contactEmail: formData.contactEmail,
				});

				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao salvar configurações de contato.');
					return;
				}

				toast.success('Configurações de contato salvas!');
				onRefresh();
			} catch {
				toast.danger('Erro ao salvar configurações de contato.');
			}
		});
	}

	const hasChanges = useMemo(
		() => JSON.stringify(formData) !== JSON.stringify(createInitialFormData(checkout.config)),
		[formData, checkout.config]
	);

	useEffect(() => {
		onDraftChange?.({
			contactWhatsAppEnabled: formData.contactWhatsAppEnabled,
			contactTelegramEnabled: formData.contactTelegramEnabled,
			contactEmailEnabled: formData.contactEmailEnabled,
			hasPendingChanges: hasChanges,
		});
	}, [
		formData.contactWhatsAppEnabled,
		formData.contactTelegramEnabled,
		formData.contactEmailEnabled,
		hasChanges,
		onDraftChange,
	]);

	function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={handleSave} isSaving={isSaving}>
				<SectionAccordion
					id="whatsapp"
					icon={WhatsappIcon}
					title="WhatsApp"
					summary={formData.contactWhatsAppEnabled ? 'Ativo • Botão de contato via WhatsApp' : 'Inativo • Botão de contato via WhatsApp'}
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-green-500/10"
					iconClassName="icon-md text-green-500"
					bodyClassName="p-4"
				>
					<div className="space-y-4">
							<CheckoutSwitchSettingRow
								title="Habilitar WhatsApp"
								isSelected={formData.contactWhatsAppEnabled}
								onChange={(checked) => updateField('contactWhatsAppEnabled', checked)}
							/>
								{formData.contactWhatsAppEnabled && (
									<TextField variant="secondary"
										value={formData.contactWhatsAppNumber}
										onChange={(value) => updateField('contactWhatsAppNumber', value)}
									>
										<Label>Número do WhatsApp</Label>
										<Input variant="secondary" placeholder="5511999999999" />
										<span className="text-xs text-muted">
											Formato internacional sem espaços ou símbolos (ex: 5511999999999)
										</span>
									</TextField>
								)}
					</div>
				</SectionAccordion>

				<SectionAccordion
					id="telegram"
					icon={TelegramIcon}
					title="Telegram"
					summary={formData.contactTelegramEnabled ? 'Ativo • Botão de contato via Telegram' : 'Inativo • Botão de contato via Telegram'}
					iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-blue-400/10"
					iconClassName="icon-md text-blue-400"
					bodyClassName="p-4"
				>
					<div className="space-y-4">
							<CheckoutSwitchSettingRow
								title="Habilitar Telegram"
								isSelected={formData.contactTelegramEnabled}
								onChange={(checked) => updateField('contactTelegramEnabled', checked)}
							/>
								{formData.contactTelegramEnabled && (
									<TextField variant="secondary"
										value={formData.contactTelegramUsername}
										onChange={(value) => updateField('contactTelegramUsername', value)}
									>
										<Label>Username do Telegram</Label>
										<Input variant="secondary" placeholder="seuusuario" />
										<span className="text-xs text-muted">Seu username sem o @ (ex: seuusuario)</span>
									</TextField>
								)}
					</div>
				</SectionAccordion>

				<SectionAccordion
					id="email"
					icon={Mail01Icon}
					title="E-mail"
					summary={formData.contactEmailEnabled ? 'Ativo • Botão de contato via E-mail' : 'Inativo • Botão de contato via E-mail'}
					bodyClassName="p-4"
				>
					<div className="space-y-4">
							<CheckoutSwitchSettingRow
								title="Habilitar E-mail"
								isSelected={formData.contactEmailEnabled}
								onChange={(checked) => updateField('contactEmailEnabled', checked)}
							/>
								{formData.contactEmailEnabled && (
									<TextField variant="secondary"
										value={formData.contactEmail}
										onChange={(value) => updateField('contactEmail', value)}
									>
										<Label>Endereço de E-mail</Label>
										<Input variant="secondary" type="email" placeholder="contato@suaempresa.com" />
										<span className="text-xs text-muted">E-mail para onde o cliente será direcionado</span>
									</TextField>
								)}
					</div>
				</SectionAccordion>

		</CheckoutTabSaveLayout>
	);
}

