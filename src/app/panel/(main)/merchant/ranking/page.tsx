import { Suspense } from 'react';
import { getRanking, getMyProfile } from '@/app/actions/user';
import { RankingList } from './ranking-list';
import { RankingSkeleton } from './ranking-skeleton';
import type { RankingPeriod, RankingType } from '@/types/ranking';

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RankingPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const type = (params.type as RankingType) ?? 'Volume';
	const period = (params.period as RankingPeriod) ?? 'Weekly';

	const rankingPromise = getRanking({ type, period, page: 1, pageSize: 20 });
	const myProfilePromise = getMyProfile();

	return (
		<Suspense fallback={<RankingSkeleton />}>
			<RankingList fetchPromise={rankingPromise} myProfilePromise={myProfilePromise} period={period} type={type} />
		</Suspense>
	);
}
