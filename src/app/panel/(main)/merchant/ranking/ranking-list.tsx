'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
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
		if (isRankingProcessing || !data) return;

		const timer = setInterval(() => {
			getRanking({ type, period, page: 1, pageSize: 20 }).then((res) => {
				if (res?.data) setLiveData(res.data);
			});
		}, 15000);

		return () => clearInterval(timer);
	}, [isRankingProcessing, period, type, data]);

	function handleTypeChange(key: string) {
		if (isChangingPeriod) return;
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
				].join(','),
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
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={Award05Icon} className="icon-sm" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Leaderboard de Faturamento</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">Desempenho comparativo de vendas e posições no período selecionado</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={handleExportCSV}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<span>Exportar CSV</span>
					</button>
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isRefreshPending}
						className="button-outline-dark cursor-pointer text-xs disabled:opacity-50"
					>
						<Icon icon={RefreshIcon} className="w-3 h-3 shrink-0" />
						<span>{isRefreshPending ? 'Atualizando...' : 'Atualizar'}</span>
					</button>
				</div>
			</div>

			{/* Top-3 Podium */}
			{podiumEntries.length > 0 && (
				<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
					<TopThreePodium entries={podiumEntries} currentUserId={currentUserId} type={type} />
				</div>
			)}

			{/* Leader Metric Bar */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Líder */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Líder do Período (#1)</span>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-sm font-bold text-white truncate">{firstEntry?.userName || '—'}</span>
						<span className="text-sm font-extrabold font-mono text-[#ec7e00] tabular-nums">
							{formatCurrency(leaderVolume)}
						</span>
					</div>
				</div>

				{/* Minha Posição */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Sua Posição</span>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-lg font-extrabold font-mono text-[#494fdf] tabular-nums">
							#{currentUserEntry?.position ?? 5}
						</span>
						<span className="text-sm font-extrabold font-mono text-white tabular-nums">
							{formatCurrency(currentUserEntry?.volume ?? 0)}
						</span>
					</div>
				</div>

				{/* Diferença */}
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Diferença para o #1</span>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-xs text-white/40">Faltam para a liderança:</span>
						<span className="text-sm font-extrabold font-mono text-[#e23b4a] tabular-nums">
							- {formatCurrency(gapToLeader)}
						</span>
					</div>
				</div>
			</div>

			{/* Filter Toolbar */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-3 overflow-hidden">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
								className="w-full h-8 pl-3 pr-3 text-xs bg-[#0a0a0a] border border-white/12 rounded-lg text-white placeholder:text-white/40 outline-none focus:border-[#4f55f1] transition-colors"
							/>
						</div>
					</div>

					{!isReferralRanking && (
						<div className="flex items-center gap-2">
							{PERIOD_OPTIONS.map((option) => (
								<button
									key={option.key}
									type="button"
									onClick={() => handlePeriodChange(option.key)}
									className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
										period === option.key
											? 'bg-[#494fdf] border-[#4f55f1] text-white'
											: 'border-white/10 text-white/60 hover:border-white/20 hover:text-white'
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Ranked List */}
			<div className="flex flex-col gap-2">
				{allItems.map((entry) => (
					<RankingRow
						key={entry.userId}
						entry={entry}
						type={type}
						isCurrentUser={entry.userId === currentUserId}
						leaderVolume={leaderVolume}
					/>
				))}
			</div>

			{hasMorePages && (
				<div className="flex justify-center pt-2">
					<button
						type="button"
						onClick={handleLoadMore}
						disabled={isLoadingMore}
						className="button-outline-dark cursor-pointer text-xs disabled:opacity-50"
					>
						{isLoadingMore ? 'Carregando...' : 'Carregar mais'}
					</button>
				</div>
			)}

			{calculatedAt && (
				<p className="text-xs text-white/40 font-mono text-center">
					Atualizado em {new Date(calculatedAt).toLocaleString('pt-BR')}
				</p>
			)}

			{rankingStatus === 'Processing' && (
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-8 text-center">
					<RevolutStatusBadge status="Processing" label="Processando ranking..." />
					<p className="text-xs text-white/50 mt-2">Os dados estão sendo atualizados. Isso pode levar alguns minutos.</p>
				</div>
			)}
		</div>
	);
}
