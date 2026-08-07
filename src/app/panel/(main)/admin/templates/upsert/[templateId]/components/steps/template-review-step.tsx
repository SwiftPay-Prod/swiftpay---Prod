import type { ReactNode } from 'react';
import { CheckmarkCircle02Icon, PaintBoardIcon, Settings02Icon } from '@hugeicons/core-free-icons';
import { Chip } from '@heroui/react';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { checkoutTemplateTypeParse, feeChargeModeParse, mapParseColorToChipColor } from '@/parse';
import { CheckoutTemplateType, FeeChargeMode } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';

interface FeatureFlagItem {
	label: string;
	isEnabled: boolean;
}

interface TemplateReviewStepProps {
	defaultExpanded: boolean;
	code: string;
	name: string;
	selectedType: CheckoutTemplateType | null;
	isActive: boolean;
	shortDescription: string;
	fullDescription: string;
	bestFor: string;
	isFree: boolean;
	feeMode: FeeChargeMode | null;
	showFeeFixed: boolean;
	showFeePercentage: boolean;
	feeFixedCents: number | undefined;
	feePercentageValue: number | undefined;
	activeCheckoutFeatures: FeatureFlagItem[];
	activeTrackingFeatures: FeatureFlagItem[];
	featuresList: string[];
	hasThumbnail: boolean;
	previewImageCount: number;
}

function formatPercentage(value: number): string {
	return `${value.toFixed(2).replace('.', ',')}%`;
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted">{label}</span>
			<div className="text-right font-medium text-foreground">{value}</div>
		</div>
	);
}

export function TemplateReviewStep({
	defaultExpanded,
	code,
	name,
	selectedType,
	isActive,
	shortDescription,
	fullDescription,
	bestFor,
	isFree,
	feeMode,
	showFeeFixed,
	showFeePercentage,
	feeFixedCents,
	feePercentageValue,
	activeCheckoutFeatures,
	activeTrackingFeatures,
	featuresList,
	hasThumbnail,
	previewImageCount,
}: TemplateReviewStepProps) {
	const currentFeeSummary = (() => {
		if (isFree) {
			return 'Gratuito';
		}

		if (!feeMode) {
			return 'Não definido';
		}

		const fixedPart = showFeeFixed ? formatCurrency(feeFixedCents ?? 0) : null;
		const percentagePart = showFeePercentage ? formatPercentage(feePercentageValue ?? 0) : null;

		if (fixedPart && percentagePart) {
			return `${fixedPart} + ${percentagePart}`;
		}

		return fixedPart ?? percentagePart ?? feeChargeModeParse[feeMode].label;
	})();

	return (
		<div className="flex flex-col gap-4">
			<SystemAccordion
				id="template-review-general"
				icon={CheckmarkCircle02Icon}
				color="accent"
				title="Revisão geral"
				summary="Resumo dos dados principais"
				defaultExpanded={defaultExpanded}
			>
				<ReviewRow label="Código" value={code.trim() || '-'} />
				<ReviewRow label="Nome" value={name.trim() || '-'} />
				<ReviewRow
					label="Tipo"
					value={
						selectedType ? (
							<Chip size="sm" variant="soft" color={mapParseColorToChipColor(checkoutTemplateTypeParse[selectedType].color)}>
								{checkoutTemplateTypeParse[selectedType].label}
							</Chip>
						) : (
							'Não selecionado'
						)
					}
				/>
				<ReviewRow
					label="Status"
					value={
						<Chip size="sm" variant="soft" color={isActive ? 'success' : 'default'}>
							{isActive ? 'Ativo' : 'Inativo'}
						</Chip>
					}
				/>
				<ReviewRow label="Descrição curta" value={shortDescription.trim() || '-'} />
				<ReviewRow label="Descrição completa" value={fullDescription.trim() || '-'} />
				<ReviewRow label="Indicado para" value={bestFor.trim() || '-'} />
			</SystemAccordion>

			<SystemAccordion
				id="template-review-pricing"
				icon={Settings02Icon}
				color="warning"
				title="Revisão de precificação"
				summary="Como a taxa será aplicada por transação"
				defaultExpanded={defaultExpanded}
			>
				<ReviewRow
					label="Tipo de cobrança"
					value={isFree ? 'Gratuito' : feeMode ? feeChargeModeParse[feeMode].label : 'Não definido'}
				/>
				<ReviewRow label="Resumo da taxa" value={currentFeeSummary} />
				{!isFree && showFeeFixed && <ReviewRow label="Valor fixo" value={formatCurrency(feeFixedCents ?? 0)} />}
				{!isFree && showFeePercentage && <ReviewRow label="Percentual" value={formatPercentage(feePercentageValue ?? 0)} />}
			</SystemAccordion>

			<SystemAccordion
				id="template-review-flags"
				icon={Settings02Icon}
				color="success"
				title="Revisão de funcionalidades"
				summary="Recursos habilitados no template"
				defaultExpanded={defaultExpanded}
			>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-foreground">Checkout</span>
					{activeCheckoutFeatures.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{activeCheckoutFeatures.map((item) => (
								<Chip key={item.label} size="sm" variant="soft" color="success">
									{item.label}
								</Chip>
							))}
						</div>
					) : (
						<span className="text-sm text-muted">Nenhuma funcionalidade de checkout habilitada</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-foreground">Tracking</span>
					{activeTrackingFeatures.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{activeTrackingFeatures.map((item) => (
								<Chip key={item.label} size="sm" variant="soft" color="accent">
									{item.label}
								</Chip>
							))}
						</div>
					) : (
						<span className="text-sm text-muted">Nenhuma integração de tracking habilitada</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-foreground">Lista de recursos</span>
					{featuresList.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{featuresList.map((item) => (
								<Chip key={item} size="sm" variant="soft" color="default">
									{item}
								</Chip>
							))}
						</div>
					) : (
						<span className="text-sm text-muted">Sem recursos adicionais cadastrados</span>
					)}
				</div>
			</SystemAccordion>

			<SystemAccordion
				id="template-review-media"
				icon={PaintBoardIcon}
				color="blue"
				title="Revisão de mídia"
				summary="Arquivos visuais vinculados ao template"
				defaultExpanded={defaultExpanded}
			>
				<ReviewRow
					label="Thumbnail"
					value={
						<Chip size="sm" variant="soft" color={hasThumbnail ? 'success' : 'default'}>
							{hasThumbnail ? 'Configurada' : 'Não configurada'}
						</Chip>
					}
				/>
				<ReviewRow label="Imagens de preview" value={`${previewImageCount} arquivo(s)`} />
			</SystemAccordion>
		</div>
	);
}
