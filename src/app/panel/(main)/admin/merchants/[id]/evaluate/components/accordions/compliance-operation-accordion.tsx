import { Chip, Link } from '@heroui/react';
import { Analytics01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { merchantOperationTypeParse } from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { InfoField } from './info-field';
import type { AccordionSharedProps } from './types';

function normalizeWebsiteUrl(url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) return trimmedUrl;
  return `https://${trimmedUrl}`;
}

export function ComplianceOperationAccordion({ merchant }: AccordionSharedProps) {
  return (
    <SystemAccordion
      id="org-compliance"
      defaultExpanded={false}
      icon={Analytics01Icon}
      title="Compliance"
      summary="Dados de operação financeira e perfil do negócio"
      color="warning"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoField label="Tipo de operação">
          {merchant.kyc?.operationType ? merchantOperationTypeParse[merchant.kyc.operationType]?.label : '-'}
        </InfoField>
        <InfoField label="Website">
          {merchant.kyc?.website ? (
            <Link
              href={normalizeWebsiteUrl(merchant.kyc.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium"
            >
              {merchant.kyc.website}
            </Link>
          ) : (
            '-'
          )}
        </InfoField>
        <div className="md:col-span-2">
          <InfoField label="Método de pagamento">
            <div className="flex flex-wrap gap-1">
              <Chip variant="soft" size="sm" color="success">
                PIX Instantâneo
              </Chip>
            </div>
          </InfoField>
        </div>
        <div className="md:col-span-2">
          <InfoField label="Descrição do negócio">{merchant.kyc?.businessDescription ?? '-'}</InfoField>
        </div>
        <InfoField label="Receita mensal">
          {merchant.kyc?.monthlyRevenue != null ? formatCurrency(merchant.kyc.monthlyRevenue) : '-'}
        </InfoField>
        <InfoField label="Ticket médio">
          {merchant.kyc?.averageTicket != null ? formatCurrency(merchant.kyc.averageTicket) : '-'}
        </InfoField>
      </div>
    </SystemAccordion>
  );
}
