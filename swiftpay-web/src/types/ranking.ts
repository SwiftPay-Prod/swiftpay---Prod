export type RankingPeriod = 'Weekly' | 'Monthly' | 'Annual';
export type RankingType = 'Volume' | 'Referral';
export type RankingProcessingStatus = 'Completed' | 'Processing';

import type { UserPublicProfile } from './user';

export interface RankingEntry {
	userId: string;
	userName?: string | null;
	profileImageUrl?: string | null;
	userPublicProfile?: UserPublicProfile | null;
	volume: number;
	position: number;
	previousPosition: number | null;
	positionChange: number;
	totalReferrals: number;
	totalCommission: number;
}

export interface RankingResponse {
	items: RankingEntry[];
	totalItems: number;
	page: number;
	pageSize: number;
	totalPages: number;
	type: RankingType;
	period: RankingPeriod;
	status: RankingProcessingStatus;
	calculatedAt: string | null;
	periodStart: string;
	periodEnd: string;
}

export interface GetRankingRequest {
	type?: RankingType;
	period?: RankingPeriod;
	page?: number;
	pageSize?: number;
}
