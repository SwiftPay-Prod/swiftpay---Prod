'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Card, Button, Chip, Modal, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SocialIcon } from 'react-social-icons';
import {
	LayoutLeftIcon,
	InformationCircleIcon,
	CheckmarkCircle02Icon,
	ViewIcon,
	Tick02Icon,
	MoneyBag01Icon,
	Image01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	PercentCircleIcon,
	DeliveryTruck01Icon,
	UserMultipleIcon,
	Time01Icon,
	ShoppingCart01Icon,
	SparklesIcon,
	HelpCircleIcon,
	ChartBubble01Icon,
	AnalyticsUpIcon,
	Link01Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { checkoutTemplateTypeParse, mapParseColorToChipColor, checkoutFeatureDescriptions } from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import type { CheckoutData, CheckoutTemplateData } from '@/types/merchant/checkouts';
import { FeeChargeMode } from '@/types/enums';
import type { IconSvgElement } from '@hugeicons/react';
import type { ParseColor } from '@/parse/types';

function getColorClasses(color: ParseColor): { text: string; bg: string; border: string } {
	switch (color) {
		case 'accent':
			return { text: 'text-accent', bg: 'bg-accent-soft', border: 'border-accent-soft-hover' };
		case 'success':
			return { text: 'text-success', bg: 'bg-success-soft', border: 'border-success-soft-hover' };
		case 'warning':
			return { text: 'text-warning', bg: 'bg-warning-soft', border: 'border-warning-soft-hover' };
		case 'danger':
			return { text: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger-soft-hover' };
		default:
			return { text: 'text-secondary', bg: 'bg-secondary-soft', border: 'border-secondary-soft-hover' };
	}
}

function formatTemplateFee(template: CheckoutTemplateData): string | null {
	if (template.feeMode === null) return null;

	const parts: string[] = [];
	if (template.feeMode === FeeChargeMode.FixedOnly || template.feeMode === FeeChargeMode.FixedAndPercentage) {
		parts.push(formatCurrency(template.feeFixed));
	}
	if (template.feeMode === FeeChargeMode.PercentageOnly || template.feeMode === FeeChargeMode.FixedAndPercentage) {
		parts.push(`${(template.feePercentage / 100).toFixed(2)}%`);
	}
	return parts.join(' + ');
}

interface TemplatesTabProps {
	checkout: CheckoutData;
	merchantId: string;
	templates: CheckoutTemplateData[];
	onRefresh: () => void;
}

function TemplateCard({
	template,
	isSelected,
	onSelect,
	onPreview,
	isDisabled,
	isPending,
}: {
	template: CheckoutTemplateData;
	isSelected: boolean;
	onSelect: () => void;
	onPreview: () => void;
	isDisabled: boolean;
	isPending: boolean;
}) {
	return (
		<Card
			className={`relative transition-all ${
				isSelected
					? 'border-2 border-accent ring-2 ring-accent-soft-hover'
					: 'border border-border hover:border-accent/50'
			} ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
		>
			{isSelected && (
				<div className="absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-accent">
					<Icon icon={Tick02Icon} className="icon-xs text-accent-foreground" />
				</div>
			)}

			<div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-content1">
				{template.thumbnailUrl ? (
					<Image src={template.thumbnailUrl} alt={template.name} fill className="object-cover" />
				) : (
					<div className="flex size-full items-center justify-center">
						<Icon icon={LayoutLeftIcon} className="size-10 text-muted" />
					</div>
				)}
			</div>

			<Card.Content className="flex flex-col gap-2 p-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="line-clamp-1 font-semibold text-sm">{template.name}</h3>
					{template.feeMode === null ? (
						<Chip size="sm" variant="soft" color="success" className="shrink-0">
							Grátis
						</Chip>
					) : (
						<Chip size="sm" variant="soft" color="accent" className="shrink-0">
							{formatTemplateFee(template)}
						</Chip>
					)}
				</div>

				{template.shortDescription && <p className="line-clamp-2 text-xs text-muted">{template.shortDescription}</p>}

				<div className="flex items-center gap-1.5 pt-1">
					<Button variant="tertiary" size="sm" className="flex-1" onPress={onPreview}>
						<Icon icon={ViewIcon} className="icon-xs" />
						Detalhes
					</Button>
					{isSelected ? (
						<Button variant="secondary" size="sm" className="flex-1" isDisabled>
							Em uso
						</Button>
					) : (
						<AsyncButton
							variant="primary"
							size="sm"
							className="flex-1"
							onPress={onSelect}
							isDisabled={isDisabled}
							isPending={isPending}
						>
							Usar
						</AsyncButton>
					)}
				</div>
			</Card.Content>
		</Card>
	);
}

function FeatureItem({ icon, title, supported }: { icon: IconSvgElement; title: string; supported: boolean }) {
	const description = checkoutFeatureDescriptions[title];

	return (
		<div
			className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
				supported ? 'bg-success/10 text-success' : 'bg-content1 text-muted'
			}`}
		>
			<div
				className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
					supported ? 'bg-success-soft-hover' : 'bg-content2'
				}`}
			>
				<Icon icon={icon} className="icon-md" />
			</div>
			<div className="flex flex-1 items-center justify-between gap-2">
				<span className={`text-sm font-medium ${supported ? 'text-foreground' : 'text-muted'}`}>{title}</span>
				<div className="flex items-center gap-1">
					<Icon
						icon={supported ? CheckmarkCircle02Icon : Cancel01Icon}
						className={`icon-sm shrink-0 ${supported ? 'text-success' : 'text-muted'}`}
					/>
					{description && (
						<Tooltip delay={0} closeDelay={0}>
							<Button isIconOnly variant="tertiary" size="sm" className="size-6 min-w-0">
								<Icon icon={HelpCircleIcon} className="icon-xs text-muted" />
							</Button>
							<Tooltip.Content className="max-w-64">{description}</Tooltip.Content>
						</Tooltip>
					)}
				</div>
			</div>
		</div>
	);
}

interface TrackingPlatformConfig {
	network?: string;
	bgColor: string;
	fgColor: string;
	fallbackIcon?: IconSvgElement;
}

const trackingPlatformConfigs: Record<string, TrackingPlatformConfig> = {
	clarity: {
		network: 'microsoft',
		bgColor: '#00a4ef',
		fgColor: '#ffffff',
	},
	facebook: {
		network: 'facebook',
		bgColor: '#1877f2',
		fgColor: '#ffffff',
	},
	gtm: {
		network: 'google',
		bgColor: '#4285f4',
		fgColor: '#ffffff',
	},
	tiktok: {
		network: 'tiktok',
		bgColor: '#000000',
		fgColor: '#ffffff',
	},
	kwai: {
		bgColor: '#ff6a00',
		fgColor: '#ffffff',
		fallbackIcon: AnalyticsUpIcon,
	},
	pinterest: {
		network: 'pinterest',
		bgColor: '#e60023',
		fgColor: '#ffffff',
	},
	taboola: {
		bgColor: '#0053f0',
		fgColor: '#ffffff',
		fallbackIcon: ChartBubble01Icon,
	},
	utmify: {
		bgColor: '#009BEF',
		fgColor: '#ffffff',
		fallbackIcon: Link01Icon,
	},
	otimizey: {
		bgColor: '#10b981',
		fgColor: '#ffffff',
		fallbackIcon: AnalyticsUpIcon,
	},
};

function TrackingItem({
	platform,
	title,
	supported,
}: {
	platform: keyof typeof trackingPlatformConfigs;
	title: string;
	supported: boolean;
}) {
	const config = trackingPlatformConfigs[platform];

	if (!config) return null;

	return (
		<div
			className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${supported ? '' : 'opacity-60'}`}
			style={{
				borderLeft: supported ? `3px solid ${config.bgColor}` : '3px solid transparent',
				backgroundColor: supported ? `${config.bgColor}10` : 'var(--heroui-content1)',
			}}
		>
			<div
				className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
				style={{
					backgroundColor: supported ? config.bgColor : 'var(--heroui-content2)',
				}}
			>
				{config.network ? (
					<SocialIcon
						network={config.network}
						bgColor="transparent"
						fgColor={supported ? config.fgColor : 'var(--heroui-muted)'}
						style={{ width: 28, height: 28 }}
					/>
				) : (
					<Icon
						icon={config.fallbackIcon ?? ChartBubble01Icon}
						className="icon-md"
						style={{ color: supported ? config.fgColor : 'var(--heroui-muted)' }}
					/>
				)}
			</div>
			<div className="flex flex-1 items-center justify-between gap-2">
				<span className={`text-sm font-medium ${supported ? 'text-foreground' : 'text-muted'}`}>{title}</span>
				<Icon
					icon={supported ? CheckmarkCircle02Icon : Cancel01Icon}
					className={`icon-sm shrink-0 ${supported ? 'text-success' : 'text-muted'}`}
				/>
			</div>
		</div>
	);
}

