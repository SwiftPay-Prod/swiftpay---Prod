import type { AdminMerchantDetails } from '@/types/admin/merchants';
import type {
  MerchantKycPendingField,
  MerchantKycPendingItemStatus,
} from '@/types/enums';

export interface AccordionSharedProps {
  merchant: AdminMerchantDetails;
}

export interface ComplementHistoryAccordionProps extends AccordionSharedProps {
  evaluatedItemsMap: Record<string, MerchantKycPendingItemStatus>;
  complementHistory: AdminMerchantDetails['kycPendingItems'];
  getPendingFieldLabel: (fieldKey: MerchantKycPendingField | null | undefined) => string;
  getPendingFieldCurrentValue: (fieldKey: MerchantKycPendingField | null | undefined) => string;
}
