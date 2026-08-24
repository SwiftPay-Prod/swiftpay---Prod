'use client';

import { AvatarUser } from '@/components/ui/avatar-user';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { UserProfilePopover } from './user-profile-popover';
import { SocialIcons } from './social-icons';
import { PositionChange } from './position-change';
import { formatReferralCountLabel, parseSocialLinks } from './utils';
import { formatCurrency } from '@/utils/currency';
import type { RankingEntry, RankingType } from '@/types/ranking';

interface RankingRowProps {
	entry: RankingEntry;
	type: RankingType;
	isCurrentUser?: boolean;
	leaderVolume?: number;
}

export function RankingRow({ entry, type, isCurrentUser, leaderVolume = 0 }: RankingRowProps) {
	const isReferralRanking = type === 'Referral';
	const displayName = entry.userPublicProfile?.name ?? entry.userName ?? 'Usuário';
	const displayProfileImageUrl = entry.userPublicProfile?.profileImageUrl ?? entry.profileImageUrl ?? null;
	const displayBorderImageUrl = entry.userPublicProfile?.selectedBorderImageUrl ?? null;
	const socialLinks = parseSocialLinks(entry.userPublicProfile?.socialLinks ?? null);

	const percentOfLeader = Math.min(100, Math.max(2, Math.round((entry.volume / (leaderVolume || 1)) * 100)));
	const avgTicket = entry.volume > 0 ? Math.round(entry.volume / Math.max(1, entry.totalReferrals ?? 0)) : 0;

	return (
		<UserProfilePopover userId={entry.userId} userPublicProfile={entry.userPublicProfile} placement="top left">
			<div
				aria-label={`Ver perfil de ${displayName}`}
				className={[
					'group relative flex items-center gap-3 w-full cursor-pointer overflow-hidden',
					'px-3.5 py-2.5 transition-colors hover:bg-surface/70',
					isCurrentUser ? 'bg-accent/10 border-l-2 border-l-accent font-medium' : '',
				]
					.filter(Boolean)
					.join(' ')}
			>
				{/* Position */}
				<div className="w-6 shrink-0 text-center">
					<span className={`text-xs font-mono font-bold ${entry.position <= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
						#{entry.position}
					</span>
				</div>

				{/* Trend Indicator */}
				<div className="w-12 shrink-0 flex items-center justify-center">
					<PositionChange change={entry.positionChange} previousPosition={entry.previousPosition} />
				</div>

				{/* Avatar */}
				<AvatarUser
					name={displayName}
					profileImageUrl={displayProfileImageUrl}
					borderImageUrl={displayBorderImageUrl}
					size="sm"
				/>

				{/* Seller Name & Organization & Tier */}
				<div className="flex flex-col min-w-0 flex-1 gap-0.5">
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-xs font-semibold text-foreground truncate">
							{displayName}
						</span>
						{entry.userPublicProfile?.selectedBorderLevel && (
							<span className="text-[9px] font-mono text-muted-foreground bg-surface px-1.5 py-0.2 rounded border border-border/50 shrink-0">
								{entry.userPublicProfile.selectedBorderLevel}
							</span>
						)}
						{isCurrentUser && (
							<span className="text-[9px] font-mono font-semibold text-accent bg-accent/15 px-1.5 py-0.2 rounded border border-accent/30 shrink-0">
								Você
							</span>
						)}
					</div>
					{Object.keys(socialLinks).length > 0 && <SocialIcons links={socialLinks} />}
				</div>

				{/* Relative Progress Bar to #1 */}
				{!isReferralRanking && (
					<div className="hidden sm:flex flex-col gap-1 w-28 shrink-0">
						<div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
							<span>{percentOfLeader}% do líder</span>
						</div>
						<div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-border/40">
							<div
								className="h-full bg-accent/80 rounded-full transition-all duration-500"
								style={{ width: `${percentOfLeader}%` }}
							/>
						</div>
					</div>
				)}

				{/* Average Ticket */}
				{!isReferralRanking && (
					<div className="hidden lg:flex flex-col items-end w-24 shrink-0 text-right">
						<span className="text-xs uppercase text-muted-foreground font-medium">Ticket Médio</span>
						<span className="text-xs font-mono text-muted-foreground font-medium">
							{formatCurrency(avgTicket)}
						</span>
					</div>
				)}

				{/* Revenue (PRIMARY VISUAL ELEMENT) */}
				<div className="flex flex-col items-end w-32 shrink-0 text-right">
					{isReferralRanking ? (
						<div className="flex flex-col items-end">
							<span className="text-sm font-mono font-bold text-foreground">
								{formatReferralCountLabel(entry.totalReferrals)}
							</span>
							<AnimatedCurrency value={entry.totalCommission} className="text-xs font-mono text-muted-foreground" />
						</div>
					) : (
						<AnimatedCurrency
							value={entry.volume}
							className="text-sm font-mono font-bold text-foreground tracking-tight"
						/>
					)}
				</div>
			</div>
		</UserProfilePopover>
	);
}
