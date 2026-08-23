'use client';

import { useMemo, useState } from 'react';
import { Button, Description, InputGroup, Label, Modal, Switch, TextField } from '@heroui/react';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import { IntegrationPlatformInfo } from './components/integration-platform-info';
import type { MerchantIntegrationListItem } from '@/types/merchant/integrations';

function getInputType(fieldType: MerchantIntegrationListItem['configFields'][number]['type']): string {
	switch (fieldType) {
		case 'Password':
			return 'text';
		case 'Email':
			return 'email';
		case 'Number':
			return 'number';
		case 'Url':
			return 'url';
		case 'Text':
		default:
			return 'text';
	}
}

type NotificationState = {
	waitingPaymentEnabled: boolean;
	paidEnabled: boolean;
	refusedEnabled: boolean;
	refundedEnabled: boolean;
	chargedbackEnabled: boolean;
};

type ConfigureIntegrationInput = {
	enabled: boolean;
	configValues?: Record<string, string>;
	waitingPaymentEnabled: boolean;
	paidEnabled: boolean;
	refusedEnabled: boolean;
	refundedEnabled: boolean;
	chargedbackEnabled: boolean;
};

type NotificationItem = {
	key: keyof NotificationState;
	label: string;
	description: string;
};

function getNotificationItems(provider: MerchantIntegrationListItem['provider']): NotificationItem[] {
	if (provider === 'FacebookCapi') {
		return [
			{
				key: 'paidEnabled',
				label: 'Purchase',
				description: 'Disparada quando a compra é concluída com pagamento confirmado.',
			},
		];
	}

	return [
		{
			key: 'waitingPaymentEnabled',
			label: 'waiting_payment',
			description: 'Disparada quando a cobrança é criada e ainda aguarda pagamento.',
		},
		{
			key: 'paidEnabled',
			label: 'paid',
			description: 'Disparada quando o pagamento é confirmado com sucesso.',
		},
		{
			key: 'refusedEnabled',
			label: 'refused',
			description: 'Disparada quando a cobrança falha, é cancelada ou expira sem pagamento.',
		},
		{
			key: 'refundedEnabled',
			label: 'refunded',
			description: 'Disparada quando ocorre reembolso total ou parcial da cobrança.',
		},
		{
			key: 'chargedbackEnabled',
			label: 'chargedback',
			description: 'Disparada quando a cobrança entra em disputa ou chargeback.',
		},
	];
}

interface ConfigureIntegrationModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	integration: MerchantIntegrationListItem;
	isPending: boolean;
	onSubmit: (payload: ConfigureIntegrationInput) => Promise<string | null>;
	imageUrl: string;
	subtitle: string;
	websiteUrl?: string | null;
}

export function ConfigureIntegrationModal({
	isOpen,
	onOpenChange,
	integration,
	isPending,
	onSubmit,
	imageUrl,
	subtitle,
	websiteUrl,
}: ConfigureIntegrationModalProps) {
	const [configValues, setConfigValues] = useState<Record<string, string>>(integration.configValues ?? {});
	const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
	const [enabled, setEnabled] = useState(integration.isEnabled);
	const [notifications, setNotifications] = useState<NotificationState>({
		waitingPaymentEnabled: integration.waitingPaymentEnabled,
		paidEnabled: integration.paidEnabled,
		refusedEnabled: integration.refusedEnabled,
		refundedEnabled: integration.refundedEnabled,
		chargedbackEnabled: integration.chargedbackEnabled,
	});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const notificationItems = useMemo(() => getNotificationItems(integration.provider), [integration.provider]);

	function handleNotificationChange(key: keyof NotificationState, value: boolean) {
		setNotifications((prev) => ({ ...prev, [key]: value }));
	}

	function handleFieldChange(key: string, value: string) {
		setConfigValues((prev) => ({
			...prev,
			[key]: value,
		}));
	}

	function toggleFieldVisibility(key: string) {
		setVisibleSecrets((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}

	async function handleSaveConfiguration() {
		const sanitizedConfigValues = Object.entries(configValues).reduce<Record<string, string>>((acc, [key, value]) => {
			acc[key] = value.trim();
			return acc;
		}, {});

		const error = await onSubmit({
			enabled,
			configValues: sanitizedConfigValues,
			waitingPaymentEnabled: notifications.waitingPaymentEnabled,
			paidEnabled: notifications.paidEnabled,
			refusedEnabled: notifications.refusedEnabled,
			refundedEnabled: notifications.refundedEnabled,
			chargedbackEnabled: notifications.chargedbackEnabled,
		});

		if (error) {
			setErrorMessage(error);
			return;
		}

		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>Configurar {integration.name}</Modal.Heading>
						<IntegrationPlatformInfo
							name={integration.name}
							subtitle={subtitle}
							imageUrl={imageUrl}
							isActive={integration.isEnabled}
							websiteUrl={websiteUrl}
						/>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							<Switch isSelected={enabled} onChange={setEnabled}>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Switch.Content>Ativar integração</Switch.Content>
							</Switch>

								{integration.configFields.map((field) => {
									const isSecret = field.type === 'Password';
									const isVisible = visibleSecrets[field.key] === true;

									return (
										<TextField key={field.key} variant="secondary">
											<Label>{field.label}</Label>
											<InputGroup>
												<InputGroup.Input
													type={isSecret && !isVisible ? 'password' : getInputType(field.type)}
													placeholder={field.placeholder ?? undefined}
													value={configValues[field.key] ?? ''}
													autoComplete="off"
													onChange={(event) => handleFieldChange(field.key, event.target.value)}
												/>
												{isSecret ? (
													<InputGroup.Suffix>
														<Button
															isIconOnly
															size="sm"
															variant="ghost"
															onPress={() => toggleFieldVisibility(field.key)}
															aria-label={isVisible ? `Ocultar ${field.label}` : `Mostrar ${field.label}`}
														>
															<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
														</Button>
													</InputGroup.Suffix>
												) : null}
											</InputGroup>
											{field.description ? <Description>{field.description}</Description> : null}
										</TextField>
									);
								})}

							<div className="flex flex-col gap-3 rounded-lg border border-border p-3">
								<span className="text-sm font-medium text-foreground">Notificações</span>

								{notificationItems.map((item) => (
									<div key={item.key} className="flex items-start justify-between gap-3 rounded-md bg-card p-3">
										<div className="flex flex-col gap-1">
											<span className="text-sm font-medium text-foreground">{item.label}</span>
											<p className="text-xs text-muted">{item.description}</p>
										</div>
										<Switch
											isSelected={notifications[item.key]}
											onChange={(value) => handleNotificationChange(item.key, value)}
										>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch>
									</div>
								))}
							</div>

							{errorMessage && <span className="text-sm text-danger">{errorMessage}</span>}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton variant="primary" onPress={handleSaveConfiguration} isPending={isPending}>
							Salvar configuração
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
