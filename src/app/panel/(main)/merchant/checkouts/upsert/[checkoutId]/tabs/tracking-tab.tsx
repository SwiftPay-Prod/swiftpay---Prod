'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
	Switch,
	Label,
	Input,
	TextField,
	Chip,
	Checkbox,
	CheckboxGroup,
	Description,
	toast,
} from '@heroui/react';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import {
	Tick01Icon,
	InformationCircleIcon,
	AnalyticsUpIcon,
	Share01Icon,
	TiktokIcon,
	PinterestIcon,
	Settings01Icon,
	AiSearchIcon,
	HugeiconsIcon,
} from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import type {
	CheckoutData,
	TrackingSettings,
	CheckoutTrackingEvent,
	CheckoutTemplateData,
} from '@/types/merchant/checkouts';
import {
	TRACKING_EVENT_DESCRIPTIONS,
	DEFAULT_TRACKING_EVENTS,
	eventsArrayToSettings,
	settingsToEventsArray,
} from '@/types/merchant/checkouts';

type ProviderKey =
	| 'clarity'
	| 'facebookPixel'
	| 'googleTagManager'
	| 'tiktok'
	| 'kwai'
	| 'pinterest'
	| 'taboola'
	| 'utmify'
	| 'otimizey';

interface ProviderConfig {
	key: ProviderKey;
	name: string;
	description: string;
	icon: typeof HugeiconsIcon;
	supportKey: keyof CheckoutTemplateData;
	fields: ProviderField[];
	hasEvents: boolean;
	eventPlatformKey?: string;
}

interface ProviderField {
	key: string;
	label: string;
	placeholder: string;
	hint: string;
	type?: 'text' | 'password';
}

