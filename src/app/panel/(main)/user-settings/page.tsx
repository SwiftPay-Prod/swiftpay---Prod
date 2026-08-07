'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Card, Description, Label, Switch, Chip, Skeleton, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Alert01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	HelpCircleIcon,
	Notification01Icon,
	SecurityLockIcon,
	Settings05Icon,
	SmartPhone01Icon,
	VolumeHighIcon,
	VolumeOffIcon,
	Wallet01Icon,
	WalletAdd01Icon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { usePublicConfig } from '@/contexts/public-config-context';
import { AsyncButton } from '@/components/ui/async-button';
import { getNotificationPreferences, updateNotificationPreferences } from '@/app/actions/user';
import { toast } from '@heroui/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import type { NotificationPreferencesData } from '@/types/user';
import { resolvePushNotificationsDocsUrl } from '@/constants/useful-links';

function PreferencesSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<Skeleton className="h-8 w-full rounded-lg" />
			<Skeleton className="h-8 w-full rounded-lg" />
			<Skeleton className="h-8 w-full rounded-lg" />
		</div>
	);
}

interface PreferenceToggleProps {
	label: string;
	isSelected: boolean;
	isPending: boolean;
	onChange: (value: boolean) => void;
}

function PreferenceToggle({ label, isSelected, isPending, onChange }: PreferenceToggleProps) {
	return (
		<div className="flex items-center justify-between gap-2 py-1">
			<Label className="text-sm">{label}</Label>
			<Switch size="sm" isSelected={isSelected} onChange={onChange} isDisabled={isPending}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch>
		</div>
	);
}

