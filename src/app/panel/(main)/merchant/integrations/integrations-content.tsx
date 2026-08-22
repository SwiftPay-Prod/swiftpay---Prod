'use client';

import { use, useMemo, useState, useTransition } from 'react';
import { Link02Icon, Radar01Icon, RoboticIcon, AccountSetting01Icon, DashboardBrowsingIcon, ArrowReloadHorizontalIcon } from '@hugeicons/core-free-icons';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { Icon } from '@/components/ui/icon';
import { getMerchantIntegrations, updateMerchantIntegration } from '@/app/actions/merchant/integrations';
import { IntegrationDetailsModal } from './integration-details-modal';
import { ConfigureIntegrationModal } from './configure-integration-modal';
import { IntegrationCard } from './components/integration-card';
import { integrationTexts } from './integration-texts';
import type { IntegrationTextId } from './integration-texts';
import type { ApiResponse } from '@/types/common';
import type {
	MerchantIntegrationListItem,
	MerchantIntegrationProvider,
	ReadMerchantIntegrationsData,
} from '@/types/merchant/integrations';

type IntegrationsPromise = Promise<ApiResponse<ReadMerchantIntegrationsData>>;
const UTMIFY_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/utmify-icon.png';
const OTIMIZEY_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/otimiey-icon.png';
const GOOGLE_ADS_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/google-ads-icon.png';
const GOOGLE_ANALYTICS_IMAGE_URL =
	'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/google-analytics-icon.png';
const HUBSPOT_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/hubspot-icon.png';
const META_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/meta-icon.png';
const MIXPANEL_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/mixpanel-icon.png';
const N8N_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/n8n-icon.png';
const ZAPIER_IMAGE_URL = 'https://swiftpay-prod.nyc3.cdn.digitaloceanspaces.com/integrations/zapier-icon.png';

type IntegrationCategory = 'tracking' | 'automation' | 'crm' | 'analytics';

type IntegrationCardItem = {
	id: IntegrationTextId;
	name: string;
	websiteUrl: string | null;
	imageUrl: string | null;
};

type DetailsIntegrationState = {
	id: IntegrationTextId;
	name: string;
	subtitle: string;
	isActive: boolean;
	websiteUrl: string | null;
	imageUrl: string | null;
};

interface IntegrationsContentProps {
	merchantId: string;
	fetchPromise: IntegrationsPromise;
}

const trackingProviderConfig: Record<MerchantIntegrationProvider, { textId: IntegrationTextId; subtitle: string; imageUrl: string }> = {
	Utmify: {
		textId: 'utmify',
		subtitle: 'Tracking e atribuição de campanhas',
		imageUrl: UTMIFY_IMAGE_URL,
	},
	Otimizey: {
		textId: 'otimizey',
		subtitle: 'Tracking e atribuição de campanhas',
		imageUrl: OTIMIZEY_IMAGE_URL,
	},
	FacebookCapi: {
		textId: 'facebook_capi',
		subtitle: 'Eventos de conversão server-side',
		imageUrl: META_IMAGE_URL,
	},
};

function parseInitialItems(response: ApiResponse<ReadMerchantIntegrationsData>): MerchantIntegrationListItem[] {
	return response?.data?.items ?? [];
}

function mergeIntegration(
	current: MerchantIntegrationListItem,
	next: Partial<MerchantIntegrationListItem>
): MerchantIntegrationListItem {
	return {
		...current,
		...next,
	};
}