const PROVIDERS: ProviderConfig[] = [
	{
		key: 'clarity',
		name: 'Microsoft Clarity',
		description: 'Mapas de calor e gravação de sessões',
		icon: AiSearchIcon,
		supportKey: 'supportsClarity',
		hasEvents: false,
		fields: [
			{
				key: 'projectId',
				label: 'Project ID',
				placeholder: 'Seu Project ID do Clarity',
				hint: 'Encontre em clarity.microsoft.com → Settings → Overview',
			},
		],
	},
	{
		key: 'facebookPixel',
		name: 'Facebook Pixel',
		description: 'Trackeamento de conversões e CAPI',
		icon: Share01Icon,
		supportKey: 'supportsFacebookPixel',
		hasEvents: true,
		eventPlatformKey: 'facebookPixel',
		fields: [
			{
				key: 'pixelId',
				label: 'Pixel ID',
				placeholder: 'Seu Facebook Pixel ID',
				hint: 'Encontre em Events Manager → Data Sources → Pixel',
			},
			{
				key: 'accessToken',
				label: 'Access Token (CAPI)',
				placeholder: 'Seu Access Token para API de Conversões',
				hint: 'Opcional. Para envio server-side de eventos via Conversions API.',
				type: 'password',
			},
			{
				key: 'testEventCode',
				label: 'Test Event Code',
				placeholder: 'clearTimeout12345',
				hint: 'Opcional. Use para testar eventos no Events Manager.',
			},
		],
	},
	{
		key: 'googleTagManager',
		name: 'Google Tag Manager',
		description: 'Gerenciador de tags universal',
		icon: Settings01Icon,
		supportKey: 'supportsGoogleTagManager',
		hasEvents: true,
		eventPlatformKey: 'googleTagManager',
		fields: [
			{
				key: 'containerId',
				label: 'Container ID',
				placeholder: 'GTM-XXXXXXX',
				hint: 'Encontre em tagmanager.google.com → Container → ID',
			},
		],
	},
	{
		key: 'tiktok',
		name: 'TikTok Pixel',
		description: 'Trackeamento de conversões TikTok Ads',
		icon: TiktokIcon,
		supportKey: 'supportsTikTok',
		hasEvents: true,
		eventPlatformKey: 'tiktok',
		fields: [
			{
				key: 'pixelId',
				label: 'Pixel ID',
				placeholder: 'Seu TikTok Pixel ID',
				hint: 'Encontre em TikTok Ads Manager → Assets → Events',
			},
			{
				key: 'accessToken',
				label: 'Access Token (Events API)',
				placeholder: 'Seu Access Token',
				hint: 'Opcional. Para envio server-side de eventos.',
				type: 'password',
			},
		],
	},
	{
		key: 'kwai',
		name: 'Kwai Pixel',
		description: 'Trackeamento de conversões Kwai Ads',
		icon: AnalyticsUpIcon,
		supportKey: 'supportsKwai',
		hasEvents: true,
		eventPlatformKey: 'kwai',
		fields: [
			{
				key: 'pixelId',
				label: 'Pixel ID',
				placeholder: 'Seu Kwai Pixel ID',
				hint: 'Encontre no Kwai for Business → Gerenciamento de Eventos',
			},
		],
	},
	{
		key: 'pinterest',
		name: 'Pinterest Tag',
		description: 'Trackeamento de conversões Pinterest Ads',
		icon: PinterestIcon,
		supportKey: 'supportsPinterest',
		hasEvents: true,
		eventPlatformKey: 'pinterest',
		fields: [
			{
				key: 'tagId',
				label: 'Tag ID',
				placeholder: 'Seu Pinterest Tag ID',
				hint: 'Encontre em Pinterest Ads Manager → Conversions',
			},
		],
	},
	{
		key: 'taboola',
		name: 'Taboola Pixel',
		description: 'Trackeamento de conversões Taboola',
		icon: AnalyticsUpIcon,
		supportKey: 'supportsTaboola',
		hasEvents: true,
		eventPlatformKey: 'taboola',
		fields: [
			{
				key: 'accountId',
				label: 'Account ID',
				placeholder: 'Seu Taboola Account ID',
				hint: 'Encontre em Taboola Ads → Tracking',
			},
		],
	},
	{
		key: 'utmify',
		name: 'Utmify',
		description: 'Trackeamento avançado de UTMs',
		icon: AnalyticsUpIcon,
		supportKey: 'supportsUtmify',
		hasEvents: true,
		eventPlatformKey: 'utmify',
		fields: [
			{
				key: 'pixelId',
				label: 'Pixel ID',
				placeholder: 'Seu Pixel ID do Utmify',
				hint: 'Encontre no painel do Utmify → Configurações',
			},
		],
	},
	{
		key: 'otimizey',
		name: 'Otimizey',
		description: 'Otimização de conversões',
		icon: AnalyticsUpIcon,
		supportKey: 'supportsOtimizey',
		hasEvents: true,
		eventPlatformKey: 'otimizey',
		fields: [
			{
				key: 'pixelId',
				label: 'Pixel ID',
				placeholder: 'Seu Pixel ID do Otimizey',
				hint: 'Encontre no painel do Otimizey → Configurações',
			},
		],
	},
];

function buildTrackingSettings(data: FormData): TrackingSettings {
	return {
		clarity: {
			enabled: data.clarity.enabled,
			projectId: data.clarity.projectId.trim() || null,
		},
		facebookPixel: {
			enabled: data.facebookPixel.enabled,
			pixelId: data.facebookPixel.pixelId.trim() || null,
			accessToken: data.facebookPixel.accessToken.trim() || null,
			testEventCode: data.facebookPixel.testEventCode.trim() || null,
			enableDeduplication: data.facebookPixel.enableDeduplication,
			events: eventsArrayToSettings(data.facebookPixel.events),
		},
		googleTagManager: {
			enabled: data.googleTagManager.enabled,
			containerId: data.googleTagManager.containerId.trim() || null,
			events: eventsArrayToSettings(data.googleTagManager.events),
		},
		tikTok: {
			enabled: data.tiktok.enabled,
			pixelId: data.tiktok.pixelId.trim() || null,
			accessToken: data.tiktok.accessToken.trim() || null,
			events: eventsArrayToSettings(data.tiktok.events),
		},
		kwai: {
			enabled: data.kwai.enabled,
			pixelId: data.kwai.pixelId.trim() || null,
			events: eventsArrayToSettings(data.kwai.events),
		},
		pinterest: {
			enabled: data.pinterest.enabled,
			tagId: data.pinterest.tagId.trim() || null,
			events: eventsArrayToSettings(data.pinterest.events),
		},
		taboola: {
			enabled: data.taboola.enabled,
			accountId: data.taboola.accountId.trim() || null,
			events: eventsArrayToSettings(data.taboola.events),
		},
		utmify: {
			enabled: data.utmify.enabled,
			pixelId: data.utmify.pixelId.trim() || null,
			events: eventsArrayToSettings(data.utmify.events),
		},
		otimizey: {
			enabled: data.otimizey.enabled,
			pixelId: data.otimizey.pixelId.trim() || null,
			events: eventsArrayToSettings(data.otimizey.events),
		},
	};
}

