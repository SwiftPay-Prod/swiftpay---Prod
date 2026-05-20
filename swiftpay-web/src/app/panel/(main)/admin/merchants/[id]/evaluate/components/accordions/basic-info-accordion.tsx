import { Building02Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { merchantDocumentTypeParse } from '@/parse';
import { EmailLink, PhoneLink, DocumentDisplay } from '@/components/ui/data-links';
import { InfoField } from './info-field';
import type { AccordionSharedProps } from './types';

export function BasicInfoAccordion({ merchant }: AccordionSharedProps) {
  const legalNameLabel = merchant.kyc?.documentType === 'CNPJ' ? 'Razão social' : 'Nome completo';
  const documentLabel = merchant.kyc?.documentType === 'CNPJ' ? 'CNPJ' : 'CPF';

  return (
    <SystemAccordion
      id="org-basic-info"
      defaultExpanded
      icon={Building02Icon}
      title="Informações básicas"
      summary="Dados principais da organização"
      color="accent"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoField label="Nome da organização">{merchant.name ?? '-'}</InfoField>
        <InfoField label={legalNameLabel}>{merchant.kyc?.legalName ?? '-'}</InfoField>
        <InfoField label="Tipo de documento">
          {merchant.kyc?.documentType ? merchantDocumentTypeParse[merchant.kyc.documentType]?.label : '-'}
        </InfoField>
        <InfoField label={documentLabel}>
          <DocumentDisplay document={merchant.kyc?.documentNumber} documentType={merchant.kyc?.documentType} />
        </InfoField>
        <InfoField label="E-mail">
          <EmailLink email={merchant.email} className="font-medium" />
        </InfoField>
        <InfoField label="WhatsApp">
          <PhoneLink phone={merchant.whatsApp ?? null} className="font-medium" />
        </InfoField>
      </div>
    </SystemAccordion>
  );
}
