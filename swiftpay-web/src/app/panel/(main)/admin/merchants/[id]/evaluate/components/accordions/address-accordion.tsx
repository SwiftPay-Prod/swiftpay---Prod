import { MapPinIcon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { InfoField } from './info-field';
import type { AccordionSharedProps } from './types';

export function AddressAccordion({ merchant }: AccordionSharedProps) {
  return (
    <SystemAccordion
      id="org-address"
      defaultExpanded={false}
      icon={MapPinIcon}
      title="Endereço"
      summary="Dados de localização e contato"
      color="success"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoField label="Endereço">
          {merchant.address?.street ? `${merchant.address.street}, ${merchant.address.number ?? 'S/N'}` : '-'}
        </InfoField>
        <InfoField label="Número">{merchant.address?.number ?? '-'}</InfoField>
        <InfoField label="Complemento">{merchant.address?.complement ?? '-'}</InfoField>
        <InfoField label="Bairro">{merchant.address?.neighborhood ?? '-'}</InfoField>
        <InfoField label="Cidade">{merchant.address?.city ?? '-'}</InfoField>
        <InfoField label="Estado">{merchant.address?.state ?? '-'}</InfoField>
        <InfoField label="CEP">{merchant.address?.postalCode ?? '-'}</InfoField>
        <InfoField label="País">{merchant.address?.country ?? '-'}</InfoField>
      </div>
    </SystemAccordion>
  );
}
