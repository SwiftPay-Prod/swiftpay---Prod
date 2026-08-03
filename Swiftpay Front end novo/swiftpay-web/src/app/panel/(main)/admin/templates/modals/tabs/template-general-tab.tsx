import { DetailRow, SectionTitle } from '@/components/ui/detail-components';
import { Icon } from '@/components/ui/icon';
import { FormattedDate } from '@/components/ui/formatted-date';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import {
  checkoutTemplateTypeParse,
  templateActiveStatusParse,
} from '@/parse';
import type { AdminTemplateData } from '@/types/admin/templates';

interface TemplateGeneralTabProps {
  template: AdminTemplateData;
  formattedFee: string;
}

export function TemplateGeneralTab({ template, formattedFee }: TemplateGeneralTabProps) {
  const typeParsed = checkoutTemplateTypeParse[template.type];
  const statusParsed = templateActiveStatusParse[template.isActive ? 'active' : 'inactive'];

  return (
    <div className="rounded-lg bg-surface-secondary p-3">
      <SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações gerais" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <DetailRow label="Código" value={template.code} mono />
        <DetailRow label="Nome" value={template.name} />
        <DetailRow label="Tipo" value={typeParsed.label} />
        <DetailRow label="Status" value={statusParsed.label} />
        <DetailRow label="Preço" value={template.feeMode === null ? 'Gratuito' : 'Pago'} />
        <DetailRow label="Taxa aplicada" value={formattedFee} />
        <DetailRow label="Uso total" value={`${template.usageCount} checkouts`} />
        <DetailRow label="Checkouts ativos" value={template.activeCheckouts} />
        <DetailRow label="Criado em" value={<FormattedDate date={template.createdAt} />} />
        <DetailRow label="Atualizado em" value={<FormattedDate date={template.updatedAt} />} />
      </div>
    </div>
  );
}
