import {
	Checkbox,
	Chip,
	Description,
	Input,
	Label,
	ListBox,
	Select,
	Switch,
	TextField,
} from '@heroui/react';
import { Analytics01Icon, Settings02Icon, Tag01Icon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { NumericFormat } from 'react-number-format';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { Icon } from '@/components/ui/icon';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { mapParseColorToChipColor } from '@/parse';
import { FeeChargeMode } from '@/types/enums';
import { formattedCurrencyToCents } from '@/utils/currency';
import type { ParseColor } from '@/parse/types';

interface TrackingOption {
	id: string;
	label: string;
	description: string;
	isSelected: boolean;
	onChange: (selected: boolean) => void;
}

interface TemplateConfigurationStepProps {
	defaultExpanded: boolean;
	isFree: boolean;
	feeMode: FeeChargeMode | null;
	onFeeModeChange: (value: FeeChargeMode | null) => void;
	feeFixedCents: number | undefined;
	onFeeFixedCentsChange: (value: number | undefined) => void;
	feePercentageValue: number | undefined;
	onFeePercentageValueChange: (value: number | undefined) => void;
	showFeeFixed: boolean;
	showFeePercentage: boolean;
	supportsCoupons: boolean;
	onSupportsCouponsChange: (value: boolean) => void;
	supportsShipping: boolean;
	onSupportsShippingChange: (value: boolean) => void;
	supportsTimer: boolean;
	onSupportsTimerChange: (value: boolean) => void;
	supportsSocialProof: boolean;
	onSupportsSocialProofChange: (value: boolean) => void;
	supportsClarity: boolean;
	onSupportsClarityChange: (value: boolean) => void;
	supportsFacebookPixel: boolean;
	onSupportsFacebookPixelChange: (value: boolean) => void;
	supportsGoogleTagManager: boolean;
	onSupportsGoogleTagManagerChange: (value: boolean) => void;
	supportsTikTok: boolean;
	onSupportsTikTokChange: (value: boolean) => void;
	supportsKwai: boolean;
	onSupportsKwaiChange: (value: boolean) => void;
	supportsPinterest: boolean;
	onSupportsPinterestChange: (value: boolean) => void;
	supportsTaboola: boolean;
	onSupportsTaboolaChange: (value: boolean) => void;
	supportsUtmify: boolean;
	onSupportsUtmifyChange: (value: boolean) => void;
	supportsOtimizey: boolean;
	onSupportsOtimizeyChange: (value: boolean) => void;
}

const feeChargeModeOptions: Array<{
	key: FeeChargeMode;
	label: string;
	color: ParseColor;
	icon: React.ReactNode;
}> = [
	{
		key: FeeChargeMode.FixedOnly,
		label: 'Valor fixo',
		color: 'accent',
		icon: <Icon icon={Tag01Icon} className="icon-sm" />,
	},
	{
		key: FeeChargeMode.PercentageOnly,
		label: 'Percentual',
		color: 'warning',
		icon: <Icon icon={Analytics01Icon} className="icon-sm" />,
	},
	{
		key: FeeChargeMode.FixedAndPercentage,
		label: 'Fixo + percentual',
		color: 'success',
		icon: <Icon icon={Wallet01Icon} className="icon-sm" />,
	},
];

function TrackingOptionSection({
	badgeLabel,
	badgeColor,
	description,
	options,
}: {
	badgeLabel: string;
	badgeColor: ParseColor;
	description: string;
	options: TrackingOption[];
}) {
	return (
		<div className="flex flex-col gap-4 rounded-lg bg-card p-1">
			<div className="flex items-center gap-2 text-xs text-foreground/60">
				<Chip variant="soft" color={mapParseColorToChipColor(badgeColor)} size="sm">
					{badgeLabel}
				</Chip>
				<span>{description}</span>
			</div>

			<div className="flex flex-col gap-3">
				{options.map((option) => (
					<div key={option.id} className="rounded-lg border border-border bg-surface p-3">
						<Checkbox variant="secondary" isSelected={option.isSelected} onChange={option.onChange}>
							<div className="flex gap-3">
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<div className="-mt-0.5 flex flex-col gap-1">
									<Label className="text-sm">{option.label}</Label>
									<Description className="text-xs">{option.description}</Description>
								</div>
							</div>
						</Checkbox>
					</div>
				))}
			</div>
		</div>
	);
}

export function TemplateConfigurationStep({
	defaultExpanded,
	isFree,
	feeMode,
	onFeeModeChange,
	feeFixedCents,
	onFeeFixedCentsChange,
	feePercentageValue,
	onFeePercentageValueChange,
	showFeeFixed,
	showFeePercentage,
	supportsCoupons,
	onSupportsCouponsChange,
	supportsShipping,
	onSupportsShippingChange,
	supportsTimer,
	onSupportsTimerChange,
	supportsSocialProof,
	onSupportsSocialProofChange,
	supportsClarity,
	onSupportsClarityChange,
	supportsFacebookPixel,
	onSupportsFacebookPixelChange,
	supportsGoogleTagManager,
	onSupportsGoogleTagManagerChange,
	supportsTikTok,
	onSupportsTikTokChange,
	supportsKwai,
	onSupportsKwaiChange,
	supportsPinterest,
	onSupportsPinterestChange,
	supportsTaboola,
	onSupportsTaboolaChange,
	supportsUtmify,
	onSupportsUtmifyChange,
	supportsOtimizey,
	onSupportsOtimizeyChange,
}: TemplateConfigurationStepProps) {
	const analyticsTrackingOptions: TrackingOption[] = [
		{
			id: 'clarity',
			label: 'Microsoft Clarity',
			description: 'Heatmaps e gravações de sessão',
			isSelected: supportsClarity,
			onChange: onSupportsClarityChange,
		},
		{
			id: 'gtm',
			label: 'Google Tag Manager',
			description: 'GTM e GA4',
			isSelected: supportsGoogleTagManager,
			onChange: onSupportsGoogleTagManagerChange,
		},
		{
			id: 'utmify',
			label: 'Utmify',
			description: 'Tracking de campanhas e UTMs',
			isSelected: supportsUtmify,
			onChange: onSupportsUtmifyChange,
		},
		{
			id: 'otimizey',
			label: 'Otimizey',
			description: 'Otimização de conversão',
			isSelected: supportsOtimizey,
			onChange: onSupportsOtimizeyChange,
		},
	];

	const paidMediaTrackingOptions: TrackingOption[] = [
		{
			id: 'facebook-pixel',
			label: 'Facebook Pixel',
			description: 'Meta Ads e Conversions API',
			isSelected: supportsFacebookPixel,
			onChange: onSupportsFacebookPixelChange,
		},
		{
			id: 'tiktok-pixel',
			label: 'TikTok Pixel',
			description: 'TikTok Ads',
			isSelected: supportsTikTok,
			onChange: onSupportsTikTokChange,
		},
		{
			id: 'kwai-pixel',
			label: 'Kwai Pixel',
			description: 'Kwai Ads',
			isSelected: supportsKwai,
			onChange: onSupportsKwaiChange,
		},
		{
			id: 'pinterest-tag',
			label: 'Pinterest Tag',
			description: 'Pinterest Ads',
			isSelected: supportsPinterest,
			onChange: onSupportsPinterestChange,
		},
		{
			id: 'taboola-pixel',
			label: 'Taboola Pixel',
			description: 'Taboola Ads',
			isSelected: supportsTaboola,
			onChange: onSupportsTaboolaChange,
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<SystemAccordion
				id="template-pricing"
				icon={Settings02Icon}
				color="warning"
				title="Precificação"
				summary="Configure se o template é gratuito ou pago"
				defaultExpanded={defaultExpanded}
			>
				<div className="flex flex-col gap-4 rounded-lg bg-card">
					<div className="flex items-center gap-2 text-xs text-foreground/60">
						<Chip variant="soft" color="warning" size="sm">
							Configuração
						</Chip>
						<span>Defina se o template aplica taxa por transação</span>
					</div>

					<Switch isSelected={!isFree} onChange={(selected) => onFeeModeChange(selected ? FeeChargeMode.FixedOnly : null)}>
						<div className="flex gap-4">
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<div className="-mt-0.5 flex flex-col gap-1">
								<Label className="text-sm">Cobrar taxa por transação</Label>
								<Description>Taxa adicional cobrada da organização a cada pagamento</Description>
							</div>
						</div>
					</Switch>
				</div>

				{!isFree && (
					<div className="flex flex-col gap-4 rounded-lg bg-card">

						<div
							className={
								showFeeFixed && showFeePercentage
									? 'grid grid-cols-1 gap-4 2xl:grid-cols-3'
									: 'grid grid-cols-1 gap-4 2xl:grid-cols-2'
							}
						>
							<Select
								variant="secondary"
								aria-label="Modo de taxa"
								value={feeMode}
								onChange={(key) => onFeeModeChange(key as FeeChargeMode)}
							>
								<Label>Modo de cobrança</Label>
								<Select.Trigger className="w-full">
									<Select.Value />
									<Select.Indicator className="size-4" />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{feeChargeModeOptions.map((option) => (
											<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
												<Chip
													variant="soft"
													color={mapParseColorToChipColor(option.color)}
													className="gap-1"
												>
													{option.icon}
													{option.label}
												</Chip>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							{showFeeFixed && (
								<TextField variant="secondary" aria-label="Taxa fixa">
									<Label>Valor fixo (R$)</Label>
									<CurrencyCentsInput
										variant="secondary"
										initialValueInCents={feeFixedCents}
										placeholder="R$ 0,00"
										onValueChange={(value) => onFeeFixedCentsChange(formattedCurrencyToCents(value) ?? undefined)}
									/>
								</TextField>
							)}

							{showFeePercentage && (
								<TextField variant="secondary" aria-label="Taxa percentual">
									<Label>Percentual (%)</Label>
									<NumericFormat
										customInput={Input}
										variant="secondary"
										decimalScale={2}
										fixedDecimalScale
										decimalSeparator=","
										thousandSeparator="."
										suffix="%"
										value={feePercentageValue}
										placeholder="0,00%"
										onValueChange={(values) => onFeePercentageValueChange(values.floatValue)}
									/>
								</TextField>
							)}
						</div>
					</div>
				)}
			</SystemAccordion>

			<SystemAccordion
				id="template-checkout-features"
				icon={Settings02Icon}
				color="success"
				title="Funcionalidades do checkout"
				summary="Recursos disponíveis para os merchants"
				defaultExpanded={defaultExpanded}
			>
				<div className="flex gap-4">
					<Checkbox variant="secondary" className="mt-0.5" isSelected={supportsCoupons} onChange={onSupportsCouponsChange}>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox>
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Suporte a cupons</Label>
						<Description>Permitir uso de cupons de desconto no checkout</Description>
					</div>
				</div>

				<div className="flex gap-4">
					<Checkbox variant="secondary" className="mt-0.5" isSelected={supportsShipping} onChange={onSupportsShippingChange}>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox>
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Cálculo de frete</Label>
						<Description>Integração com cálculo de frete (em breve)</Description>
					</div>
				</div>

				<div className="flex gap-4">
					<Checkbox variant="secondary" className="mt-0.5" isSelected={supportsTimer} onChange={onSupportsTimerChange}>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox>
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Timer de urgência</Label>
						<Description>Exibir contador regressivo no checkout para aumentar conversão</Description>
					</div>
				</div>

				<div className="flex gap-4">
					<Checkbox variant="secondary" className="mt-0.5" isSelected={supportsSocialProof} onChange={onSupportsSocialProofChange}>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox>
					<div className="flex flex-col gap-1">
						<Label className="text-sm">Prova social</Label>
						<Description>Exibir notificações de compras recentes para gerar confiança</Description>
					</div>
				</div>
			</SystemAccordion>

			<SystemAccordion
				id="template-tracking-features"
				icon={Settings02Icon}
				color="secondary"
				title="Integrações de trackeamento"
				summary="Pixels e ferramentas de analytics suportadas"
				defaultExpanded={defaultExpanded}
			>
				<div className="grid grid-cols-1 xl:grid-cols-2">
					<TrackingOptionSection
						badgeLabel="Analytics"
						badgeColor="accent"
						description="Medição de comportamento e performance"
						options={analyticsTrackingOptions}
					/>
					<TrackingOptionSection
						badgeLabel="Mídia paga"
						badgeColor="warning"
						description="Pixels para campanhas de aquisição"
						options={paidMediaTrackingOptions}
					/>
				</div>
			</SystemAccordion>
		</div>
	);
}
