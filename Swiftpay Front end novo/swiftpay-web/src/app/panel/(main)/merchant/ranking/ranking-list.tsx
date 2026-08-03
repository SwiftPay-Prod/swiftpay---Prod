'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, TagGroup, Tag, Button, Chip, Tooltip, Spinner } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { Clock01Icon, Award05Icon, RefreshIcon, HelpCircleIcon, Calendar03Icon, UserGroupIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { getRanking } from '@/app/actions/user';
import { formatRelativeTime, formatDate, formatDateOnly } from '@/utils/datetime';
import { Routes } from '@/router/routes';
import { PERIOD_OPTIONS, PERIOD_RULE_LABEL, RANKING_TYPE_OPTIONS, TYPE_DESCRIPTION_LABEL } from './ranking.constants';
import './ranking-effects.css';
import { TopThreePodium } from './components/top-three-podium';
import { RankingRow } from './components/ranking-row';
import { RankingContentSkeleton } from './ranking-skeleton';
import type { RankingEntry, RankingResponse, RankingPeriod, RankingType, RankingProcessingStatus } from '@/types/ranking';
import type { ApiResponse } from '@/types/common';
import type { UserProfile } from '@/types/user';

type RankingPromise = Promise<ApiResponse<RankingResponse>>;
type MyProfilePromise = Promise<ApiResponse<UserProfile>>;

interface RankingListProps {
	fetchPromise: RankingPromise;
	myProfilePromise: MyProfilePromise;
	period: RankingPeriod;
	type: RankingType;
}

function getNextCycleStart(period: RankingPeriod, periodStart: string, periodEnd: string): string {
	const start = new Date(periodStart);
	if (Number.isNaN(start.getTime())) {
		return periodEnd;
	}

	const next = new Date(start);

	if (period === 'Weekly') {
		next.setUTCDate(next.getUTCDate() + 7);
		return next.toISOString();
	}

	if (period === 'Monthly') {
		next.setUTCMonth(next.getUTCMonth() + 1);
		return next.toISOString();
	}

	next.setUTCFullYear(next.getUTCFullYear() + 1);
	return next.toISOString();
}

