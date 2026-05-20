import type { AcquirerAccessAccount } from '@/types/admin/acquirers';

export interface AccessAccountRow {
	rowId: string;
	acquirerId: string;
	acquirerDisplayName: string;
	acquirerNominal: string | null;
	acquirerLogoUrl: string | null;
	accountIndex: number;
	login: string;
	password: string;
	description: string | null;
}

export interface LoadAcquirersOptions {
	showErrorToast?: boolean;
	startLoading?: boolean;
}

export const EMPTY_ACCESS_ACCOUNT: AcquirerAccessAccount = {
	login: '',
	password: '',
	description: null,
};

export const DEFAULT_PAGE_SIZE = 10;
