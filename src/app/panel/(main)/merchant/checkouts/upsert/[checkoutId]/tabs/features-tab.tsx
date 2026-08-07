'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, Switch, Label, Input, TextField, NumberField, Chip, Button, Select, ListBox } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import {
	Coupon02Icon,
	CashIcon,
	DeliveryTruckIcon,
	Time04Icon,
	Tick01Icon,
	InformationCircleIcon,
	UserMultipleIcon,
	Add01Icon,
	Delete01Icon,
} from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import type { CheckoutData, SocialProofNotification } from '@/types/merchant/checkouts';
import type { CheckoutOnboardingFormData } from '../schemas/checkout-upsert-form-schema';

interface FeaturesTabProps {
	checkout: CheckoutData;
	onSave: () => void;
	isSaving: boolean;
	onFormChange: (updates: Partial<CheckoutOnboardingFormData>) => void;
	isOnboarding?: boolean;
	onDraftChange?: (draft: {
		couponEnabled: boolean;
		showTimer: boolean;
		timerMinutes: number;
		hasPendingChanges: boolean;
	}) => void;
}

interface FormData {
	couponEnabled: boolean;
	shippingEnabled: boolean;
	fixedShippingAmount: number | null;
	showTimer: boolean;
	timerMinutes: number;
	timerText: string;
	timerExpiredText: string;
	socialProofEnabled: boolean;
	socialProofIntervalSeconds: number;
	socialProofDurationSeconds: number;
	socialProofPosition: 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';
	socialProofNotifications: SocialProofNotification[];
	minimumValue: number | null;
}

function normalizeSocialProofNotifications(
	notifications: Array<Partial<SocialProofNotification>> | undefined,
	fallbackNotifications: SocialProofNotification[] | undefined
): SocialProofNotification[] {
	const source = notifications ?? fallbackNotifications ?? [];

	return source.map((notification) => ({
		name: notification.name ?? '',
		location: notification.location ?? '',
		action: notification.action ?? '',
	}));
}

function _validateFeatures(data: FormData): string[] {
	const errors: string[] = [];

	if (data.shippingEnabled && data.fixedShippingAmount == null) {
		errors.push('Defina o valor do frete fixo ao habilitar frete.');
	}

	if (data.minimumValue != null && data.minimumValue < 1000) {
		errors.push('O valor mínimo do checkout deve ser R$ 10,00.');
	}

	if (data.showTimer) {
		if (data.timerMinutes < 1 || data.timerMinutes > 60) errors.push('Timer deve estar entre 1 e 60 minutos.');
		if (data.timerText.trim().length === 0) errors.push('Informe o texto do timer.');
		if (data.timerText.length > 200) errors.push('Texto do timer deve ter no maximo 200 caracteres.');
		if (data.timerExpiredText.length > 200) {
			errors.push('Texto de expiracao do timer deve ter no maximo 200 caracteres.');
		}
	}

	if (data.socialProofEnabled) {
		if (data.socialProofIntervalSeconds < 3 || data.socialProofIntervalSeconds > 60) {
			errors.push('Intervalo da prova social deve estar entre 3 e 60 segundos.');
		}
		if (data.socialProofDurationSeconds < 1 || data.socialProofDurationSeconds > 10) {
			errors.push('Duracao da prova social deve estar entre 1 e 10 segundos.');
		}
		if (data.socialProofNotifications.length === 0) {
			errors.push('Adicione ao menos uma notificacao de prova social.');
		}

		for (const notification of data.socialProofNotifications) {
			if (!notification.name.trim() || !notification.location.trim() || !notification.action.trim()) {
				errors.push('Preencha nome, localizacao e acao em todas as notificacoes de prova social.');
				break;
			}
		}
	}

	return [...new Set(errors)];
}