function createInitialFormData(tracking: TrackingSettings | null | undefined): FormData {
	return {
		clarity: {
			enabled: tracking?.clarity?.enabled ?? false,
			projectId: tracking?.clarity?.projectId ?? '',
		},
		facebookPixel: {
			enabled: tracking?.facebookPixel?.enabled ?? false,
			pixelId: tracking?.facebookPixel?.pixelId ?? '',
			accessToken: tracking?.facebookPixel?.accessToken ?? '',
			testEventCode: tracking?.facebookPixel?.testEventCode ?? '',
			enableDeduplication: tracking?.facebookPixel?.enableDeduplication ?? false,
			events: settingsToEventsArray(tracking?.facebookPixel?.events),
		},
		googleTagManager: {
			enabled: tracking?.googleTagManager?.enabled ?? false,
			containerId: tracking?.googleTagManager?.containerId ?? '',
			events: settingsToEventsArray(tracking?.googleTagManager?.events),
		},
		tiktok: {
			enabled: tracking?.tikTok?.enabled ?? false,
			pixelId: tracking?.tikTok?.pixelId ?? '',
			accessToken: tracking?.tikTok?.accessToken ?? '',
			events: settingsToEventsArray(tracking?.tikTok?.events),
		},
		kwai: {
			enabled: tracking?.kwai?.enabled ?? false,
			pixelId: tracking?.kwai?.pixelId ?? '',
			events: settingsToEventsArray(tracking?.kwai?.events),
		},
		pinterest: {
			enabled: tracking?.pinterest?.enabled ?? false,
			tagId: tracking?.pinterest?.tagId ?? '',
			events: settingsToEventsArray(tracking?.pinterest?.events),
		},
		taboola: {
			enabled: tracking?.taboola?.enabled ?? false,
			accountId: tracking?.taboola?.accountId ?? '',
			events: settingsToEventsArray(tracking?.taboola?.events),
		},
		utmify: {
			enabled: tracking?.utmify?.enabled ?? false,
			pixelId: tracking?.utmify?.pixelId ?? '',
			events: settingsToEventsArray(tracking?.utmify?.events),
		},
		otimizey: {
			enabled: tracking?.otimizey?.enabled ?? false,
			pixelId: tracking?.otimizey?.pixelId ?? '',
			events: settingsToEventsArray(tracking?.otimizey?.events),
		},
	};
}

function _validateTracking(formData: FormData, providers: ProviderConfig[]): string[] {
	const errors: string[] = [];

	for (const provider of providers) {
		const providerData = formData[provider.key] as Record<string, unknown>;
		if (!providerData.enabled) continue;

		for (const field of provider.fields) {
			const value = String(providerData[field.key] ?? '').trim();
			if (!value) {
				errors.push(`Preencha ${field.label} em ${provider.name}.`);
				break;
			}
		}

		if (provider.hasEvents) {
			const events = (providerData.events as CheckoutTrackingEvent[] | undefined) ?? [];
			if (events.length === 0) {
				errors.push(`Selecione ao menos um evento em ${provider.name}.`);
			}
		}
	}

	return [...new Set(errors)];
}

interface TrackingTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
	onDraftChange?: (draft: {
		trackingSettings: TrackingSettings;
		hasPendingChanges: boolean;
	}) => void;
}

