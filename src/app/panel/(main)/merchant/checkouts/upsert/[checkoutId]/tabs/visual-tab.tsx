'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
	Separator,
	Input,
	Label,
	TextField,
	FieldError,
	RadioGroup,
	Radio,
	ColorPicker,
	ColorArea,
	ColorSlider,
	ColorSwatch,
	ColorField,
	ColorSwatchPicker,
	parseColor,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ImageUploader } from '@/components/ui/image-uploader';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { PaintBoardIcon, ImageUploadIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { CheckoutSectionPreview } from '../components/checkout-section-preview';
import { UploadFolder } from '@/types/enums';
import type { CheckoutData } from '@/types/merchant/checkouts';
import { CheckoutColorMode } from '@/types/enums';
import type { CheckoutOnboardingFormData } from '../schemas/checkout-upsert-form-schema';
import { normalizeCheckoutHexColor } from '@/utils/checkout-visual';

interface VisualTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onSave: () => void;
	isSaving: boolean;
	onFormChange: (updates: Partial<CheckoutOnboardingFormData>) => void;
	onDraftChange?: (draft: {
		primaryColor: string;
		secondaryColor: string;
		colorMode: CheckoutColorMode;
		logoUrl: string;
		backgroundImageUrl: string;
		faviconUrl: string;
		hasPendingChanges: boolean;
	}) => void;
}

const PRESET_COLORS = [
	{ name: 'Cobalto', hex: '#494fdf', dark: '#3a40c4' },
	{ name: 'Esmeralda', hex: '#00a87e', dark: '#008a67' },
	{ name: 'Azul', hex: '#3B82F6', dark: '#1D4ED8' },
	{ name: 'Roxo', hex: '#8B5CF6', dark: '#6D28D9' },
	{ name: 'Rosa', hex: '#EC4899', dark: '#BE185D' },
	{ name: 'Laranja', hex: '#F59E0B', dark: '#D97706' },
	{ name: 'Vermelho', hex: '#EF4444', dark: '#B91C1C' },
	{ name: 'Índigo', hex: '#6366F1', dark: '#4338CA' },
];

const PRIMARY_DEFAULT = '#494fdf';
const SECONDARY_DEFAULT = '#16181a';
function GradientPreviewLarge({
	primaryColor,
	secondaryColor,
}: {
	primaryColor: string | null;
	secondaryColor: string | null;
}) {
	if (!primaryColor || !secondaryColor) return null;
	return (
		<div
			className="h-24 w-full rounded-xl border border-border shadow-inner"
			style={{
				background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
			}}
		>
			<div className="flex h-full items-center justify-center text-white font-medium text-sm drop-shadow-sm">
				Pré-visualização do gradiente
			</div>
		</div>
	);
}

function validateColor(color: string): string | null {
	if (!color.trim()) return null;
	if (!normalizeCheckoutHexColor(color)) return 'Use formato hexadecimal (ex: #FF5733)';
	return null;
}

function _isFormValid(
	formData: Pick<CheckoutOnboardingFormData, 'primaryColor' | 'secondaryColor'>,
	colorMode: CheckoutColorMode
): boolean {
	const errors = [
		validateColor(formData.primaryColor),
		colorMode === CheckoutColorMode.Gradient ? validateColor(formData.secondaryColor) : null,
	].filter(Boolean);
	return errors.length === 0;
}