export function FeaturesTab({
	checkout,
	onSave,
	isSaving,
	onFormChange,
	isOnboarding: _isOnboarding = false,
	onDraftChange,
}: FeaturesTabProps) {
	const config = checkout.config;
	const template = checkout.template;
	const { control } = useFormContext<CheckoutOnboardingFormData>();
	const values = useWatch({ control });
	const socialProofNotifications = normalizeSocialProofNotifications(
		values.socialProofNotifications,
		config?.socialProofSettings?.notifications
	);

	const formData: FormData = {
		couponEnabled: values.couponEnabled ?? (config?.couponEnabled ?? false),
		shippingEnabled: values.shippingEnabled ?? (config?.shippingEnabled ?? false),
		fixedShippingAmount: values.fixedShippingAmount ?? (config?.fixedShippingAmount ?? null),
		showTimer: values.showTimer ?? (config?.showTimer ?? false),
		timerMinutes: values.timerMinutes ?? (config?.timerMinutes ?? 15),
		timerText: values.timerText ?? (config?.timerText ?? ''),
		timerExpiredText: values.timerExpiredText ?? (config?.timerExpiredText ?? ''),
		socialProofEnabled: values.socialProofEnabled ?? (config?.socialProofEnabled ?? false),
		minimumValue: values.minimumValue ?? (config?.minimumValue ?? null),
		socialProofIntervalSeconds: values.socialProofIntervalSeconds ?? (config?.socialProofSettings?.intervalSeconds ?? 8),
		socialProofDurationSeconds: values.socialProofDurationSeconds ?? (config?.socialProofSettings?.durationSeconds ?? 4),
		socialProofPosition: values.socialProofPosition ?? (config?.socialProofSettings?.position ?? 'BottomLeft'),
		socialProofNotifications,
	};

	const hasChanges = useMemo(
		() =>
			JSON.stringify(formData) !==
			JSON.stringify({
				couponEnabled: config?.couponEnabled ?? false,
				shippingEnabled: config?.shippingEnabled ?? false,
				fixedShippingAmount: config?.fixedShippingAmount ?? null,
				minimumValue: config?.minimumValue ?? null,
				showTimer: config?.showTimer ?? false,
				timerMinutes: config?.timerMinutes ?? 15,
				timerText: config?.timerText ?? '',
				timerExpiredText: config?.timerExpiredText ?? '',
				socialProofEnabled: config?.socialProofEnabled ?? false,
				socialProofIntervalSeconds: config?.socialProofSettings?.intervalSeconds ?? 8,
				socialProofDurationSeconds: config?.socialProofSettings?.durationSeconds ?? 4,
				socialProofPosition: config?.socialProofSettings?.position ?? 'BottomLeft',
				socialProofNotifications: config?.socialProofSettings?.notifications ?? [],
			}),
		[formData, config]
	);

	useEffect(() => {
		onDraftChange?.({
			couponEnabled: formData.couponEnabled,
			showTimer: formData.showTimer,
			minimumValue: formData.minimumValue,
			timerMinutes: formData.timerMinutes,
			hasPendingChanges: hasChanges,
		});
	}, [formData.couponEnabled, formData.showTimer, formData.timerMinutes, hasChanges, onDraftChange]);

	function updateFormData(updates: Partial<FormData>) {
		onFormChange(updates);
	}

	const hasAnyFeature = template?.supportsCoupons || template?.supportsShipping || template?.supportsTimer || template?.supportsSocialProof;
	const featureSectionsCount = [
		template?.supportsCoupons,
		template?.supportsShipping,
		template?.supportsTimer,
		template?.supportsSocialProof,
	].filter(Boolean).length;
	const shouldStartClosed = featureSectionsCount >= 2;

	if (!template) {
		return (
			<Card className="border-warning bg-warning/5">
				<Card.Content className="py-6">
					<div className="flex flex-col items-center gap-3 text-center">
						<Icon icon={InformationCircleIcon} className="icon-lg text-warning" />
						<div>
							<p className="font-medium">Nenhum template selecionado</p>
							<p className="text-sm text-muted">Selecione um template na aba &quot;Templates&quot; para configurar as funcionalidades.</p>
						</div>
					</div>
				</Card.Content>
			</Card>
		);
	}

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={onSave} isSaving={isSaving}>
				{template.supportsCoupons && (
					<SectionAccordion
						id="coupons"
						defaultExpanded={!shouldStartClosed}
						icon={Coupon02Icon}
						title="Cupons de Desconto"
						summary={formData.couponEnabled ? 'Ativo • Cliente pode aplicar cupons' : 'Inativo • Cliente não pode aplicar cupons'}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
									<div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
										<div className="flex flex-col">
											<Label className="text-sm">Habilitar cupons</Label>
											<span className="text-xs text-muted">Status: {formData.couponEnabled ? 'Ativo' : 'Inativo'}</span>
										</div>
										<Switch
											isSelected={formData.couponEnabled}
											onChange={(checked) => updateFormData({ couponEnabled: checked })}
										>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch>
									</div>
									{formData.couponEnabled ? (
										<div className="flex flex-col gap-3">
											<div className="flex items-center gap-2">
												<Chip variant="soft" color="success" size="sm">
													<Icon icon={Tick01Icon} className="icon-xs" />
													Habilitado
												</Chip>
											</div>
											<p className="text-sm text-muted">
												Os clientes poderão aplicar cupons de desconto no checkout. Gerencie os cupons na aba
												&quot;Cupons&quot;.
											</p>
										</div>
									) : (
										<p className="text-sm text-muted">
											Quando habilitado, os clientes poderão aplicar cupons de desconto durante o pagamento.
										</p>
									)}
						</div>
					</SectionAccordion>
				)}

				{template.supportsShipping && (
					<SectionAccordion
						id="shipping"
						defaultExpanded={!shouldStartClosed}
						icon={DeliveryTruckIcon}
						title="Cálculo de Frete"
						summary={formData.shippingEnabled ? 'Ativo • Frete habilitado no checkout' : 'Inativo • Frete desabilitado no checkout'}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
									<div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
										<div className="flex flex-col">
											<Label className="text-sm">Habilitar frete</Label>
											<span className="text-xs text-muted">Status: {formData.shippingEnabled ? 'Ativo' : 'Inativo'}</span>
										</div>
										<Switch
											isSelected={formData.shippingEnabled}
											onChange={(checked) => updateFormData({ shippingEnabled: checked })}
										>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch>
									</div>
									{formData.shippingEnabled ? (
										<div className="flex flex-col gap-4">
											<div className="flex items-center gap-2">
												<Chip variant="soft" color="success" size="sm">
													<Icon icon={Tick01Icon} className="icon-xs" />
													Habilitado
												</Chip>
											</div>
											<p className="text-sm text-muted">
												Configure o valor do frete fixo abaixo.
											</p>
											<NumberField variant="secondary"
												value={formData.fixedShippingAmount ? formData.fixedShippingAmount / 100 : undefined}
												onChange={(value) => updateFormData({ fixedShippingAmount: value ? Math.round(value * 100) : null })}
												minValue={0}
												formatOptions={{ style: 'currency', currency: 'BRL' }}
											>
												<Label>Valor do Frete Fixo</Label>
												<Input variant="secondary" placeholder="R$ 0,00" />
											</NumberField>
											<div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
												<p className="text-sm text-warning">
													<Icon icon={InformationCircleIcon} className="mr-1 inline-block icon-sm" />
													O cálculo de frete automático por CEP está temporariamente desabilitado. Configure um valor fixo de frete.
												</p>
											</div>
										</div>
									) : (
										<p className="text-sm text-muted">
											Quando habilitado, o frete será calculado ou você pode definir um valor fixo.
										</p>
									)}
						</div>
					</SectionAccordion>
				)}

				{template.supportsMinimumValue && (
					<SectionAccordion
						id="minimum-value"
						defaultExpanded={!shouldStartClosed}
						icon={CashIcon}
						title="Valor Mínimo do Checkout"
						summary={formData.minimumValue != null ? `Ativo • R$ ${(formData.minimumValue / 100).toFixed(2)}` : 'Inativo • Sem valor mínimo'}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
							<div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
								<div className="flex flex-col">
									<Label className="text-sm">Habilitar valor mínimo</Label>
									<span className="text-xs text-muted">Status: {formData.minimumValue != null ? 'Ativo' : 'Inativo'}</span>
								</div>
								<Switch
									isSelected={formData.minimumValue != null}
									onChange={(checked) => updateFormData({ minimumValue: checked ? (formData.minimumValue ?? 1000) : null })}
								>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>
							{formData.minimumValue != null && (
								<div className="flex flex-col gap-4">
									<NumberField variant="secondary"
										value={formData.minimumValue ? formData.minimumValue / 100 : undefined}
										onChange={(value) => updateFormData({ minimumValue: value ? Math.round(value * 100) : null })}
										minValue={10}
										formatOptions={{ style: 'currency', currency: 'BRL' }}
									>
										<Label>Valor Mínimo</Label>
										<Input variant="secondary" placeholder="R$ 10,00" />
										<span className="text-xs text-muted">Mínimo R$ 10,00</span>
									</NumberField>
								</div>
							)}
						</div>
					</SectionAccordion>
				)}

				{template.supportsTimer && (
					<SectionAccordion
						id="timer"
						defaultExpanded={!shouldStartClosed}
						icon={Time04Icon}
						title="Timer de Urgência"
						summary={formData.showTimer ? `Ativo • ${formData.timerMinutes} min` : 'Inativo • Sem contador regressivo'}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
									<div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
										<div className="flex flex-col">
											<Label className="text-sm">Habilitar timer</Label>
											<span className="text-xs text-muted">Status: {formData.showTimer ? 'Ativo' : 'Inativo'}</span>
										</div>
										<Switch
											isSelected={formData.showTimer}
											onChange={(checked) => updateFormData({ showTimer: checked })}
										>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch>
									</div>
									{formData.showTimer ? (
										<>
											<div className="flex items-center gap-2">
												<Chip variant="soft" color="success" size="sm">
													<Icon icon={Tick01Icon} className="icon-xs" />
													Habilitado
												</Chip>
											</div>
											<p className="text-sm text-muted">
												Um contador regressivo será exibido para criar senso de urgência no cliente.
											</p>
											<NumberField variant="secondary"
												value={formData.timerMinutes}
												onChange={(value) => updateFormData({ timerMinutes: value })}
												minValue={1}
												maxValue={60}
											>
												<Label>Tempo Inicial (minutos)</Label>
												<Input variant="secondary" placeholder="15" />
												<span className="text-xs text-muted">Entre 1 e 60 minutos</span>
											</NumberField>

											<TextField variant="secondary"
												value={formData.timerText}
												onChange={(value) => updateFormData({ timerText: value })}
												maxLength={200}
											>
												<Label>Texto do Timer</Label>
												<Input variant="secondary" placeholder="Oferta expira em" />
												<span className="text-xs text-muted">Texto exibido junto ao contador (máx. 200 caracteres)</span>
											</TextField>

											<TextField variant="secondary"
												value={formData.timerExpiredText}
												onChange={(value) => updateFormData({ timerExpiredText: value })}
												maxLength={200}
											>
												<Label>Texto ao Expirar</Label>
												<Input variant="secondary" placeholder="Oferta expirada!" />
												<span className="text-xs text-muted">Texto exibido após o timer expirar (máx. 200 caracteres)</span>
											</TextField>
										</>
									) : (
										<p className="text-sm text-muted">
											Quando habilitado, um contador regressivo será exibido para criar senso de urgência.
										</p>
									)}
						</div>
					</SectionAccordion>
				)}

				{template.supportsSocialProof && (
					<SectionAccordion
						id="social-proof"
						defaultExpanded={!shouldStartClosed}
						icon={UserMultipleIcon}
						title="Prova Social"
						summary={
							formData.socialProofEnabled
								? `Ativo • ${formData.socialProofNotifications.length} notificações`
								: 'Inativo • Notificações de prova social desabilitadas'
						}
					>
						<div className="space-y-4">
									<div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
										<div className="flex flex-col">
											<Label className="text-sm">Habilitar prova social</Label>
											<span className="text-xs text-muted">Status: {formData.socialProofEnabled ? 'Ativo' : 'Inativo'}</span>
										</div>
										<Switch
											isSelected={formData.socialProofEnabled}
											onChange={(checked) => updateFormData({ socialProofEnabled: checked })}
										>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch>
									</div>
									{formData.socialProofEnabled ? (
										<>
											<div className="flex items-center gap-2">
												<Chip variant="soft" color="success" size="sm">
													<Icon icon={Tick01Icon} className="icon-xs" />
													Habilitado
												</Chip>
											</div>
											<p className="text-sm text-muted">
												Notificações de atividade recente serão exibidas para aumentar a confiança do cliente.
											</p>
											<div className="grid grid-cols-2 gap-4">
												<NumberField variant="secondary"
													value={formData.socialProofIntervalSeconds}
													onChange={(value) => updateFormData({ socialProofIntervalSeconds: value })}
													minValue={3}
													maxValue={60}
												>
													<Label>Intervalo (segundos)</Label>
													<Input variant="secondary" placeholder="8" />
													<span className="text-xs text-muted">Entre 3 e 60 segundos</span>
												</NumberField>
												<NumberField variant="secondary"
													value={formData.socialProofDurationSeconds}
													onChange={(value) => updateFormData({ socialProofDurationSeconds: value })}
													minValue={1}
													maxValue={10}
												>
													<Label>Duração (segundos)</Label>
													<Input variant="secondary" placeholder="4" />
													<span className="text-xs text-muted">Entre 1 e 10 segundos</span>
												</NumberField>
											</div>
											<Select
												variant="secondary"
												value={formData.socialProofPosition}
												onChange={(key) =>
													updateFormData({
														socialProofPosition: key as 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight',
													})
												}
											>
												<Label>Posição na Tela</Label>
												<Select.Trigger>
													<Select.Value />
												</Select.Trigger>
												<Select.Popover>
													<ListBox>
														<ListBox.Item id="TopLeft">Superior Esquerdo</ListBox.Item>
														<ListBox.Item id="TopRight">Superior Direito</ListBox.Item>
														<ListBox.Item id="BottomLeft">Inferior Esquerdo</ListBox.Item>
														<ListBox.Item id="BottomRight">Inferior Direito</ListBox.Item>
													</ListBox>
												</Select.Popover>
											</Select>
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<Label className="text-sm font-medium">Notificações</Label>
													<Button
														variant="tertiary"
														size="sm"
														onPress={() => {
															const updated = [
																...formData.socialProofNotifications,
																{ name: '', location: '', action: 'acabou de comprar' },
															];
															updateFormData({ socialProofNotifications: updated });
														}}
													>
														<Icon icon={Add01Icon} className="icon-sm" />
														Adicionar
													</Button>
												</div>
												{formData.socialProofNotifications.length === 0 ? (
													<p className="text-sm text-muted">Nenhuma notificação configurada. Adicione mensagens para exibir.</p>
												) : (
													<div className="flex flex-col gap-3">
														{formData.socialProofNotifications.map((notif, index) => (
															<div key={index} className="flex items-end gap-2 rounded-lg border p-3">
																<div className="grid flex-1 grid-cols-3 gap-2">
																	<TextField variant="secondary"
																		value={notif.name}
																		onChange={(value) => {
																			const updated = [...formData.socialProofNotifications];
																			updated[index] = { name: value, location: notif.location, action: notif.action };
																			updateFormData({ socialProofNotifications: updated });
																		}}
																	>
																		<Label className="text-xs">Nome</Label>
																		<Input variant="secondary" placeholder="Maria S." />
																	</TextField>
																	<TextField variant="secondary"
																		value={notif.location}
																		onChange={(value) => {
																			const updated = [...formData.socialProofNotifications];
																			updated[index] = { name: notif.name, location: value, action: notif.action };
																			updateFormData({ socialProofNotifications: updated });
																		}}
																	>
																		<Label className="text-xs">Localização</Label>
																		<Input variant="secondary" placeholder="São Paulo, SP" />
																	</TextField>
																	<TextField variant="secondary"
																		value={notif.action}
																		onChange={(value) => {
																			const updated = [...formData.socialProofNotifications];
																			updated[index] = { name: notif.name, location: notif.location, action: value };
																			updateFormData({ socialProofNotifications: updated });
																		}}
																	>
																		<Label className="text-xs">Ação</Label>
																		<Input variant="secondary" placeholder="acabou de comprar" />
																	</TextField>
																</div>
																<Button
																	isIconOnly
																	variant="tertiary"
																	size="sm"
																	className="text-danger"
																	onPress={() => {
																		const updated = formData.socialProofNotifications.filter((_, i) => i !== index);
																		updateFormData({ socialProofNotifications: updated });
																	}}
																>
																	<Icon icon={Delete01Icon} className="icon-sm" />
																</Button>
															</div>
														))}
													</div>
												)}
											</div>
										</>
									) : (
										<p className="text-sm text-muted">
											Quando habilitado, notificações de compras recentes serão exibidas para criar prova social.
										</p>
									)}
						</div>
					</SectionAccordion>
				)}

			{!hasAnyFeature && (
				<Card className="border-default bg-content1">
					<Card.Content className="py-6">
						<div className="flex flex-col items-center gap-3 text-center">
							<Icon icon={InformationCircleIcon} className="icon-lg text-muted" />
							<div>
								<p className="font-medium">Sem funcionalidades adicionais</p>
								<p className="text-sm text-muted">
									Este template não possui funcionalidades extras como cupons, frete ou timer.
								</p>
							</div>
						</div>
					</Card.Content>
				</Card>
			)}

		</CheckoutTabSaveLayout>
	);
}

