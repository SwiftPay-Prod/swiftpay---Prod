import { basisPointsToPercentage, formatCurrency } from '@/utils/currency';
import type { AdminTemplateData } from '@/types/admin/templates';

export const CORE_FEATURE_LABELS: Array<{ key: keyof AdminTemplateData; label: string }> = [
  { key: 'supportsCoupons', label: 'Cupons' },
  { key: 'supportsShipping', label: 'Frete' },
  { key: 'supportsTimer', label: 'Timer' },
  { key: 'supportsSocialProof', label: 'Prova Social' },
];

export const TRACKING_FEATURE_LABELS: Array<{ key: keyof AdminTemplateData; label: string }> = [
  { key: 'supportsClarity', label: 'Microsoft Clarity' },
  { key: 'supportsFacebookPixel', label: 'Facebook Pixel' },
  { key: 'supportsGoogleTagManager', label: 'Google Tag Manager' },
  { key: 'supportsTikTok', label: 'TikTok Pixel' },
  { key: 'supportsKwai', label: 'Kwai Pixel' },
  { key: 'supportsPinterest', label: 'Pinterest Tag' },
  { key: 'supportsTaboola', label: 'Taboola Pixel' },
  { key: 'supportsUtmify', label: 'Utmify' },
  { key: 'supportsOtimizey', label: 'Otimizey' },
];

export function formatTemplateFee(template: AdminTemplateData): string {
  if (template.feeMode === null) {
    return 'Gratuito';
  }

  const fixedPart = template.feeFixed > 0 ? formatCurrency(template.feeFixed) : null;
  const percentagePart = template.feePercentage > 0 ? `${basisPointsToPercentage(template.feePercentage)}%` : null;

  if (fixedPart && percentagePart) {
    return `${fixedPart} + ${percentagePart}`;
  }

  if (fixedPart) {
    return fixedPart;
  }

  if (percentagePart) {
    return percentagePart;
  }

  return 'R$ 0,00';
}

export function getTemplateFeatureSets(template: AdminTemplateData): {
  coreFeatures: Array<{ key: keyof AdminTemplateData; label: string }>;
  trackingFeatures: Array<{ key: keyof AdminTemplateData; label: string }>;
} {
  const coreFeatures = CORE_FEATURE_LABELS.filter((feature) => Boolean(template[feature.key]));
  const trackingFeatures = TRACKING_FEATURE_LABELS.filter((feature) => Boolean(template[feature.key]));

  return {
    coreFeatures,
    trackingFeatures,
  };
}