export function RankingList({ fetchPromise, myProfilePromise, period, type }: RankingListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isChangingPeriod, startPeriodTransition] = useTransition();
	const [isLoadingMore, startLoadMoreTransition] = useTransition();
	const [isRefreshPending, startRefreshTransition] = useTransition();
	const [extraItems, setExtraItems] = useState<RankingEntry[]>([]);
	const [nextPage, setNextPage] = useState(2);
	const [hasMorePages, setHasMorePages] = useState(true);
	const [liveData, setLiveData] = useState<RankingResponse | null>(null);

	const response = use(fetchPromise);
	const myProfileResponse = use(myProfilePromise);

	const currentUserId = myProfileResponse?.data?.id ?? null;
	const data = liveData && liveData.type === type && liveData.period === period ? liveData : response?.data;
	const items = data?.items ?? [];
	const calculatedAt = data?.calculatedAt ?? null;
	const rankingStatus: RankingProcessingStatus = data?.status ?? 'Completed';
	const isRankingProcessing = rankingStatus === 'Processing';
	const periodStart = data?.periodStart ?? null;
	const periodEnd = data?.periodEnd ?? null;
	const isReferralRanking = type === 'Referral';
	const periodRuleLabel = PERIOD_RULE_LABEL[period];
	const typeDescription = TYPE_DESCRIPTION_LABEL[type];
	const periodEndDisplay =
		periodStart && periodEnd && !isReferralRanking ? getNextCycleStart(period, periodStart, periodEnd) : null;

	useEffect(() => {
		if (!isRankingProcessing) {
			return;
		}

		let cancelled = false;

		const intervalId = setInterval(() => {
			getRanking({ type, period, page: 1, pageSize: 20 }).then((rankingResponse) => {
				if (!cancelled && rankingResponse?.data) {
					setLiveData(rankingResponse.data);
				}
			});
		}, 2000);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [isRankingProcessing, period, type]);

	function handleTypeChange(key: string) {
		if (key === type) return;

		setExtraItems([]);
		setNextPage(2);
		setHasMorePages(true);

		startPeriodTransition(() => {
			const nextType = key as RankingType;
			const nextPeriod = nextType === 'Referral' ? 'Annual' : 'Weekly';
			router.push(`${pathname}?type=${nextType}&period=${nextPeriod}`, { scroll: false });
		});
	}

	function handlePeriodChange(key: string) {
		if (key === period) return;

		setExtraItems([]);
		setNextPage(2);
		setHasMorePages(true);

		startPeriodTransition(() => {
			router.push(`${pathname}?type=${type}&period=${key}`, { scroll: false });
		});
	}

	function handleRefresh() {
		setExtraItems([]);
		setNextPage(2);
		setHasMorePages(true);

		startRefreshTransition(async () => {
			const rankingResponse = await getRanking({ type, period, page: 1, pageSize: 20 });
			if (rankingResponse?.data) {
				setLiveData(rankingResponse.data);
			}
		});
	}

	function handleLoadMore() {
		startLoadMoreTransition(async () => {
			const res = await getRanking({ type, period, page: nextPage, pageSize: 20 });
			const moreItems = res?.data?.items ?? [];
			setExtraItems((prev) => [...prev, ...moreItems]);
			setNextPage((p) => p + 1);
			if (moreItems.length < 20) setHasMorePages(false);
		});
	}

	const allItems = [...new Map([...items, ...extraItems].map((e) => [e.userId, e])).values()];
	const podiumEntries = allItems.filter((e) => e.position <= 3);
	const listEntries = allItems.filter((e) => e.position > 3);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-muted">Tipo de ranking</span>
				<InternalTagTabs
					ariaLabel="Selecionar tipo de ranking"
					selectedKey={type}
					onSelectionChange={(key) => {
						if (!isChangingPeriod) {
							handleTypeChange(key);
						}
					}}
					items={RANKING_TYPE_OPTIONS.map((option) => ({
						id: option.key,
						label: option.label,
					}))}
				/>
			</div>

			<Card>
			<Card.Header>
				<div className="flex items-center justify-between w-full gap-2">
					<div className="flex items-center gap-2">
						<Icon icon={Award05Icon} className="icon-sm text-accent" />
						<span className="text-base font-bold">Ranking</span>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{isRankingProcessing && (
							<Chip size="sm" variant="primary" color="warning">
								<div className="flex items-center gap-1.5">
									<Spinner size="sm" color="current" />
									<span>Processando ranking</span>
								</div>
							</Chip>
						)}
						{calculatedAt && (
							<Tooltip>
								<Tooltip.Trigger>
									<span className="flex items-center gap-1 text-xs text-muted cursor-default">
										<Icon icon={Clock01Icon} className="icon-xs" />
										{formatRelativeTime(calculatedAt)}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<Tooltip.Arrow />
									Atualizado em {formatDate(calculatedAt)}
								</Tooltip.Content>
							</Tooltip>
						)}
						<Button
							variant="secondary"
							size="sm"
							onPress={handleRefresh}
							isPending={isRefreshPending}
							aria-label="Atualizar ranking"
							className="min-w-30"
						>
							<div className="flex items-center gap-1.5">
								<Icon icon={RefreshIcon} className="icon-xs" />
								<span>{isRefreshPending ? 'Atualizando...' : 'Atualizar'}</span>
							</div>
						</Button>
					</div>
				</div>

				{!isReferralRanking && periodStart && periodEndDisplay && (
					<div className="flex flex-col gap-0.5 text-xs text-muted">
						<div className="flex items-center gap-1">
							<Icon icon={Calendar03Icon} className="icon-xs shrink-0" />
							<span>
								Período do ranking: {formatDateOnly(periodStart)} - {formatDateOnly(periodEndDisplay)}
							</span>
						</div>
						<span>{periodRuleLabel}</span>
					</div>
				)}

				{isReferralRanking ? (
					<div className="flex items-center gap-1.5">
						<p className="text-xs text-muted">{typeDescription}</p>
						<Tooltip>
							<Tooltip.Trigger>
								<Button isIconOnly variant="ghost" size="sm" aria-label="Como o ranking é calculado">
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-xs">
								<Tooltip.Arrow />
								<p className="text-xs">
									No ranking de indicações, a posição considera primeiro o total de indicados e depois a comissão total acumulada. O resultado é atualizado a cada 5 minutos.
								</p>
							</Tooltip.Content>
						</Tooltip>
					</div>
				) : (
					<p className="text-xs text-muted">{typeDescription}</p>
				)}

				<div className="flex items-center gap-2 pt-1">
					{!isReferralRanking && (
					<TagGroup
						selectionMode="single"
						selectedKeys={new Set([period])}
						onSelectionChange={(keys) => {
							const key = Array.from(keys)[0];
							if (key) handlePeriodChange(String(key));
						}}
					>
						<TagGroup.List className="flex gap-1.5">
							{PERIOD_OPTIONS.map((opt) => (
								<Tag key={opt.key} id={opt.key}>
									{opt.label}
								</Tag>
							))}
						</TagGroup.List>
					</TagGroup>
					)}
					{!isReferralRanking && (
						<Tooltip>
							<Tooltip.Trigger>
								<Button isIconOnly variant="ghost" size="sm" aria-label="Como o ranking é calculado">
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content className="max-w-xs">
								<Tooltip.Arrow />
								<p className="text-xs">
									O ranking é calculado com base no faturamento total de todas as suas organizações no período selecionado. Apenas pagamentos confirmados são contabilizados. O resultado é atualizado a cada 5 minutos.
								</p>
							</Tooltip.Content>
						</Tooltip>
					)}
				</div>

				{isReferralRanking && (
					<div className="pt-1">
						<Button
							variant="secondary"
							size="sm"
							onPress={() => router.push(Routes.panel.referrals)}
						>
							<div className="flex items-center gap-1.5">
								<Icon icon={UserGroupIcon} className="icon-sm" />
								<span>Ir para Indique e Ganhe</span>
								<Icon icon={ArrowRight01Icon} className="icon-sm" />
							</div>
						</Button>
					</div>
				)}
			</Card.Header>

			<Card.Content className="px-3 pb-3">
				{isChangingPeriod ? (
					<RankingContentSkeleton />
				) : allItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-muted">
						<Icon icon={Award05Icon} size={32} />
						<p className="text-sm">
							{isReferralRanking ? 'Nenhum usuário com indicações no ranking ainda.' : 'Nenhum usuário no ranking ainda.'}
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-0.5">
						{podiumEntries.length > 0 && (
							<TopThreePodium entries={podiumEntries} currentUserId={currentUserId} type={type} />
						)}
						<div className="max-w-2xl mx-auto w-full flex flex-col gap-0.5">
							{listEntries.map((entry) => (
								<RankingRow
									key={entry.userId}
									entry={entry}
									type={type}
									isCurrentUser={currentUserId !== null && entry.userId === currentUserId}
								/>
							))}
						</div>
					</div>
				)}
				{hasMorePages && items.length >= 20 && (
					<div className="flex justify-center pt-3">
						<Button variant="tertiary" size="sm" isDisabled={isLoadingMore} onPress={handleLoadMore}>
							{isLoadingMore ? 'Carregando...' : 'Carregar mais'}
						</Button>
					</div>
				)}
			</Card.Content>
			</Card>
		</div>
	);
}
