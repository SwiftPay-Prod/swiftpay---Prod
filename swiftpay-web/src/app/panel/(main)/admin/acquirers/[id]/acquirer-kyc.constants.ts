import type { AcquirerMerchantData } from '@/types/admin/acquirers';
import type { Paginated } from '@/types/common';
import type { ExternalSubmerchantStatus } from '@/types/enums';

export type KycStatusFilterValue = 'all' | ExternalSubmerchantStatus;
export type CreatedFilterValue = 'all' | 'created' | 'not_created';
export type PageSizeFilterValue = '10' | '20' | '50' | '100';

export const ACQUIRER_KYC_PAGE_SIZE_OPTIONS: Array<{ value: PageSizeFilterValue; label: string }> = [
	{ value: '10', label: '10' },
	{ value: '20', label: '20' },
	{ value: '50', label: '50' },
	{ value: '100', label: '100' },
];

export const ACQUIRER_KYC_EMPTY_MERCHANTS: Paginated<AcquirerMerchantData> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 20,
	totalPages: 0,
};
