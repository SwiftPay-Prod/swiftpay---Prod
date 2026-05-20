import { AcquirerOperationType } from '@/types/enums';
import type { RankingProcessingStatus } from '@/types/ranking';

export interface AdminAcquirerRankingItem {
	acquirerId: string;
	name: string;
	displayName: string | null;
	logoUrl: string | null;
	operationTypes: AcquirerOperationType[];
	position: number;
	score: number;
	approvalRate: number;
	approvedTransactions: number;
	failedTransactions: number;
	rejectedTransactions: number;
	analyzedTransactions: number;
}

export interface AdminAcquirerRankingData {
	items: AdminAcquirerRankingItem[];
	sampleSize: number;
	operationTypes: AcquirerOperationType[];
	status: RankingProcessingStatus;
	calculatedAt: string;
}

export interface AdminReadAcquirerRankingRequest {
	operationTypes?: AcquirerOperationType[];
}