function TemplatePreviewModal({
	template,
	isOpen,
	onOpenChange,
	onSelect,
	isSelected,
	canSelect,
	isPending,
}: {
	template: CheckoutTemplateData | null;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSelect: () => void;
	isSelected: boolean;
	canSelect: boolean;
	isPending: boolean;
}) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	if (!template) return null;

	const typeParse = checkoutTemplateTypeParse[template.type];
	const allImages: string[] = [template.thumbnailUrl, ...template.previewImages].filter((url): url is string =>
		Boolean(url)
	);

	const currentImage = allImages[currentImageIndex] ?? allImages[0] ?? '';

	function handlePrevImage() {
		setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
	}

	function handleNextImage() {
		setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={LayoutLeftIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>{template.name}</Modal.Heading>
						<p className="text-sm text-muted">Detalhes completos do template</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							{allImages.length > 0 && currentImage && (
								<div className="flex flex-col gap-3">
									<div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-content1">
										<Image
											src={currentImage}
											alt={`Preview ${currentImageIndex + 1}`}
											fill
											className="object-contain"
										/>
										{allImages.length > 1 && (
											<>
												<button
													type="button"
													onClick={handlePrevImage}
													className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
												>
													<Icon icon={ArrowLeft01Icon} className="icon-md" />
												</button>
												<button
													type="button"
													onClick={handleNextImage}
													className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
												>
													<Icon icon={ArrowRight01Icon} className="icon-md" />
												</button>
												<div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
													{allImages.map((_, index) => (
														<button
															key={index}
															type="button"
															onClick={() => setCurrentImageIndex(index)}
															className={`size-2 rounded-full transition-colors ${
																index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
															}`}
														/>
													))}
												</div>
											</>
										)}
									</div>
									{allImages.length > 1 && (
										<div className="flex items-center gap-2 overflow-x-auto pb-2">
											{allImages.map((url, index) => (
												<button
													key={index}
													type="button"
													onClick={() => setCurrentImageIndex(index)}
													className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
														index === currentImageIndex
															? 'border-accent ring-2 ring-accent-soft-hover'
															: 'border-transparent opacity-60 hover:opacity-100'
													}`}
												>
													<Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
												</button>
											))}
										</div>
									)}
								</div>
							)}

							<div className="flex flex-wrap items-center gap-2">
								<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)}>
									{typeParse.icon}
									{typeParse.label}
								</Chip>
								{template.feeMode === null ? (
									<Chip variant="soft" color="success">
										Gratuito
									</Chip>
								) : (
									<Chip variant="soft" color="warning">
										<Icon icon={MoneyBag01Icon} className="icon-xs" />
										{formatTemplateFee(template)}/transação
									</Chip>
								)}
								{isSelected && (
									<Chip variant="soft" color="accent">
										<Icon icon={Tick02Icon} className="icon-xs" />
										Selecionado
									</Chip>
								)}
							</div>

							{/* Descrição do Template */}
							{(template.shortDescription || template.fullDescription) && (
								<div className="flex flex-col gap-2">
									{template.shortDescription && <p className="text-muted">{template.shortDescription}</p>}
									{template.fullDescription && (
										<p className="whitespace-pre-line text-sm text-muted">{template.fullDescription}</p>
									)}
								</div>
							)}

							{/* Tipo de Template e Ideal Para - Grid lado a lado */}
							{(() => {
								const typeColors = getColorClasses(typeParse.color);
								return (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className={`rounded-xl border p-4 ${typeColors.border} ${typeColors.bg}`}>
											<div className="mb-2 flex items-center gap-2">
												<span className={typeColors.text}>{typeParse.icon}</span>
												<h4 className={`font-semibold ${typeColors.text}`}>Tipo: {typeParse.label}</h4>
											</div>
											<p className="text-sm text-muted">
												{template.type === 'SingleOrder' &&
													'Link único para vendas pontuais. Expira após o tempo configurado ou após a compra.'}
												{template.type === 'Catalog' &&
													'Link permanente como uma mini loja. Cliente escolhe produtos e quantidades.'}
												{template.type === 'Transparent' && 'Checkout via API. Controle total da experiência visual.'}
											</p>
										</div>

										<div className="rounded-xl border border-accent-soft-hover bg-accent-soft p-4">
											<div className="mb-2 flex items-center gap-2">
												<Icon icon={InformationCircleIcon} className="icon-sm text-accent" />
												<h4 className="font-semibold text-accent">Ideal para</h4>
											</div>
											<p className="text-sm text-muted">
												{template.bestFor || (
													<>
														{template.type === 'SingleOrder' && 'Promoções, lançamentos, vendas limitadas'}
														{template.type === 'Catalog' && 'E-commerce, lojas virtuais, catálogos de produtos'}
														{template.type === 'Transparent' && 'Desenvolvedores, integrações customizadas'}
													</>
												)}
											</p>
										</div>
									</div>
								);
							})()}

							{template.features.length > 0 && (
								<div>
									<h4 className="mb-3 font-semibold">Recursos incluídos</h4>
									<div className="flex flex-wrap gap-2">
										{template.features.map((feature) => (
											<Chip key={feature} variant="soft" color="success" size="sm">
												<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
												{feature}
											</Chip>
										))}
									</div>
								</div>
							)}

							<div>
								<h4 className="mb-4 font-semibold">Funcionalidades do Template</h4>
								<div className="grid gap-3 sm:grid-cols-3">
									<FeatureItem icon={ShoppingCart01Icon} title="Múltiplos produtos" supported={template.type === 'Catalog'} />
									<FeatureItem
										icon={PercentCircleIcon}
										title="Cupons de desconto"
										supported={template.supportsCoupons}
									/>
									<FeatureItem
										icon={DeliveryTruck01Icon}
										title="Cálculo de frete"
										supported={template.supportsShipping}
									/>
									<FeatureItem icon={Time01Icon} title="Timer de urgência" supported={template.supportsTimer} />
									<FeatureItem icon={UserMultipleIcon} title="Prova social" supported={template.supportsSocialProof} />
								</div>
							</div>

							<div>
								<h4 className="mb-4 font-semibold">Rastreamentos Suportados</h4>
								<div className="grid gap-3 sm:grid-cols-3">
									<TrackingItem platform="clarity" title="Microsoft Clarity" supported={template.supportsClarity} />
									<TrackingItem platform="facebook" title="Facebook Pixel" supported={template.supportsFacebookPixel} />
									<TrackingItem
										platform="gtm"
										title="Google Tag Manager"
										supported={template.supportsGoogleTagManager}
									/>
									<TrackingItem platform="tiktok" title="TikTok Pixel" supported={template.supportsTikTok} />
									<TrackingItem platform="kwai" title="Kwai Pixel" supported={template.supportsKwai} />
									<TrackingItem platform="pinterest" title="Pinterest Tag" supported={template.supportsPinterest} />
									<TrackingItem platform="taboola" title="Taboola Pixel" supported={template.supportsTaboola} />
									<TrackingItem platform="utmify" title="Utmify" supported={template.supportsUtmify} />
									<TrackingItem platform="otimizey" title="Otimizey" supported={template.supportsOtimizey} />
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" slot="close">
							Fechar
						</Button>
						<AsyncButton
							variant="primary"
							size="lg"
							onPress={() => {
								onSelect();
								onOpenChange(false);
							}}
							isDisabled={!canSelect || isSelected}
							isPending={isPending}
						>
							{isSelected ? (
								<>
									<Icon icon={Tick02Icon} className="icon-sm" />
									Template em uso
								</>
							) : (
								<>
									<Icon icon={SparklesIcon} className="icon-sm" />
									Usar este template
								</>
							)}
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

export function TemplatesTab({ checkout, merchantId, templates, onRefresh }: TemplatesTabProps) {
	const [isPending, startTransition] = useTransition();
	const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
	const [previewTemplate, setPreviewTemplate] = useState<CheckoutTemplateData | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const selectedTemplateId = checkout.template?.id ?? null;
	const canChangeTemplate = true;

	const activeTemplates = templates.filter((t) => t.isActive);
	const freeTemplates = activeTemplates.filter((t) => t.feeMode === null);
	const premiumTemplates = activeTemplates.filter((t) => t.feeMode !== null);

	function handleTemplateSelect(templateId: string) {
		if (!canChangeTemplate || templateId === selectedTemplateId) return;

		setPendingTemplateId(templateId);
		startTransition(async () => {
			const response = await updateMerchantCheckout(merchantId, checkout.id, {
				checkoutTemplateId: templateId,
			});

			setPendingTemplateId(null);

			if (response?.error) {
				toast('Erro ao selecionar', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Template atualizado', {
				description: 'O template foi selecionado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onRefresh();
		});
	}

	function handleOpenPreview(template: CheckoutTemplateData) {
		setPreviewTemplate(template);
		setIsPreviewOpen(true);
	}

	return (
		<div className="flex flex-col gap-4">
			{(freeTemplates.length > 0 || premiumTemplates.length > 0) && (
				<>
					{freeTemplates.length > 0 && (
						<div className="rounded-lg border border-default p-4">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
									<Icon icon={SparklesIcon} className="icon-md text-accent" />
								</div>
								<div>
									<p className="font-medium">Templates Gratuitos</p>
									<p className="text-sm text-muted">{freeTemplates.length} opções disponíveis</p>
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{freeTemplates.map((template) => (
									<TemplateCard
										key={template.id}
										template={template}
										isSelected={selectedTemplateId === template.id}
										onSelect={() => handleTemplateSelect(template.id)}
										onPreview={() => handleOpenPreview(template)}
										isDisabled={!canChangeTemplate}
										isPending={pendingTemplateId === template.id && isPending}
									/>
								))}
							</div>
						</div>
					)}

					{premiumTemplates.length > 0 && (
						<div className="rounded-lg border border-default p-4">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-warning-soft">
									<Icon icon={MoneyBag01Icon} className="icon-md text-warning" />
								</div>
								<div>
									<p className="font-medium">Templates Premium</p>
									<p className="text-sm text-muted">{premiumTemplates.length} opções com taxa por transação</p>
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{premiumTemplates.map((template) => (
									<TemplateCard
										key={template.id}
										template={template}
										isSelected={selectedTemplateId === template.id}
										onSelect={() => handleTemplateSelect(template.id)}
										onPreview={() => handleOpenPreview(template)}
										isDisabled={!canChangeTemplate}
										isPending={pendingTemplateId === template.id && isPending}
									/>
								))}
							</div>
						</div>
					)}
				</>
			)}

			{activeTemplates.length === 0 && (
				<Card>
					<Card.Content className="py-12">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-content1">
								<Icon icon={Image01Icon} className="icon-lg text-muted" />
							</div>
							<div>
								<h3 className="font-semibold">Nenhum template disponível</h3>
								<p className="text-sm text-muted">
									Não há templates ativos no momento. Por favor, tente novamente mais tarde.
								</p>
							</div>
						</div>
					</Card.Content>
				</Card>
			)}

			<TemplatePreviewModal
				template={previewTemplate}
				isOpen={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				onSelect={() => previewTemplate && handleTemplateSelect(previewTemplate.id)}
				isSelected={previewTemplate?.id === selectedTemplateId}
				canSelect={canChangeTemplate}
				isPending={previewTemplate?.id === pendingTemplateId && isPending}
			/>
		</div>
	);
}
