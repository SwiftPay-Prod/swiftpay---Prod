import { Chip, Label } from '@heroui/react';
import type { AdminTemplateData } from '@/types/admin/templates';
import { getTemplateFeatureSets } from './template-tab-shared';

interface TemplateResourcesTabProps {
  template: AdminTemplateData;
}

export function TemplateResourcesTab({ template }: TemplateResourcesTabProps) {
  const { coreFeatures, trackingFeatures } = getTemplateFeatureSets(template);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-2">
        <Label>Funcionalidades do template</Label>
        <div className="flex flex-wrap gap-2">
          {coreFeatures.length > 0 ? (
            coreFeatures.map((feature) => (
              <Chip key={feature.label} variant="soft" color="default" size="sm">
                {feature.label}
              </Chip>
            ))
          ) : (
            <Chip variant="soft" color="default" size="sm">
              Sem funcionalidades adicionais
            </Chip>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Rastreamento suportado</Label>
        <div className="flex flex-wrap gap-2">
          {trackingFeatures.length > 0 ? (
            trackingFeatures.map((feature) => (
              <Chip key={feature.label} variant="soft" color="accent" size="sm">
                {feature.label}
              </Chip>
            ))
          ) : (
            <Chip variant="soft" color="default" size="sm">
              Sem integrações de rastreamento
            </Chip>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Recursos de experiência</Label>
        <div className="flex flex-wrap gap-2">
          {template.features.length > 0 ? (
            template.features.map((feature, index) => (
              <Chip key={`${feature}-${index}`} variant="soft" color="accent" size="sm">
                {feature}
              </Chip>
            ))
          ) : (
            <Chip variant="soft" color="default" size="sm">
              Sem features cadastradas
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
