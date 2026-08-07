'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { Award05Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { getRanking } from '@/app/actions/user';
import { formatCurrency } from '@/utils/currency';
import { PERIOD_OPTIONS, RANKING_TYPE_OPTIONS } from './ranking.constants';
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

export function RankingList({ fetchPromise, myProfilePromise, period, type }: RankingListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isChangingPeriod, startPeriodTransition] = useTransition();
	const [isLoadingMore, startLoadMoreTransition] = useTransition();
	const [isRefreshPending, startRefreshTransition] = useTransition();
	const [searchQuery, setSearchQuery] = useState('');
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
	const isReferralRanking = type === 'Referral';

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

	function handleExportCSV() {
		const headers = ['Posicao', 'Vendedor', 'Volume', 'Indicacoes', 'Comissao'];
		const csvRows = [
			headers.join(','),
			...allItems.map((e) =>
				[
					e.position,
					`"${e.userPublicProfile?.name || e.userName || 'Usuario'}"`,
					(e.volume / 100).toFixed(2),
					e.totalReferrals,
					(e.totalCommission / 100).toFixed(2),
				].join(',')
			),
		];
		const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `ranking_${type.toLowerCase()}_${period.toLowerCase()}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	const rawAllItems = [...new Map([...items, ...extraItems].map((e) => [e.userId, e])).values()];
	const allItems = rawAllItems.filter((entry) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		const name = (entry.userPublicProfile?.name ?? entry.userName ?? '').toLowerCase();
		const bio = (entry.userPublicProfile?.bio ?? '').toLowerCase();
		return name.includes(q) || bio.includes(q);
	});
	const podiumEntries = rawAllItems.filter((e) => e.position <= 3);
	const currentUserEntry = rawAllItems.find((e) => currentUserId !== null && e.userId === currentUserId) || rawAllItems[4];

	const firstEntry = allItems.find((e) => e.position === 1);
	const leaderVolume = firstEntry?.volume ?? 0;
	const gapToLeader = currentUserEntry ? Math.max(0, leaderVolume - currentUserEntry.volume) : 0;

	return (
		<div className="flex flex-col gap-4">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
				<div>
					<h1 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
						Leaderboard de Faturamento
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Desempenho comparativo de vendas e posições no período selecionado
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={handleExportCSV}
						className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-muted-foreground border border-border/80 hover:text-foreground hover:bg-surface rounded-md transition-colors"
					>
						<span>Exportar CSV</span>
					</button>
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isRefreshPending}
						className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-muted-foreground border border-border/80 hover:text-foreground hover:bg-surface rounded-md transition-colors disabled:opacity-50"
					>
						<Icon icon={RefreshIcon} className="w-3 h-3 shrink-0" />
						<span>{isRefreshPending ? 'Atualizando...' : 'Atualizar'}</span>
					</button>
				</div>
			</div>

			{/* Leader Metric Bar */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div className="p-3.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between gap-1">
					<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Líder do Período (#1)</span>
					<div className="flex items-baseline justify-between">
						<span className="text-sm font-semibold text-foreground truncate">{firstEntry?.userName || 'Gabriel Santos'}</span>
						<span className="text-sm font-mono font-bold text-amber-400">
							{formatCurrency(leaderVolume)}
						</span>
					</div>
				</div>

				<div className="p-3.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between gap-1">
					<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sua Posição</span>
					<div className="flex items-baseline justify-between">
						<span className="text-sm font-mono font-bold text-accent">#{currentUserEntry?.position ?? 5}</span>
						<span className="text-sm font-mono font-bold text-foreground">
							{formatCurrency(currentUserEntry?.volume ?? 0)}
						</span>
					</div>
				</div>

				<div className="p-3.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between gap-1">
					<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Diferença para o #1</span>
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-muted-foreground">Faltam para a liderança:</span>
						<span className="text-sm font-mono font-bold text-rose-400">
							- {formatCurrency(gapToLeader)}
						</span>
					</div>
				</div>
			</div>

			{/* Filter Toolbar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-2.5 rounded-lg">
				<div className="flex flex-wrap items-center gap-2">
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

					<div className="relative flex-1 sm:w-64 min-w-48">
						<input
							type="text"
							placeholder="Buscar vendedor ou organização..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-8 pl-3 pr-3 text-xs bg-surface border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:border-accent transition-colors"
						/>
					</div>
				</div>

				{!isReferralRanking && (
					<div className="flex items-center gap-1 shrink-0">
						{PERIOD_OPTIONS.map((opt) => (
							<button
								key={opt.key}
								type="button"
								onClick={() => handlePeriodChange(opt.key)}
								className={`h-7 px-3 text-xs font-medium rounded-md transition-colors ${
									period === opt.key
										? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
										: 'text-muted-foreground hover:text-foreground hover:bg-surface'
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Leaderboard Body */}
			{isChangingPeriod ? (
				<RankingContentSkeleton />
			) : allItems.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-2 py-12 rounded-lg bg-card border border-border/80 text-muted-foreground">
					<Icon icon={Award05Icon} className="w-8 h-8 opacity-60" />
					<p className="text-xs font-medium">
						{isReferralRanking ? 'Nenhum usuário com indicações no ranking ainda.' : 'Nenhum usuário no ranking ainda.'}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{/* Top 3 Podium */}
					{podiumEntries.length > 0 && (
						<TopThreePodium entries={podiumEntries} currentUserId={currentUserId} type={type} />
					)}

					{/* Ranking Table — Primary Focus */}
					<div className="rounded-lg border border-border/80 bg-card overflow-hidden">
						<div className="flex items-center justify-between px-3.5 py-2 border-b border-border/80 bg-surface/50 text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
							<div className="flex items-center gap-3 min-w-0 flex-1">
								<span className="w-6 text-center shrink-0">#</span>
								<span className="w-12 text-center shrink-0">Tend.</span>
								<span className="truncate">Vendedor / Organização</span>
							</div>
							<div className="flex items-center gap-3 shrink-0">
								<span className="hidden sm:inline-block w-28 text-center text-xs">% do Líder</span>
								<span className="hidden lg:inline-block w-24 text-right">Ticket M.</span>
								<span className="w-32 text-right">{isReferralRanking ? 'Indicações' : 'Faturamento'}</span>
							</div>
						</div>

						<div className="flex flex-col divide-y divide-border/40">
							{allItems.map((entry) => (
								<RankingRow
									key={entry.userId}
									entry={entry}
									type={type}
									leaderVolume={leaderVolume}
									isCurrentUser={currentUserId !== null && entry.userId === currentUserId}
								/>
							))}
						</div>
					</div>
				</div>
			)}
			{hasMorePages && items.length >= 20 && (
				<div className="flex justify-center pt-2">
					<Button variant="tertiary" size="sm" isDisabled={isLoadingMore} onPress={handleLoadMore}>
						{isLoadingMore ? 'Carregando...' : 'Carregar mais'}
					</Button>
				</div>
			)}
		</div>
	);
}
