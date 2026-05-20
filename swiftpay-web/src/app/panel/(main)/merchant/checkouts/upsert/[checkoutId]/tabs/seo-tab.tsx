'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Input, Label, TextField, TextArea, Select, NumberField, ListBox, toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import {
	SeoIcon,
	TextIcon,
	Image01Icon,
	Globe02Icon,
	Link01Icon,
	ListViewIcon,
	TwitterIcon,
} from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import type { CheckoutData } from '@/types/merchant/checkouts';

interface SeoTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
	onDraftChange?: (draft: {
		seo: {
			metaTitle: string;
			metaDescription: string;
			metaKeywords: string;
			canonicalUrl: string;
			robots: string;
			openGraph: {
				title: string;
				description: string;
				imageUrl: string;
				imageWidth: number | null;
				imageHeight: number | null;
				imageAlt: string;
				siteName: string;
				locale: string;
				type: 'website' | 'article' | 'product' | null;
			};
			twitter: {
				card: 'summary' | 'summary_large_image' | null;
				site: string;
				creator: string;
				title: string;
				description: string;
				imageUrl: string;
			};
		};
		hasPendingChanges: boolean;
	}) => void;
}

interface FormData {
	// Meta Tags
	metaTitle: string;
	metaDescription: string;
	metaKeywords: string;
	canonicalUrl: string;
	robots: string;
	// Open Graph
	ogTitle: string;
	ogDescription: string;
	ogImageUrl: string;
	ogImageWidth: number | null;
	ogImageHeight: number | null;
	ogImageAlt: string;
	ogSiteName: string;
	ogLocale: string;
	ogType: 'website' | 'article' | 'product' | '';
	// Twitter Card
	twitterCard: 'summary' | 'summary_large_image' | '';
	twitterSite: string;
	twitterCreator: string;
	twitterTitle: string;
	twitterDescription: string;
	twitterImageUrl: string;
}

const OG_TYPE_OPTIONS = [
	{ key: 'website', label: 'Website', description: 'Página geral ou site' },
	{ key: 'article', label: 'Artigo', description: 'Blog post ou notícia' },
	{ key: 'product', label: 'Produto', description: 'Página de produto' },
];

const TWITTER_CARD_OPTIONS = [
	{ key: 'summary', label: 'Summary', description: 'Card compacto com miniatura' },
	{ key: 'summary_large_image', label: 'Large Image', description: 'Card expandido com imagem grande' },
];

function isValidAbsoluteUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

function _validateSeo(data: FormData): string[] {
	const errors: string[] = [];
	const canonicalUrl = data.canonicalUrl.trim();
	const ogImageUrl = data.ogImageUrl.trim();
	const twitterImageUrl = data.twitterImageUrl.trim();
	const twitterSite = data.twitterSite.trim();
	const twitterCreator = data.twitterCreator.trim();
	const ogLocale = data.ogLocale.trim();

	if (canonicalUrl && !isValidAbsoluteUrl(canonicalUrl)) {
		errors.push('A URL canônica deve ser uma URL válida iniciando com http:// ou https://.');
	}

	if (ogImageUrl && !isValidAbsoluteUrl(ogImageUrl)) {
		errors.push('A URL da imagem Open Graph deve ser válida.');
	}

	if (twitterImageUrl && !isValidAbsoluteUrl(twitterImageUrl)) {
		errors.push('A URL da imagem do Twitter deve ser válida.');
	}

	if (data.ogImageWidth !== null && data.ogImageWidth <= 0) {
		errors.push('A largura da imagem Open Graph deve ser maior que zero.');
	}

	if (data.ogImageHeight !== null && data.ogImageHeight <= 0) {
		errors.push('A altura da imagem Open Graph deve ser maior que zero.');
	}

	if ((data.ogImageWidth === null) !== (data.ogImageHeight === null)) {
		errors.push('Informe largura e altura da imagem Open Graph juntas.');
	}

	if (twitterSite && !/^@[A-Za-z0-9_]{1,15}$/.test(twitterSite)) {
		errors.push('O campo @Site deve estar no formato @usuario.');
	}

	if (twitterCreator && !/^@[A-Za-z0-9_]{1,15}$/.test(twitterCreator)) {
		errors.push('O campo @Criador deve estar no formato @usuario.');
	}

	if (ogLocale && !/^[a-z]{2}_[A-Z]{2}$/.test(ogLocale)) {
		errors.push('Locale Open Graph inválido. Use o padrão pt_BR.');
	}

	return [...new Set(errors)];
}

