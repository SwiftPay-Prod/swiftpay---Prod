import { Chip } from '@heroui/react';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { SectionTitle } from '@/components/ui/detail-components';
import { Icon } from '@/components/ui/icon';
import type { AdminTemplateData } from '@/types/admin/templates';
import { getTemplateFeatureSets } from './template-tab-shared';

interface KpiTileProps {
  label: string;
  value: string;
  description?: string;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

function KpiTile({ label, value, description, tone = 'default' }: KpiTileProps) {
  const toneClassName =
    tone === 'accent'
      ? 'border-accent-soft-hover bg-accent/10'
      : tone === 'success'
        ? 'border-success-soft-hover bg-success/10'
        : tone === 'warning'
          ? 'border-warning-soft-hover bg-warning/10'
          : 'border-divider bg-surface-secondary';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClassName}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
      {description ? <p className="text-xs text-muted">{description}</p> : null}
    </div>
  );
}

interface TemplateKpisTabProps {
  template: AdminTemplateData;
  formattedFee: string;
}

export function TemplateKpisTab({ template, formattedFee }: TemplateKpisTabProps) {
  const { coreFeatures, trackingFeatures } = getTemplateFeatureSets(template);

  const usagePerActiveCheckout =
    template.activeCheckouts > 0 ? (template.usageCount / template.activeCheckouts).toFixed(1).replace('.', ',') : '0,0';
  const activeCheckoutRate =
    template.usageCount > 0 ? ((template.activeCheckouts / template.usageCount) * 100).toFixed(1).replace('.', ',') : '0,0';

  const visualAssets = (template.thumbnailUrl ? 1 : 0) + template.previewImages.length;
  const contentCoverage = [
    template.shortDescription,
    template.fullDescription,
    template.bestFor,
    template.features.length > 0 ? 'features' : null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-divider bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="KPIs do Template" />
          <Chip variant="soft" color="default" size="sm">
            Código {template.code}
          </Chip>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
          <KpiTile label="Uso total" value={String(template.usageCount)} description="checkouts que já usaram o template" tone="success" />
          <KpiTile label="Checkouts ativos" value={String(template.activeCheckouts)} description="operando agora" tone="accent" />
          <KpiTile label="Taxa de atividade" value={`${activeCheckoutRate}%`} description="ativos sobre o uso total" tone="warning" />
          <KpiTile label="Uso médio por ativo" value={usagePerActiveCheckout} description="média de uso por checkout ativo" />
          <KpiTile label="Recursos nativos" value={String(coreFeatures.length)} description="cupons, frete, timer e prova social" />
          <KpiTile label="Integrações de rastreamento" value={String(trackingFeatures.length)} description="plataformas com suporte habilitado" />
          <KpiTile label="Assets visuais" value={String(visualAssets)} description="thumbnail + previews" />
          <KpiTile label="Cobertura de conteúdo" value={`${contentCoverage}/4`} description="descrição e posicionamento comercial" />
          <KpiTile label="Modelo de cobrança" value={formattedFee} description="configuração comercial do template" tone="accent" />
        </div>
      </div>
    </div>
  );
}