interface FormData {
	clarity: { enabled: boolean; projectId: string };
	facebookPixel: {
		enabled: boolean;
		pixelId: string;
		accessToken: string;
		testEventCode: string;
		enableDeduplication: boolean;
		events: CheckoutTrackingEvent[];
	};
	googleTagManager: { enabled: boolean; containerId: string; events: CheckoutTrackingEvent[] };
	tiktok: { enabled: boolean; pixelId: string; accessToken: string; events: CheckoutTrackingEvent[] };
	kwai: { enabled: boolean; pixelId: string; events: CheckoutTrackingEvent[] };
	pinterest: { enabled: boolean; tagId: string; events: CheckoutTrackingEvent[] };
	taboola: { enabled: boolean; accountId: string; events: CheckoutTrackingEvent[] };
	utmify: { enabled: boolean; pixelId: string; events: CheckoutTrackingEvent[] };
	otimizey: { enabled: boolean; pixelId: string; events: CheckoutTrackingEvent[] };
}

interface EventSelectorProps {
	platform: string;
	selectedEvents: CheckoutTrackingEvent[];
	onEventsChange: (events: CheckoutTrackingEvent[]) => void;
}

function EventSelector({ platform, selectedEvents, onEventsChange }: EventSelectorProps) {
	const eventDescriptions = TRACKING_EVENT_DESCRIPTIONS[platform] ?? [];

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Eventos a rastrear</Label>
				<button
					type="button"
					className="text-xs text-accent hover:underline"
					onClick={() => onEventsChange([...DEFAULT_TRACKING_EVENTS])}
				>
					Selecionar todos
				</button>
			</div>
			<CheckboxGroup
				value={selectedEvents}
				onChange={(values) => onEventsChange(values as CheckoutTrackingEvent[])}
				className="flex flex-col gap-2"
			>
				{eventDescriptions.map((eventDesc) => (
					<Checkbox key={eventDesc.event} value={eventDesc.event} className="w-full">
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Checkbox.Content className="flex flex-1 flex-row items-center justify-between">
							<div className="flex flex-col gap-0.5">
								<Label>{eventDesc.label}</Label>
								<Description>{eventDesc.description}</Description>
							</div>
							<Chip variant="soft" size="sm" className="ml-2 shrink-0">
								{eventDesc.platformEventName}
							</Chip>
						</Checkbox.Content>
					</Checkbox>
				))}
			</CheckboxGroup>
		</div>
	);
}

interface ProviderCardProps {
	config: ProviderConfig;
	data: FormData[ProviderKey];
	onUpdate: (updates: Partial<FormData[ProviderKey]>) => void;
	defaultExpanded: boolean;
}

function ProviderCard({ config, data, onUpdate, defaultExpanded }: ProviderCardProps) {
	const providerData = data as Record<string, unknown>;

	return (
		<SectionAccordion
			id={config.key}
			defaultExpanded={defaultExpanded}
			icon={config.icon}
			title={config.name}
			summary={`${providerData.enabled ? 'Ativo' : 'Inativo'} • ${config.description}`}
			bodyClassName="p-4"
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
					<div className="flex flex-col">
						<Label className="text-sm">Habilitar {config.name}</Label>
						<span className="text-xs text-muted">Status: {(providerData.enabled as boolean) ? 'Ativo' : 'Inativo'}</span>
					</div>
					<Switch isSelected={providerData.enabled as boolean} onChange={(checked) => onUpdate({ enabled: checked })}>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch>
				</div>
				{providerData.enabled ? (
					<>
						<div className="flex items-center gap-2">
							<Chip variant="soft" color="success" size="sm">
								<Icon icon={Tick01Icon} className="icon-xs" />
								Habilitado
							</Chip>
						</div>

						{config.fields.map((field) => (
							<TextField variant="secondary"
								key={field.key}
								value={(providerData[field.key] as string) ?? ''}
								onChange={(value) => onUpdate({ [field.key]: value })}
							>
								<Label>{field.label}</Label>
								<Input variant="secondary" placeholder={field.placeholder} type={field.type ?? 'text'} />
								<span className="text-xs text-muted">{field.hint}</span>
							</TextField>
						))}

						{config.key === 'facebookPixel' && (
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<p className="text-sm font-medium">Habilitar Deduplicação</p>
									<p className="text-xs text-muted">Evita eventos duplicados entre browser e server</p>
								</div>
								<Switch
									isSelected={(providerData as FormData['facebookPixel']).enableDeduplication}
									onChange={(checked) => onUpdate({ enableDeduplication: checked })}
								>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>
						)}

						{config.hasEvents && config.eventPlatformKey && (
							<>
								<div className="h-px bg-divider" />
								<EventSelector
									platform={config.eventPlatformKey}
									selectedEvents={(providerData.events as CheckoutTrackingEvent[]) ?? []}
									onEventsChange={(events) => onUpdate({ events })}
								/>
							</>
						)}
					</>
				) : (
					<p className="text-sm text-muted">Habilite para configurar {config.name}.</p>
				)}
			</div>
		</SectionAccordion>
	);
}

