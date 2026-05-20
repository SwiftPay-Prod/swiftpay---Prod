'use client';

import type { AdminMerchantDetails } from '@/types/admin/merchants';
import {
  MerchantKycPendingField,
  MerchantKycPendingItemStatus,
} from '@/types/enums';
import { BasicInfoAccordion } from './accordions/basic-info-accordion';
import { AddressAccordion } from './accordions/address-accordion';
import { ComplianceOperationAccordion } from './accordions/compliance-operation-accordion';
import { DocumentsAccordion } from './accordions/documents-accordion';
import { AdministrativeInfoAccordion } from './accordions/administrative-info-accordion';
import { ComplementHistoryAccordion } from './accordions/complement-history-accordion';

interface OrganizationAccordionsProps {
  merchant: AdminMerchantDetails;
  evaluatedItemsMap: Record<string, MerchantKycPendingItemStatus>;
  complementHistory: AdminMerchantDetails['kycPendingItems'];
  getPendingFieldLabel: (fieldKey: MerchantKycPendingField | null | undefined) => string;
  getPendingFieldCurrentValue: (fieldKey: MerchantKycPendingField | null | undefined) => string;
}

export function OrganizationAccordions({
  merchant,
  evaluatedItemsMap,
  complementHistory,
  getPendingFieldLabel,
  getPendingFieldCurrentValue,
}: OrganizationAccordionsProps) {
  return (
    <div className="flex flex-col gap-4">
      <BasicInfoAccordion merchant={merchant} />
      <AddressAccordion merchant={merchant} />
      <ComplianceOperationAccordion merchant={merchant} />
      <DocumentsAccordion merchant={merchant} />
      <AdministrativeInfoAccordion merchant={merchant} />
      <ComplementHistoryAccordion
        merchant={merchant}
        complementHistory={complementHistory}
        evaluatedItemsMap={evaluatedItemsMap}
        getPendingFieldLabel={getPendingFieldLabel}
        getPendingFieldCurrentValue={getPendingFieldCurrentValue}
      />
    </div>
  );
}
