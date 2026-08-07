import { PositionChange } from './position-change';
import { formatCurrency } from '@/utils/currency';
import type { RankingEntry, RankingType } from '@/types/ranking';

interface TopThreePodiumProps {
	entries: RankingEntry[];
	currentUserId: string | null;
	type: RankingType;
}

export function TopThreePodium({ entries, currentUserId, type }: TopThreePodiumProps) {
	const topThree = [1, 2, 3].map((pos) => entries.find((e) => e.position === pos)).filter(Boolean) as RankingEntry[];

	if (topThree.length === 0) return null;

	const isReferralRanking = type === 'Referral';

	const borderMap: Record<number, string> = {
		1: 'border-amber-500/40 bg-card hover:border-amber-500/60',
		2: 'border-zinc-400/40 bg-card hover:border-zinc-400/60',
		3: 'border-amber-700/40 bg-card hover:border-amber-700/60',
	};

	const rankBadgeMap: Record<number, { bg: string; text: string; label: string }> = {
		1: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: '#1 Ouro' },
		2: { bg: 'bg-zinc-400/10 border-zinc-400/30', text: 'text-zinc-200', label: '#2 Prata' },
		3: { bg: 'bg-amber-700/10 border-amber-700/30', text: 'text-amber-600', label: '#3 Bronze' },
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-1">
			{topThree.map((entry) => {
				const badge = rankBadgeMap[entry.position] || { bg: 'bg-surface', text: 'text-muted-foreground', label: `#${entry.position}` };
				const border = borderMap[entry.position] || 'border-border/80 bg-card';
				const displayName = entry.userPublicProfile?.name ?? entry.userName ?? 'Usuário';
				const ordersCount = entry.totalReferrals;
				const avgTicket = entry.volume > 0 && ordersCount > 0 ? Math.round(entry.volume / ordersCount) : 0;
				const isCurrentUser = currentUserId !== null && entry.userId === currentUserId;

				return (
					<div
						key={entry.userId}
						className={`relative p-3.5 rounded-lg border ${border} transition-colors flex flex-col justify-between gap-2.5 ${
							isCurrentUser ? 'ring-1 ring-accent' : ''
						}`}
					>
						{/* Top Row: Rank Badge & Status */}
						<div className="flex items-center justify-between">
							<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${badge.bg} ${badge.text}`}>
								{badge.label}
							</span>
							<div className="flex items-center gap-1.5">
								{entry.userPublicProfile?.selectedBorderLevel && (
									<span className="text-xs font-mono text-muted-foreground bg-surface px-1.5 py-0.2 rounded border border-border/60">
										{entry.userPublicProfile.selectedBorderLevel}
									</span>
								)}
								{isCurrentUser && (
									<span className="text-xs font-mono font-semibold text-accent bg-accent/15 px-1.5 py-0.2 rounded border border-accent/30">
										Você
									</span>
								)}
							</div>
						</div>

						{/* Seller Avatar & Handle */}
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-full bg-surface border border-border/80 flex items-center justify-center font-mono font-semibold text-xs text-foreground shrink-0">
								{displayName.slice(0, 2).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-xs font-semibold text-foreground truncate leading-tight">{displayName}</h3>
								<p className="text-xs text-muted-foreground truncate">
									{entry.userPublicProfile?.bio ? entry.userPublicProfile.bio.split(' ')[0] : 'Organização Parceira'}
								</p>
							</div>
						</div>

						{/* Primary Visual Element: Metric & Sparkline */}
						<div className="border-t border-border/40 pt-2 flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
									{isReferralRanking ? 'Comissão' : 'Faturamento'}
								</span>
								<div className="flex items-center gap-1.5">
									<PositionChange change={entry.positionChange} previousPosition={entry.previousPosition} />
									{/* Small sparkline SVG */}
									<svg className="w-12 h-4 text-emerald-400 shrink-0" viewBox="0 0 48 16" fill="none" stroke="currentColor" strokeWidth="1.5">
										<path d="M2 14 L12 10 L22 12 L32 5 L42 2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							</div>
							<span className="text-lg font-bold font-mono text-foreground tracking-tight">
								{formatCurrency(isReferralRanking ? entry.totalCommission : entry.volume)}
							</span>
						</div>

						{/* Secondary Metadata Footer */}
						<div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1.5 border-t border-border/30">
							{isReferralRanking ? (
								<span>{entry.totalReferrals} indicações</span>
							) : (
								<>
									<span>Ticket M.: {formatCurrency(avgTicket)}</span>
									<span>{ordersCount} vendas</span>
								</>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