export function SeoTab({ checkout, merchantId, onRefresh, onDraftChange }: SeoTabProps) {
	const config = checkout.config;
	const seo = config?.seo;

	const initialFormData = useMemo<FormData>(() => ({
		// Meta Tags
		metaTitle: seo?.metaTitle ?? '',
		metaDescription: seo?.metaDescription ?? '',
		metaKeywords: seo?.metaKeywords ?? '',
		canonicalUrl: seo?.canonicalUrl ?? '',
		robots: seo?.robots ?? '',
		// Open Graph
		ogTitle: seo?.openGraph?.title ?? '',
		ogDescription: seo?.openGraph?.description ?? '',
		ogImageUrl: seo?.openGraph?.imageUrl ?? '',
		ogImageWidth: seo?.openGraph?.imageWidth ?? null,
		ogImageHeight: seo?.openGraph?.imageHeight ?? null,
		ogImageAlt: seo?.openGraph?.imageAlt ?? '',
		ogSiteName: seo?.openGraph?.siteName ?? '',
		ogLocale: seo?.openGraph?.locale ?? '',
		ogType: seo?.openGraph?.type ?? '',
		// Twitter Card
		twitterCard: seo?.twitter?.card ?? '',
		twitterSite: seo?.twitter?.site ?? '',
		twitterCreator: seo?.twitter?.creator ?? '',
		twitterTitle: seo?.twitter?.title ?? '',
		twitterDescription: seo?.twitter?.description ?? '',
		twitterImageUrl: seo?.twitter?.imageUrl ?? '',
	}), [seo]);

	const [formData, setFormData] = useState<FormData>(initialFormData);
	const [isSaving, startTransition] = useTransition();

	function handleSave() {
		startTransition(async () => {
			try {
				const response = await updateMerchantCheckout(merchantId, checkout.id, {
					seo: seoPayload,
				});

				if (response?.error) {
					toast.danger(response.error.message ?? 'Erro ao salvar SEO.');
					return;
				}

				toast.success('SEO salvo!');
				onRefresh();
			} catch {
				toast.danger('Erro ao salvar SEO.');
			}
		});
	}

	const hasChanges = useMemo(
		() => JSON.stringify(formData) !== JSON.stringify(initialFormData),
		[formData, initialFormData]
	);

	const seoPayload = useMemo(() => ({
		metaTitle: formData.metaTitle,
		metaDescription: formData.metaDescription,
		metaKeywords: formData.metaKeywords,
		canonicalUrl: formData.canonicalUrl,
		robots: formData.robots,
		openGraph: {
			title: formData.ogTitle,
			description: formData.ogDescription,
			imageUrl: formData.ogImageUrl,
			imageWidth: formData.ogImageWidth,
			imageHeight: formData.ogImageHeight,
			imageAlt: formData.ogImageAlt,
			siteName: formData.ogSiteName,
			locale: formData.ogLocale,
			type: formData.ogType || null,
		},
		twitter: {
			card: formData.twitterCard || null,
			site: formData.twitterSite,
			creator: formData.twitterCreator,
			title: formData.twitterTitle,
			description: formData.twitterDescription,
			imageUrl: formData.twitterImageUrl,
		},
	}), [formData]);

	useEffect(() => {
		onDraftChange?.({
			seo: seoPayload,
			hasPendingChanges: hasChanges,
		});
	}, [seoPayload, hasChanges, onDraftChange]);

	function updateFormData(updates: Partial<FormData>) {
		setFormData((prev) => ({ ...prev, ...updates }));
	}

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={handleSave} isSaving={isSaving}>
				<SectionAccordion
					id="meta-tags"
					icon={SeoIcon}
					title="Meta Tags SEO"
					summary={formData.metaTitle.trim() ? `Título: ${formData.metaTitle}` : 'Configure título, descrição e indexação'}
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<div className="space-y-4">
								<TextField variant="secondary"
									value={formData.metaTitle}
									onChange={(value) => updateFormData({ metaTitle: value })}
								>
									<div className="flex items-center gap-2">
										<Icon icon={TextIcon} className="icon-sm" />
										<Label>Título (Meta Title)</Label>
									</div>
									<Input variant="secondary" placeholder="Checkout - Sua Loja" />
									<span className="text-xs text-muted">
										Título da página para mecanismos de busca (50-60 caracteres recomendados)
									</span>
								</TextField>

								<TextField variant="secondary"
									value={formData.metaDescription}
									onChange={(value) => updateFormData({ metaDescription: value })}
								>
									<div className="flex items-center gap-2">
										<Icon icon={TextIcon} className="icon-sm" />
										<Label>Descrição (Meta Description)</Label>
									</div>
									<TextArea variant="secondary" placeholder="Finalize sua compra de forma segura e rápida." rows={2} />
									<span className="text-xs text-muted">
										Descrição para resultados de busca (150-160 caracteres recomendados)
									</span>
								</TextField>

								<TextField variant="secondary"
									value={formData.metaKeywords}
									onChange={(value) => updateFormData({ metaKeywords: value })}
								>
									<div className="flex items-center gap-2">
										<Icon icon={ListViewIcon} className="icon-sm" />
										<Label>Palavras-chave (Keywords)</Label>
									</div>
									<Input variant="secondary" placeholder="checkout, compra segura, pagamento" />
									<span className="text-xs text-muted">Palavras-chave separadas por vírgula (uso limitado no SEO moderno)</span>
								</TextField>

								<TextField variant="secondary"
									value={formData.canonicalUrl}
									onChange={(value) => updateFormData({ canonicalUrl: value })}
								>
									<div className="flex items-center gap-2">
										<Icon icon={Link01Icon} className="icon-sm" />
										<Label>URL Canônica</Label>
									</div>
									<Input variant="secondary" placeholder="https://sualoja.com/checkout" />
									<span className="text-xs text-muted">URL preferida para evitar conteúdo duplicado</span>
								</TextField>

								<TextField variant="secondary"
									value={formData.robots}
									onChange={(value) => updateFormData({ robots: value })}
								>
									<div className="flex items-center gap-2">
										<Icon icon={Globe02Icon} className="icon-sm" />
										<Label>Robots</Label>
									</div>
									<Input variant="secondary" placeholder="index, follow" />
									<span className="text-xs text-muted">
										Diretivas para crawlers (ex: index, follow ou noindex, nofollow)
									</span>
								</TextField>
					</div>
				</SectionAccordion>

				<SectionAccordion
					id="open-graph"
					icon={Globe02Icon}
					title="Open Graph"
					summary="Configurações para compartilhamento em redes sociais (Facebook, LinkedIn, etc.)"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<div className="space-y-4">
					<TextField variant="secondary"
						value={formData.ogTitle}
						onChange={(value) => updateFormData({ ogTitle: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Título OG</Label>
						</div>
						<Input variant="secondary" placeholder="Checkout - Sua Loja" />
						<span className="text-xs text-muted">Título exibido ao compartilhar (se vazio, usa o Meta Title)</span>
					</TextField>

					<TextField variant="secondary"
						value={formData.ogDescription}
						onChange={(value) => updateFormData({ ogDescription: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Descrição OG</Label>
						</div>
						<TextArea variant="secondary" placeholder="Finalize sua compra com segurança." rows={2} />
						<span className="text-xs text-muted">Descrição exibida ao compartilhar</span>
					</TextField>

					<TextField variant="secondary"
						value={formData.ogImageUrl}
						onChange={(value) => updateFormData({ ogImageUrl: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={Image01Icon} className="icon-sm" />
							<Label>URL da Imagem OG</Label>
						</div>
						<Input variant="secondary" placeholder="https://sualoja.com/og-image.jpg" />
						<span className="text-xs text-muted">Imagem exibida ao compartilhar (1200x630 recomendado)</span>
					</TextField>

					<div className="grid grid-cols-2 gap-4">
						<NumberField variant="secondary"
							value={formData.ogImageWidth ?? undefined}
							onChange={(value) => updateFormData({ ogImageWidth: value ?? null })}
							minValue={0}
						>
							<Label>Largura da Imagem</Label>
							<Input variant="secondary" placeholder="1200" />
						</NumberField>

						<NumberField variant="secondary"
							value={formData.ogImageHeight ?? undefined}
							onChange={(value) => updateFormData({ ogImageHeight: value ?? null })}
							minValue={0}
						>
							<Label>Altura da Imagem</Label>
							<Input variant="secondary" placeholder="630" />
						</NumberField>
					</div>

					<TextField variant="secondary"
						value={formData.ogImageAlt}
						onChange={(value) => updateFormData({ ogImageAlt: value })}
					>
						<Label>Texto Alternativo da Imagem</Label>
						<Input variant="secondary" placeholder="Checkout da Sua Loja" />
					</TextField>

					<div className="grid grid-cols-2 gap-4">
						<TextField variant="secondary"
							value={formData.ogSiteName}
							onChange={(value) => updateFormData({ ogSiteName: value })}
						>
							<Label>Nome do Site</Label>
							<Input variant="secondary" placeholder="Sua Loja" />
						</TextField>

						<TextField variant="secondary"
							value={formData.ogLocale}
							onChange={(value) => updateFormData({ ogLocale: value })}
						>
							<Label>Locale</Label>
							<Input variant="secondary" placeholder="pt_BR" />
						</TextField>
					</div>

					<Select
						variant="secondary"
						value={formData.ogType || null}
						onChange={(key) =>
							updateFormData({
								ogType: (key as 'website' | 'article' | 'product' | null) ?? '',
							})
						}
					>
						<Label>Tipo de Conteúdo</Label>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{OG_TYPE_OPTIONS.map((option) => (
									<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
										<div className="flex flex-col">
											<span>{option.label}</span>
											<span className="text-xs text-muted">{option.description}</span>
										</div>
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
					</div>
				</SectionAccordion>

				<SectionAccordion
					id="twitter-card"
					icon={TwitterIcon}
					title="Twitter Card"
					summary="Configurações específicas para compartilhamento no X (Twitter)"
					defaultExpanded={false}
					bodyClassName="p-4"
				>
					<div className="space-y-4">
					<Select
						variant="secondary"
						value={formData.twitterCard || null}
						onChange={(key) =>
							updateFormData({
								twitterCard: (key as 'summary' | 'summary_large_image' | null) ?? '',
							})
						}
					>
						<Label>Tipo de Card</Label>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{TWITTER_CARD_OPTIONS.map((option) => (
									<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
										<div className="flex flex-col">
											<span>{option.label}</span>
											<span className="text-xs text-muted">{option.description}</span>
										</div>
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>

					<TextField variant="secondary"
						value={formData.twitterTitle}
						onChange={(value) => updateFormData({ twitterTitle: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Título</Label>
						</div>
						<Input variant="secondary" placeholder="Checkout - Sua Loja" />
						<span className="text-xs text-muted">Título exibido no card (se vazio, usa o OG Title)</span>
					</TextField>

					<TextField variant="secondary"
						value={formData.twitterDescription}
						onChange={(value) => updateFormData({ twitterDescription: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={TextIcon} className="icon-sm" />
							<Label>Descrição</Label>
						</div>
						<TextArea variant="secondary" placeholder="Finalize sua compra com segurança." rows={2} />
						<span className="text-xs text-muted">Descrição exibida no card</span>
					</TextField>

					<TextField variant="secondary"
						value={formData.twitterImageUrl}
						onChange={(value) => updateFormData({ twitterImageUrl: value })}
					>
						<div className="flex items-center gap-2">
							<Icon icon={Image01Icon} className="icon-sm" />
							<Label>URL da Imagem</Label>
						</div>
						<Input variant="secondary" placeholder="https://sualoja.com/twitter-image.jpg" />
						<span className="text-xs text-muted">Imagem exibida no card (se vazio, usa a OG Image)</span>
					</TextField>

					<div className="grid grid-cols-2 gap-4">
						<TextField variant="secondary"
							value={formData.twitterSite}
							onChange={(value) => updateFormData({ twitterSite: value })}
						>
							<Label>@Site</Label>
							<Input variant="secondary" placeholder="@sualoja" />
							<span className="text-xs text-muted">Conta do site</span>
						</TextField>

						<TextField variant="secondary"
							value={formData.twitterCreator}
							onChange={(value) => updateFormData({ twitterCreator: value })}
						>
							<Label>@Criador</Label>
							<Input variant="secondary" placeholder="@voce" />
							<span className="text-xs text-muted">Conta do autor</span>
						</TextField>
					</div>
					</div>
				</SectionAccordion>

		</CheckoutTabSaveLayout>
	);
}