export default function UserSettingsPage() {
	const { isSoundEnabled, toggleSound } = useNotificationSound();
	const [isPending, startTransition] = useTransition();
	const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
	const [preferences, setPreferences] = useState<NotificationPreferencesData | null>(null);
	const isEnabled = false;
	const isLoading = false;
	const permission = 'default';
	const isIOSBrowser = false;
	const isIOSPWA = false;
	const lastError = null;
	const enablePushNotifications = async () => false;
	const disablePushNotifications = async () => {};
	const { docsUrl } = usePublicConfig();
	const pushNotificationsDocsUrl = resolvePushNotificationsDocsUrl(docsUrl);

	const allPreferencesState = useMemo(() => {
		if (!preferences) return 'none';
		const keys = Object.keys(preferences).filter((k) => k.startsWith('notify')) as (keyof NotificationPreferencesData)[];
		const allTrue = keys.every((k) => preferences[k] === true);
		const allFalse = keys.every((k) => preferences[k] === false);
		if (allTrue) return 'all';
		if (allFalse) return 'none';
		return 'partial';
	}, [preferences]);

	useEffect(() => {
		async function loadPreferences() {
			const response = await getNotificationPreferences();
			if (response?.data) {
				setPreferences(response.data);
			}
			setIsLoadingPreferences(false);
		}
		loadPreferences();
	}, []);

	function handlePreferenceChange(key: keyof NotificationPreferencesData, value: boolean) {
		if (!preferences) return;

		const newPreferences = { ...preferences, [key]: value };
		setPreferences(newPreferences);

		startTransition(async () => {
			const response = await updateNotificationPreferences({ [key]: value });
			if (response?.error) {
				setPreferences(preferences);
				toast('Erro ao atualizar preferência', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			}
		});
	}

	function handleToggleAll(value: boolean) {
		if (!preferences) return;

		const keys = Object.keys(preferences).filter((k) => k.startsWith('notify')) as (keyof NotificationPreferencesData)[];
		const updates: Partial<NotificationPreferencesData> = {};
		keys.forEach((k) => {
			updates[k] = value;
		});

		const newPreferences = { ...preferences, ...updates };
		setPreferences(newPreferences);

		startTransition(async () => {
			const response = await updateNotificationPreferences(updates);
			if (response?.error) {
				setPreferences(preferences);
				toast('Erro ao atualizar preferências', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast(value ? 'Notificações ativadas' : 'Notificações desativadas', {
					description: value ? 'Todas as notificações foram ativadas.' : 'Todas as notificações foram desativadas.',
					indicator: <Icon icon={Notification03Icon} className="icon-sm" />,
					variant: 'success',
				});
			}
		});
	}

	async function handleTogglePush() {
		if (isEnabled) {
			await disablePushNotifications();
		} else {
			await enablePushNotifications();
		}
	}

	function getPushStatusMessage(): string {
		if (isIOSBrowser) {
			return 'Para ativar notificações push no iOS, instale o app como PWA na tela inicial.';
		}
		if (!isSupported) {
			return 'Seu navegador não suporta notificações push. Tente usar Chrome, Edge ou Safari.';
		}
		if (permission === 'denied') {
			return 'Notificações foram bloqueadas. Acesse as configurações do navegador para permitir.';
		}
		if (isEnabled) {
			return 'Você receberá notificações push sobre pagamentos e atualizações importantes.';
		}
		return 'Ative para receber notificações mesmo quando não estiver usando o SwiftPay.';
	}

	function getPushErrorMessage(): string | null {
		if (!lastError) return null;
		
		// Mapear erros comuns para mensagens mais claras
		if (lastError.includes('permission') || lastError.includes('denied')) {
			return 'Permissão negada. Vá em Configurações do navegador > Notificações e permita o SwiftPay.';
		}
		if (lastError.includes('token') || lastError.includes('messaging')) {
			return 'Erro ao obter token de notificação. Recarregue a página e tente novamente.';
		}
		if (lastError.includes('network') || lastError.includes('fetch')) {
			return 'Erro de conexão. Verifique sua internet e tente novamente.';
		}
		if (lastError.includes('service-worker') || lastError.includes('sw')) {
			return 'Service Worker não disponível. Certifique-se de usar HTTPS e recarregue a página.';
		}
		if (lastError.includes('unsupported') || lastError.includes('supported')) {
			return 'Seu navegador não suporta notificações push. Use Chrome, Edge ou Safari.';
		}
		
		return lastError;
	}

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Settings05Icon} size={24} />}
				title="Ajustes"
				description="Gerencie suas preferências pessoais."
			/>

			<Card>
				<Card.Header>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Card.Title>Notificações</Card.Title>
							<Link
								href={pushNotificationsDocsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted hover:text-accent transition-colors"
								title="Ver tutorial de notificações push"
							>
								<Icon icon={HelpCircleIcon} className="icon-sm" />
							</Link>
						</div>
						<Description>Configure as preferências de notificação</Description>
					</div>
				</Card.Header>
				<Card.Content className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-start gap-3">
							<div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isEnabled ? 'bg-green/10' : 'bg-accent/10'}`}>
								<Icon icon={SmartPhone01Icon} className={`icon-md ${isEnabled ? 'text-green' : 'text-accent'}`} />
							</div>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<Label className="text-sm font-medium">Notificações Push</Label>
									{isIOSPWA && (
										<Chip size="sm" variant="soft" color="success">
											<Icon icon={SmartPhone01Icon} className="icon-xs" />
											iOS PWA
										</Chip>
									)}
									{isEnabled && (
										<Chip size="sm" variant="soft" color="success">
											Ativo
										</Chip>
									)}
								</div>
								<Description className="text-sm">{getPushStatusMessage()}</Description>
							</div>
						</div>
						{isSupported && permission !== 'denied' && (
							<AsyncButton
								variant={isEnabled ? 'tertiary' : 'primary'}
								size="sm"
								isPending={isLoading}
								onPress={handleTogglePush}
							>
								{isEnabled ? 'Desativar' : 'Ativar'}
							</AsyncButton>
						)}
					</div>
					
					{lastError && (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 text-danger">
							<Icon icon={Alert01Icon} className="icon-sm shrink-0 mt-0.5" />
							<div className="flex flex-col gap-1">
								<span className="text-sm font-medium">Erro ao ativar notificações</span>
								<span className="text-xs opacity-80">{getPushErrorMessage()}</span>
								<Link
									href={pushNotificationsDocsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs underline hover:no-underline"
								>
									Ver tutorial de como ativar notificações
								</Link>
							</div>
						</div>
					)}

					{permission === 'denied' && !lastError && (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning">
							<Icon icon={CancelCircleIcon} className="icon-sm shrink-0 mt-0.5" />
							<div className="flex flex-col gap-1">
								<span className="text-sm font-medium">Notificações bloqueadas</span>
								<span className="text-xs opacity-80">
									Clique no ícone de cadeado na barra de endereço e permita notificações, ou acesse as configurações do navegador.
								</span>
								<Link
									href={pushNotificationsDocsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs underline hover:no-underline"
								>
									Ver tutorial de como desbloquear
								</Link>
							</div>
						</div>
					)}

					{isIOSBrowser && !isIOSPWA && (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 text-accent">
							<Icon icon={SmartPhone01Icon} className="icon-sm shrink-0 mt-0.5" />
							<div className="flex flex-col gap-1">
								<span className="text-sm font-medium">Instalar como aplicativo</span>
								<span className="text-xs opacity-80">
									Para usar notificações no iOS, instale o SwiftPay como aplicativo: toque em Compartilhar → &quot;Adicionar à Tela de Início&quot;.
								</span>
								<Link
									href={pushNotificationsDocsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs underline hover:no-underline"
								>
									Ver tutorial completo
								</Link>
							</div>
						</div>
					)}

					<div className="border-t border-divider pt-4">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-start gap-3">
								<div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isSoundEnabled ? 'bg-accent/10' : 'bg-danger/10'}`}>
									<Icon icon={isSoundEnabled ? VolumeHighIcon : VolumeOffIcon} className={`icon-md ${isSoundEnabled ? 'text-accent' : 'text-danger'}`} />
								</div>
								<div className="flex flex-col gap-1">
									<Label className="text-sm font-medium">Som de Notificação</Label>
									<Description className="text-sm">
										Reproduzir som ao receber novas notificações de pagamento
									</Description>
								</div>
							</div>
							<Switch isSelected={isSoundEnabled} onChange={toggleSound}>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</div>
					</div>
				</Card.Content>
			</Card>

			<Card>
				<Card.Header>
					<div className="flex flex-col md:flex-row md:items-center justify-between items-start w-full gap-2">
						<div className="flex flex-col gap-1">
							<Card.Title>Preferências de Notificação</Card.Title>
							<Description>Escolha quais tipos de notificação você deseja receber</Description>
						</div>
						{preferences && !isLoadingPreferences && (
							<div className="flex items-center gap-2">
								<Button
									variant="primary"
									size="sm"
									isDisabled={isPending || allPreferencesState === 'all'}
									onPress={() => handleToggleAll(true)}
								>
										<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
									Ativar todas
								</Button>
								<Button
									variant="danger-soft"
									size="sm"
									isDisabled={isPending || allPreferencesState === 'none'}
									onPress={() => handleToggleAll(false)}
								>
										<Icon icon={CancelCircleIcon} className="icon-sm" />
									Desativar todas
								</Button>
							</div>
						)}
					</div>
				</Card.Header>
				<Card.Content className="flex flex-col gap-4">
					{isLoadingPreferences ? (
						<PreferencesSkeleton />
					) : preferences ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2 mb-1">
									<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
									<Label className="text-sm font-semibold">Pagamentos (PIX)</Label>
								</div>
								<div className="flex flex-col gap-0.5 pl-5">
									<PreferenceToggle
										label="Pendente"
										isSelected={preferences.notifyPaymentPending}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPaymentPending', v)}
									/>
									<PreferenceToggle
										label="Confirmado"
										isSelected={preferences.notifyPaymentCompleted}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPaymentCompleted', v)}
									/>
									<PreferenceToggle
										label="Expirado"
										isSelected={preferences.notifyPaymentExpired}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPaymentExpired', v)}
									/>
									<PreferenceToggle
										label="Falhou"
										isSelected={preferences.notifyPaymentFailed}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPaymentFailed', v)}
									/>
									<PreferenceToggle
										label="Estornado"
										isSelected={preferences.notifyPaymentRefunded}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPaymentRefunded', v)}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2 mb-1">
									<Icon icon={WalletAdd01Icon} className="icon-sm text-accent" />
									<Label className="text-sm font-semibold">Saques</Label>
								</div>
								<div className="flex flex-col gap-0.5 pl-5">
									<PreferenceToggle
										label="Pendente"
										isSelected={preferences.notifyPayoutPending}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutPending', v)}
									/>
									<PreferenceToggle
										label="Em processamento"
										isSelected={preferences.notifyPayoutProcessing}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutProcessing', v)}
									/>
									<PreferenceToggle
										label="Concluído"
										isSelected={preferences.notifyPayoutCompleted}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutCompleted', v)}
									/>
									<PreferenceToggle
										label="Falhou"
										isSelected={preferences.notifyPayoutFailed}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutFailed', v)}
									/>
									<PreferenceToggle
										label="Rejeitado"
										isSelected={preferences.notifyPayoutRejected}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutRejected', v)}
									/>
									<PreferenceToggle
										label="Cancelado"
										isSelected={preferences.notifyPayoutCancelled}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyPayoutCancelled', v)}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2 mb-1">
									<Icon icon={Notification01Icon} className="icon-sm text-accent" />
									<Label className="text-sm font-semibold">Tipos de Notificação</Label>
								</div>
								<div className="flex flex-col gap-0.5 pl-5">
									<PreferenceToggle
										label="Informações"
										isSelected={preferences.notifyInfo}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyInfo', v)}
									/>
									<PreferenceToggle
										label="Sucesso"
										isSelected={preferences.notifySuccess}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifySuccess', v)}
									/>
									<PreferenceToggle
										label="Alertas"
										isSelected={preferences.notifyWarning}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyWarning', v)}
									/>
									<PreferenceToggle
										label="Erros"
										isSelected={preferences.notifyError}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyError', v)}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2 mb-1">
									<Icon icon={SecurityLockIcon} className="icon-sm text-accent" />
									<Label className="text-sm font-semibold">Sistema e Segurança</Label>
								</div>
								<div className="flex flex-col gap-0.5 pl-5">
									<PreferenceToggle
										label="Segurança"
										isSelected={preferences.notifySecurity}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifySecurity', v)}
									/>
									<PreferenceToggle
										label="Sistema"
										isSelected={preferences.notifySystem}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifySystem', v)}
									/>
									<PreferenceToggle
										label="Chargebacks"
										isSelected={preferences.notifyChargeback}
										isPending={isPending}
										onChange={(v) => handlePreferenceChange('notifyChargeback', v)}
									/>
								</div>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center p-4 text-muted text-sm">
							Não foi possível carregar as preferências
						</div>
					)}
				</Card.Content>
			</Card>
		</div>
	);
}