export function IntegrationsContent({ merchantId, fetchPromise }: IntegrationsContentProps) {
	const response = use(fetchPromise);
	const initialItems = parseInitialItems(response);

	const [selectedType, setSelectedType] = useState<IntegrationCategory>('tracking');
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isConfigureOpen, setIsConfigureOpen] = useState(false);
	const [configureModalKey, setConfigureModalKey] = useState(0);
	const [integrations, setIntegrations] = useState<MerchantIntegrationListItem[]>(initialItems);
	const [selectedIntegration, setSelectedIntegration] = useState<MerchantIntegrationListItem | null>(null);
	const [detailsIntegration, setDetailsIntegration] = useState<DetailsIntegrationState | null>(null);
	const [isPending, startTransition] = useTransition();

	const types = useMemo(
		() => [
			{
				id: 'tracking',
				label: 'Rastreamento',
				icon: <Icon icon={Radar01Icon} size={20} />,
			},
			{
				id: 'automation',
				label: 'Automação',
				icon: <Icon icon={RoboticIcon} size={20} />,
			},
			{
				id: 'crm',
				label: 'CRM',
				icon: <Icon icon={AccountSetting01Icon} size={20} />,
			},
			{
				id: 'analytics',
				label: 'Analytics',
				icon: <Icon icon={DashboardBrowsingIcon} size={20} />,
			},
		],
		[]
	);

	const comingSoonCards = useMemo(() => {
		return {
			tracking: [
				{
					id: 'google_ads',
					name: 'Google Ads',
					websiteUrl: null,
					imageUrl: GOOGLE_ADS_IMAGE_URL,
				},
			],
			automation: [
				{
					id: 'zapier',
					name: 'Zapier',
					websiteUrl: null,
					imageUrl: ZAPIER_IMAGE_URL,
				},
				{
					id: 'n8n',
					name: 'n8n',
					websiteUrl: null,
					imageUrl: N8N_IMAGE_URL,
				},
			],
			crm: [
				{
					id: 'hubspot',
					name: 'HubSpot',
					websiteUrl: null,
					imageUrl: HUBSPOT_IMAGE_URL,
				},
				{
					id: 'target_ai',
					name: 'Target AI',
					websiteUrl: null,
					imageUrl: null,
				},
			],
			analytics: [
				{
					id: 'google_analytics',
					name: 'Google Analytics',
					websiteUrl: null,
					imageUrl: GOOGLE_ANALYTICS_IMAGE_URL,
				},
				{
					id: 'mixpanel',
					name: 'Mixpanel',
					websiteUrl: null,
					imageUrl: MIXPANEL_IMAGE_URL,
				},
			],
		} as Record<IntegrationCategory, IntegrationCardItem[]>;
	}, []);

	function openDetails(item: DetailsIntegrationState) {
		setDetailsIntegration(item);
		setIsDetailsOpen(true);
	}

	function handleTypeSelection(key: string) {
		setSelectedType(key as IntegrationCategory);
	}

	function openConfigure(integration: MerchantIntegrationListItem) {
		setSelectedIntegration(integration);
		setConfigureModalKey((prev) => prev + 1);
		setIsConfigureOpen(true);
	}

	function handleRefresh() {
		startTransition(async () => {
			const refreshed = await getMerchantIntegrations(merchantId);
			setIntegrations(parseInitialItems(refreshed));
		});
	}

	function handleSaveConfiguration(payload: {
		enabled: boolean;
		configValues?: Record<string, string>;
		waitingPaymentEnabled: boolean;
		paidEnabled: boolean;
		refusedEnabled: boolean;
		refundedEnabled: boolean;
		chargedbackEnabled: boolean;
	}): Promise<string | null> {
		if (!selectedIntegration) return Promise.resolve('Integração não encontrada.');

		return new Promise((resolve) => {
			startTransition(async () => {
				const result = await updateMerchantIntegration(merchantId, selectedIntegration.provider, {
					enabled: payload.enabled,
					configValues: payload.configValues,
					waitingPaymentEnabled: payload.waitingPaymentEnabled,
					paidEnabled: payload.paidEnabled,
					refusedEnabled: payload.refusedEnabled,
					refundedEnabled: payload.refundedEnabled,
					chargedbackEnabled: payload.chargedbackEnabled,
				});

				if (result?.error?.message) {
					resolve(result.error.message);
					return;
				}

				const data = result?.data;
				if (!data) {
					resolve('Não foi possível atualizar a integração.');
					return;
				}

				setIntegrations((prev) =>
					prev.map((item) =>
						item.provider === selectedIntegration.provider
							? mergeIntegration(item, {
									isEnabled: data.isEnabled,
									isConfigured: data.isConfigured,
									configValues: data.configValues,
									configFields: data.configFields,
									waitingPaymentEnabled: data.waitingPaymentEnabled,
									paidEnabled: data.paidEnabled,
									refusedEnabled: data.refusedEnabled,
									refundedEnabled: data.refundedEnabled,
									chargedbackEnabled: data.chargedbackEnabled,
							  })
							: item
					)
				);

				setSelectedIntegration((prev) => {
					if (!prev || prev.provider !== selectedIntegration.provider) return prev;

					return mergeIntegration(prev, {
						isEnabled: data.isEnabled,
						isConfigured: data.isConfigured,
						configValues: data.configValues,
						configFields: data.configFields,
						waitingPaymentEnabled: data.waitingPaymentEnabled,
						paidEnabled: data.paidEnabled,
						refusedEnabled: data.refusedEnabled,
						refundedEnabled: data.refundedEnabled,
						chargedbackEnabled: data.chargedbackEnabled,
					});
				});

				resolve(null);
			});
		});
	}

	if (integrations.length === 0) {
		return (
			<div className="flex flex-col gap-6 bg-[#000000] text-white">
				<div className="flex items-center gap-3 border-b border-white/10 pb-5">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={Link02Icon} className="icon-sm text-[#4f55f1]" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">Integrações</h1>
						<p className="text-xs text-white/50 mt-0.5">
							Conecte plataformas externas para sincronizar dados da sua operação
						</p>
					</div>
				</div>
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 text-sm text-white/50">
					Nenhuma integração disponível para a sua organização no momento.
				</div>
			</div>
		);
	}

	const trackingIntegrations = integrations.filter((item) => item.provider in trackingProviderConfig);

	const detailsText = detailsIntegration ? (integrationTexts[detailsIntegration.id] ?? null) : null;

	return (
		<>
			<div className="flex flex-col gap-6 bg-[#000000] text-white">
				{/* Executive Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
								<Icon icon={Link02Icon} className="icon-sm text-[#4f55f1]" />
							</div>
							<h1 className="text-xl font-bold tracking-tight text-white">Integrações</h1>
						</div>
						<p className="text-xs text-white/50 mt-1">
							Gerencie conectores externos para rastreamento de vendas, webhooks e automações
						</p>
					</div>

					<button
						type="button"
						onClick={handleRefresh}
						disabled={isPending}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${isPending ? 'animate-spin' : ''}`} />
						<span>Atualizar</span>
					</button>
				</div>
				<InternalTagTabs
					ariaLabel="Tipos de integração"
					selectedKey={selectedType}
					onSelectionChange={handleTypeSelection}
					items={types}
				/>

				<div className="grid grid-cols-1 auto-rows-fr gap-4 lg:grid-cols-3">
					{selectedType === 'tracking'
						? trackingIntegrations.map((integration) => {
							const providerUi = trackingProviderConfig[integration.provider];

							return (
								<IntegrationCard
									key={integration.provider}
									name={integration.name}
									subtitle={providerUi.subtitle}
									description={integrationTexts[providerUi.textId].description}
									imageUrl={providerUi.imageUrl}
									isActive={integration.isEnabled}
									isComingSoon={false}
									websiteUrl={integration.websiteUrl}
									onOpenDetails={() =>
										openDetails({
											id: providerUi.textId,
											name: integration.name,
											subtitle: providerUi.subtitle,
											isActive: integration.isEnabled,
											websiteUrl: integration.websiteUrl,
											imageUrl: providerUi.imageUrl,
										})
									}
									onOpenConfigure={() => openConfigure(integration)}
								/>
							);
						  })
						: null}

					{comingSoonCards[selectedType].map((card) => (
						<IntegrationCard
							key={`${selectedType}-${card.name}`}
							name={card.name}
							subtitle="Integração em planejamento"
							description={integrationTexts[card.id].description}
							imageUrl={card.imageUrl}
							isActive={false}
							isComingSoon
							websiteUrl={card.websiteUrl}
							onOpenDetails={() =>
								openDetails({
									id: card.id,
									name: card.name,
									subtitle: 'Integração em planejamento',
									isActive: false,
									websiteUrl: card.websiteUrl,
									imageUrl: card.imageUrl,
								})
							}
							onOpenConfigure={() => undefined}
						/>
					))}
				</div>
			</div>

			{detailsIntegration && detailsText ? (
				<IntegrationDetailsModal
					isOpen={isDetailsOpen}
					onOpenChange={setIsDetailsOpen}
					name={detailsIntegration.name}
					subtitle={detailsIntegration.subtitle}
					isActive={detailsIntegration.isActive}
					description={detailsText.description}
					capabilities={detailsText.capabilities}
					examples={detailsText.examples}
					websiteUrl={detailsIntegration.websiteUrl}
					imageUrl={detailsIntegration.imageUrl}
				/>
			) : null}

			{selectedIntegration ? (
				<ConfigureIntegrationModal
					key={configureModalKey}
					isOpen={isConfigureOpen}
					onOpenChange={setIsConfigureOpen}
					integration={selectedIntegration}
					isPending={isPending}
					onSubmit={handleSaveConfiguration}
					imageUrl={trackingProviderConfig[selectedIntegration.provider].imageUrl}
					subtitle={trackingProviderConfig[selectedIntegration.provider].subtitle}
					websiteUrl={selectedIntegration.websiteUrl}
				/>
			) : null}
		</>
	);
}
