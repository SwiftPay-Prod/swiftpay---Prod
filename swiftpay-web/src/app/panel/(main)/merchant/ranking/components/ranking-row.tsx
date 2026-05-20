'use client';

import { Chip } from '@heroui/react';
import { AvatarUser } from '@/components/ui/avatar-user';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { UserProfilePopover } from './user-profile-popover';
import { SocialIcons } from './social-icons';
import { PositionChange } from './position-change';
import { formatReferralCountLabel, parseSocialLinks } from './utils';
import type { RankingEntry, RankingType } from '@/types/ranking';

interface RankingRowProps {
	entry: RankingEntry;
	type: RankingType;
	isCurrentUser?: boolean;
}

const TIER: Record<number, { rowCss: string; numCls: string; valCls: string }> = {
	1: { rowCss: 'ranking-row-gold', numCls: 'text-yellow-500', valCls: 'text-yellow-500' },
	2: { rowCss: 'ranking-row-silver', numCls: 'text-slate-400', valCls: 'text-slate-400' },
	3: { rowCss: 'ranking-row-bronze', numCls: 'text-orange-400', valCls: 'text-orange-400' },
};

export function RankingRow({ entry, type, isCurrentUser }: RankingRowProps) {
	const tier = TIER[entry.position] ?? null;
	const isTop10 = entry.position <= 10;
	const isReferralRanking = type === 'Referral';
	const displayName = entry.userPublicProfile?.name ?? entry.userName ?? 'Usuário';
	const displayProfileImageUrl = entry.userPublicProfile?.profileImageUrl ?? entry.profileImageUrl ?? null;
	const displayBorderImageUrl = entry.userPublicProfile?.selectedBorderImageUrl ?? null;
	const socialLinks = parseSocialLinks(entry.userPublicProfile?.socialLinks ?? null);

	return (
		<UserProfilePopover userId={entry.userId} userPublicProfile={entry.userPublicProfile} placement="top left">
			<div
				aria-label={`Ver perfil de ${displayName}`}
				className={[
					'group relative flex items-center gap-3 rounded-xl w-full cursor-pointer overflow-hidden',
					'pl-3.5 pr-3 py-2.5 transition-colors',
					tier?.rowCss ?? '',
					!tier && isTop10 && 'hover:bg-surface',
					!tier && !isTop10 && 'hover:bg-surface/60',
					isCurrentUser && !tier && 'bg-accent/5',
					isCurrentUser && 'ring-1 ring-inset ring-accent/30',
				]
					.filter(Boolean)
					.join(' ')}
			>
				{/* Left accent strip for top 4–10 */}
				{isTop10 && !tier && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-accent/50" />}

				{/* Position */}
				<div className="w-7 shrink-0 text-right">
					<span
						className={[
							'text-sm font-black tabular-nums leading-none',
							tier?.numCls ?? (isTop10 ? 'text-accent' : 'text-muted'),
						].join(' ')}
					>
						{entry.position}°
					</span>
				</div>

				{/* Avatar */}
				<AvatarUser
					name={displayName}
					profileImageUrl={displayProfileImageUrl}
					borderImageUrl={displayBorderImageUrl}
					size="sm"
				/>

				{/* Name + social */}
				<div className="flex flex-col min-w-0 flex-1 gap-0.5">
					<div className="flex items-center gap-1.5 min-w-0">
						<span
							className={['text-sm font-normal truncate leading-tight', tier?.numCls ?? 'text-foreground'].join(' ')}
						>
							{displayName}
						</span>
						{isCurrentUser && (
							<Chip size="sm" variant="soft" color="accent" className="shrink-0 text-xs">
								Você
							</Chip>
						)}
					</div>
					{Object.keys(socialLinks).length > 0 && <SocialIcons links={socialLinks} />}
				</div>

				{/* Volume + position change */}
				<div className="flex flex-col items-end gap-0.5 shrink-0">
					{isReferralRanking ? (
						<div className="flex flex-col items-end gap-0.5">
							<span
								className={[
									'text-sm font-bold tabular-nums',
									tier?.valCls ?? (isTop10 ? 'text-accent' : 'text-foreground'),
								].join(' ')}
							>
								{formatReferralCountLabel(entry.totalReferrals)}
							</span>
							<AnimatedCurrency value={entry.totalCommission} className="text-xs font-semibold tabular-nums text-muted" />
						</div>
					) : (
						<AnimatedCurrency
							value={entry.volume}
							className={[
								'text-sm font-bold tabular-nums',
								tier?.valCls ?? (isTop10 ? 'text-accent' : 'text-foreground'),
							].join(' ')}
						/>
					)}
					<PositionChange change={entry.positionChange} previousPosition={entry.previousPosition} />
				</div>
			</div>
		</UserProfilePopover>
	);
}