export function TrackingTab({ checkout, merchantId, onRefresh, onDraftChange }: TrackingTabProps) {
	const template = checkout.template;
	const tracking = checkout.config?.trackingSettings;

	const [formData, setFormData] = useState<FormData>(() => createInitialFormData(tracking));
	const [isSaving, startTransition] = useTransition();

	const trackingSettingsPayload = useMemo(() => buildTrackingSettings(formData), [formData]);

	function handleSave() {
		startTransition(async () => {
			try {
				const response = await updateMerchantCheckout(merchantId, checkout.id, {
					trackingSettings: trackingSettingsPayload,
				});

				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao salvar rastreadores.');
					return;
				}

				toast.success('Rastreadores salvos!');
				onRefresh();
			} catch {
				toast.danger('Erro ao salvar rastreadores.');
			}
		});
	}

	const hasChanges = useMemo(
		() => JSON.stringify(formData) !== JSON.stringify(createInitialFormData(checkout.config?.trackingSettings)),
		[formData, checkout.config?.trackingSettings]
	);

	useEffect(() => {
		onDraftChange?.({
			trackingSettings: trackingSettingsPayload,
			hasPendingChanges: hasChanges,
		});
	}, [trackingSettingsPayload, hasChanges, onDraftChange]);

	function updateProvider(providerKey: ProviderKey, updates: Partial<FormData[ProviderKey]>) {
		setFormData((prev) => ({
			...prev,
			[providerKey]: { ...prev[providerKey], ...updates },
		}));
	}

	const activeProviders = PROVIDERS.filter((p) => template?.[p.supportKey]);
	const shouldStartClosed = activeProviders.length >= 2;
	const _validationErrors = useMemo(() => _validateTracking(formData, activeProviders), [formData, activeProviders]);

	if (!template) {
		return (
			<div className="rounded-xl border border-warning bg-warning/5 px-4 py-6">
					<div className="flex flex-col items-center gap-3 text-center">
						<Icon icon={InformationCircleIcon} className="icon-lg text-warning" />
						<div>
							<p className="font-medium">Nenhum template selecionado</p>
							<p className="text-sm text-muted">
								Selecione um template na aba &quot;Templates&quot; para configurar os rastreadores.
							</p>
						</div>
					</div>
			</div>
		);
	}

	if (activeProviders.length === 0) {
		return (
			<div className="rounded-xl border border-default bg-card px-4 py-6">
					<div className="flex flex-col items-center gap-3 text-center">
						<Icon icon={AnalyticsUpIcon} className="icon-lg text-muted" />
						<div>
							<p className="font-medium">Trackeamento não disponível</p>
							<p className="text-sm text-muted">
								Este template não suporta nenhuma plataforma de rastreamento. Selecione outro template para acessar
								estas funcionalidades.
							</p>
						</div>
					</div>
			</div>
		);
	}

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={handleSave} isSaving={isSaving}>
			{activeProviders.map((providerConfig) => (
				<ProviderCard
					key={providerConfig.key}
					config={providerConfig}
					data={formData[providerConfig.key]}
					onUpdate={(updates) => updateProvider(providerConfig.key, updates)}
					defaultExpanded={!shouldStartClosed}
				/>
			))}

		</CheckoutTabSaveLayout>
	);
}