export function VisualTab({ checkout, merchantId, onSave, isSaving, onFormChange, onDraftChange }: VisualTabProps) {
	const config = checkout.config;
	const { control } = useFormContext<CheckoutOnboardingFormData>();
	const formValues = useWatch({ control });

	const getInitialColorMode = (): CheckoutColorMode => {
		if (config?.colorMode) return config.colorMode;
		if (config?.secondaryColor) return CheckoutColorMode.Gradient;
		return CheckoutColorMode.Single;
	};

	const primaryColor = formValues.primaryColor ?? (config?.primaryColor ?? PRIMARY_DEFAULT);
	const secondaryColor = formValues.secondaryColor ?? (config?.secondaryColor ?? '');
	const normalizedPrimaryColor = normalizeCheckoutHexColor(primaryColor) ?? PRIMARY_DEFAULT;
	const normalizedSecondaryColor = normalizeCheckoutHexColor(secondaryColor) ?? SECONDARY_DEFAULT;
	const colorMode = formValues.colorMode ?? getInitialColorMode();
	const logoUrl = formValues.logoUrl ?? (config?.logoUrl ?? '');
	const backgroundImageUrl = formValues.backgroundImageUrl ?? (config?.backgroundImageUrl ?? '');
	const faviconUrl = formValues.faviconUrl ?? (config?.faviconUrl ?? '');

	const hasChanges =
		primaryColor !== (config?.primaryColor ?? PRIMARY_DEFAULT) ||
		secondaryColor !== (config?.secondaryColor ?? '') ||
		logoUrl !== (config?.logoUrl ?? '') ||
		backgroundImageUrl !== (config?.backgroundImageUrl ?? '') ||
		faviconUrl !== (config?.faviconUrl ?? '') ||
		colorMode !== getInitialColorMode();

	useEffect(() => {
		onDraftChange?.({
			primaryColor,
			secondaryColor,
			colorMode,
			logoUrl,
			backgroundImageUrl,
			faviconUrl,
			hasPendingChanges: hasChanges,
		});
	}, [primaryColor, secondaryColor, colorMode, logoUrl, backgroundImageUrl, faviconUrl, hasChanges, onDraftChange]);

	function updateColorMode(newMode: CheckoutColorMode) {
		onFormChange({ colorMode: newMode });
		if (newMode === CheckoutColorMode.Single) {
			onFormChange({ secondaryColor: '' });
		}
	}

	function handleColorModeChange(value: string) {
		updateColorMode(value as CheckoutColorMode);
	}

	function handlePrimaryColorChange(color: ReturnType<typeof parseColor>) {
		const normalized = normalizeCheckoutHexColor(color.toString('hex'));
		if (normalized) onFormChange({ primaryColor: normalized });
	}

	function handleSecondaryColorChange(color: ReturnType<typeof parseColor>) {
		const normalized = normalizeCheckoutHexColor(color.toString('hex'));
		if (normalized) onFormChange({ secondaryColor: normalized });
	}

	return (
		<CheckoutTabSaveLayout hasChanges={hasChanges} onSave={onSave} isSaving={isSaving}>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-7 flex flex-col gap-4">
					<SectionAccordion
						id="cores"
						defaultExpanded={false}
						icon={PaintBoardIcon}
						title="Cores do Checkout"
						summary={
							colorMode === CheckoutColorMode.Gradient
								? `Gradiente • ${primaryColor || PRIMARY_DEFAULT} → ${secondaryColor || SECONDARY_DEFAULT}`
								: `Cor única • ${primaryColor || PRIMARY_DEFAULT}`
						}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
							<RadioGroup
								value={colorMode}
								onChange={handleColorModeChange}
								orientation="horizontal"
								variant="secondary"
							>
								<Label>Modo de cor</Label>
								<Radio value={CheckoutColorMode.Single}>
									<Radio.Control>
										<Radio.Indicator />
									</Radio.Control>
									<Radio.Content>
										<Label>Cor única</Label>
									</Radio.Content>
								</Radio>
								<Radio value={CheckoutColorMode.Gradient}>
									<Radio.Control>
										<Radio.Indicator />
									</Radio.Control>
									<Radio.Content>
										<Label>Gradiente</Label>
									</Radio.Content>
								</Radio>
							</RadioGroup>

							<div className="flex flex-col gap-4">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">
											{colorMode === CheckoutColorMode.Gradient ? 'Cor inicial' : 'Cor principal'}
										</Label>
										<ColorSwatchPicker
											className="flex flex-wrap gap-3"
											variant="square"
											size="md"
											value={parseColor(normalizedPrimaryColor)}
											onChange={handlePrimaryColorChange}
										>
											{PRESET_COLORS.map((color) => (
												<ColorSwatchPicker.Item key={color.hex} color={color.hex}>
													<ColorSwatchPicker.Swatch />
													<ColorSwatchPicker.Indicator>
														<Icon icon={Tick02Icon} className="icon-xs text-white" />
													</ColorSwatchPicker.Indicator>
												</ColorSwatchPicker.Item>
											))}
										</ColorSwatchPicker>
									</div>

									<div className="flex items-end gap-3">
										<TextField
											variant="secondary"
											value={primaryColor}
											onChange={(value) => onFormChange({ primaryColor: value.toUpperCase() })}
											validate={() => validateColor(primaryColor)}
											className="max-w-48 flex-1"
										>
											<Label>Cor customizada</Label>
											<Input variant="secondary" placeholder="#3B82F6" className="font-mono" />
											<FieldError />
										</TextField>
										<ColorPicker
											value={parseColor(normalizedPrimaryColor)}
											onChange={handlePrimaryColorChange}
										>
											<ColorPicker.Trigger className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface transition-all hover:bg-surface-soft-hover">
												<ColorSwatch size="sm" className="rounded-lg" />
											</ColorPicker.Trigger>
											<ColorPicker.Popover className="gap-3 p-3">
												<ColorArea
													aria-label="Cor principal"
													colorSpace="hsb"
													xChannel="saturation"
													yChannel="brightness"
												>
													<ColorArea.Thumb />
												</ColorArea>
												<ColorSlider channel="hue" colorSpace="hsb" className="gap-1 px-1">
													<Label>Hue</Label>
													<ColorSlider.Output className="text-muted" />
													<ColorSlider.Track>
														<ColorSlider.Thumb />
													</ColorSlider.Track>
												</ColorSlider>
												<ColorField aria-label="Hex principal">
													<ColorField.Input />
												</ColorField>
											</ColorPicker.Popover>
										</ColorPicker>
									</div>
								</div>

								{colorMode === CheckoutColorMode.Gradient && (
									<>
										<Separator />
										<div className="space-y-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium">Cor final</Label>
												<ColorSwatchPicker
													className="flex flex-wrap gap-3"
													variant="square"
													size="md"
													value={parseColor(normalizedSecondaryColor)}
													onChange={handleSecondaryColorChange}
												>
													{PRESET_COLORS.map((color) => (
														<ColorSwatchPicker.Item key={color.dark} color={color.dark}>
															<ColorSwatchPicker.Swatch />
															<ColorSwatchPicker.Indicator>
																<Icon icon={Tick02Icon} className="icon-xs text-white" />
															</ColorSwatchPicker.Indicator>
														</ColorSwatchPicker.Item>
													))}
												</ColorSwatchPicker>
											</div>

											<div className="flex items-end gap-3">
												<TextField
													variant="secondary"
													value={secondaryColor}
													onChange={(value) => onFormChange({ secondaryColor: value.toUpperCase() })}
													validate={() => validateColor(secondaryColor)}
													className="max-w-48 flex-1"
												>
													<Label>Cor customizada</Label>
													<Input variant="secondary" placeholder="#1D4ED8" className="font-mono" />
													<FieldError />
												</TextField>
												<ColorPicker
													value={parseColor(normalizedSecondaryColor)}
													onChange={handleSecondaryColorChange}
												>
													<ColorPicker.Trigger className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface transition-all hover:bg-surface-soft-hover">
														<ColorSwatch size="sm" className="rounded-lg" />
													</ColorPicker.Trigger>
													<ColorPicker.Popover className="gap-3 p-3">
														<ColorArea
															aria-label="Cor final"
															colorSpace="hsb"
															xChannel="saturation"
															yChannel="brightness"
														>
															<ColorArea.Thumb />
														</ColorArea>
														<ColorSlider channel="hue" colorSpace="hsb" className="gap-1 px-1">
															<Label>Hue</Label>
															<ColorSlider.Output className="text-muted" />
															<ColorSlider.Track>
																<ColorSlider.Thumb />
															</ColorSlider.Track>
														</ColorSlider>
														<ColorField aria-label="Hex final">
															<ColorField.Input />
														</ColorField>
													</ColorPicker.Popover>
												</ColorPicker>
											</div>

											<GradientPreviewLarge primaryColor={primaryColor} secondaryColor={secondaryColor} />
										</div>
									</>
								)}
							</div>
						</div>
					</SectionAccordion>

					<SectionAccordion
						id="imagens"
						defaultExpanded={false}
						icon={ImageUploadIcon}
						title="Imagens"
						summary={`${logoUrl ? 1 : 0} logo • ${backgroundImageUrl ? 1 : 0} fundo • ${faviconUrl ? 1 : 0} favicon`}
						bodyClassName="p-4"
					>
						<div className="space-y-4">
							<div className="rounded-lg border border-border bg-surface-secondary p-3">
								<p className="text-xs font-semibold text-foreground">Arquivos visuais</p>
								<p className="text-xs text-muted-foreground">
									Use arquivos leves e nítidos. Envie logo, fundo e favicon para reforçar a identidade da página.
								</p>
							</div>
							<ImageUploader
								merchantId={merchantId}
								folder={UploadFolder.Checkouts}
								label="Logo"
								description="PNG transparente recomendado, mínimo 200x200px"
								maxFiles={1}
								value={logoUrl ? [logoUrl] : []}
								onChange={(urls) => onFormChange({ logoUrl: urls[0] ?? '' })}
								itemWidth="w-32"
								itemHeight="h-32"
								objectFit="contain"
							/>

							<ImageUploader
								merchantId={merchantId}
								folder={UploadFolder.Checkouts}
								label="Imagem de Fundo"
								description="JPG ou PNG recomendado, mínimo 1080x1080px"
								maxFiles={1}
								value={backgroundImageUrl ? [backgroundImageUrl] : []}
								onChange={(urls) => onFormChange({ backgroundImageUrl: urls[0] ?? '' })}
								itemWidth="w-64"
								itemHeight="h-36"
								objectFit="cover"
							/>

							<ImageUploader
								merchantId={merchantId}
								folder={UploadFolder.Checkouts}
								label="Favicon"
								description="ICO ou PNG recomendado, 32x32px"
								maxFiles={1}
								value={faviconUrl ? [faviconUrl] : []}
								onChange={(urls) => onFormChange({ faviconUrl: urls[0] ?? '' })}
								itemWidth="w-16"
								itemHeight="h-16"
								objectFit="contain"
							/>
						</div>
					</SectionAccordion>
				</div>

				<div className="lg:col-span-5 flex flex-col gap-4">
					<CheckoutSectionPreview
						title="Identidade Visual"
						description="Veja como as cores e logo definem a cara do seu checkout."
						src="https://placehold.co/600x400?text=Preview+Cores+e+Estilo"
					/>
					<CheckoutSectionPreview
						title="Layout de Fundo"
						description="A imagem de fundo cria a atmosfera da página de pagamento."
						src="https://placehold.co/600x400?text=Preview+Fundo+Checkout"
					/>
				</div>
			</div>
		</CheckoutTabSaveLayout>
	);
}
