import { UserIcon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { merchantIdentityDocumentTypeParse } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { EmailLink } from '@/components/ui/data-links';
import { InfoField } from './info-field';
import type { AccordionSharedProps } from './types';

export function AdministrativeInfoAccordion({ merchant }: AccordionSharedProps) {
  return (
    <SystemAccordion
      id="org-admin-info"
      defaultExpanded={false}
      icon={UserIcon}
      title="Revisão e envio"
      summary="Dados consolidados do fluxo de análise"
      color="secondary"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoField label="Usuário responsável">{merchant.user.name ?? '-'}</InfoField>
        <InfoField label="E-mail do usuário responsável">
          <EmailLink email={merchant.user.email} className="font-medium" />
        </InfoField>
        <InfoField label="Documento de identidade">
          {merchant.kyc?.identityDocumentType
            ? merchantIdentityDocumentTypeParse[
                merchant.kyc.identityDocumentType as keyof typeof merchantIdentityDocumentTypeParse
              ]?.label
            : '-'}
        </InfoField>
        <InfoField label="Número do documento de identidade">{merchant.kyc?.identityDocumentNumber ?? '-'}</InfoField>
        <InfoField label="Conta criada em">{formatDate(merchant.user.createdAt)}</InfoField>
        <InfoField label="Último envio de KYC">{merchant.kycSubmittedAt ? formatDate(merchant.kycSubmittedAt) : '-'}</InfoField>
      </div>
    </SystemAccordion>
  );
}
