'use client';

import { Chip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AvatarUser } from '@/components/ui/avatar-user';
import { Award05Icon } from '@hugeicons/core-free-icons';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { UserProfilePopover } from './user-profile-popover';
import { SocialIcons } from './social-icons';
import { PositionChange } from './position-change';
import { formatReferralCountLabel, getPodiumColors, parseSocialLinks } from './utils';
import type { RankingEntry, RankingType } from '@/types/ranking';

interface PodiumSlotProps {
	entry: RankingEntry;
	type: RankingType;
	size: 'large' | 'small';
	isCurrentUser?: boolean;
	animationDelay?: string;
}

export function PodiumSlot({ entry, type, size, isCurrentUser, animationDelay = '0ms' }: PodiumSlotProps) {
	const { text: textClass, stepBg, stepBorder } = getPodiumColors(entry.position);
	const isReferralRanking = type === 'Referral';
	const rankLabel = entry.position === 1 ? '1°' : entry.position === 2 ? '2°' : '3°';
	const stepHeight = size === 'large' ? 44 : 24;
	const avatarSize = size === 'large' ? 'lg' : 'md';
	const displayName = entry.userPublicProfile?.name ?? entry.userName ?? 'Usuário';
	const displayProfileImageUrl = entry.userPublicProfile?.profileImageUrl ?? entry.profileImageUrl ?? null;
	const displayBorderImageUrl = entry.userPublicProfile?.selectedBorderImageUrl ?? null;
	const socialLinks = parseSocialLinks(entry.userPublicProfile?.socialLinks ?? null);

	return (
		<div className="flex flex-col items-center gap-1.5 w-24 md:w-32">
			<div className="flex items-center gap-1">
				{entry.position === 1 && <Icon icon={Award05Icon} className={`icon-xs ${textClass}`} />}
				<span className={`text-xs font-bold ${textClass}`}>{rankLabel}</span>
			</div>

			<UserProfilePopover userId={entry.userId} userPublicProfile={entry.userPublicProfile} placement="top">
				<div
					className="flex flex-col items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
					aria-label={`Ver perfil de ${displayName}`}
				>
					<AvatarUser
						name={displayName}
						profileImageUrl={displayProfileImageUrl}
						borderImageUrl={displayBorderImageUrl}
						size={avatarSize}
					/>

					<div className="flex flex-col items-center gap-0.5 text-center w-full">
						<p
							className={[
								size === 'large' ? 'text-sm font-bold' : 'text-xs font-semibold',
								'text-foreground w-full truncate leading-tight',
							].join(' ')}
						>
							{displayName}
						</p>
						<SocialIcons links={socialLinks} />
						{isCurrentUser && (
							<Chip size="sm" variant="soft" color="accent" className="text-xs">
								Você
							</Chip>
						)}
					</div>
				</div>
			</UserProfilePopover>

			{isReferralRanking ? (
				<div className="flex flex-col items-center gap-0.5">
					<span className={[size === 'large' ? 'text-sm' : 'text-xs', 'font-extrabold tabular-nums', textClass].join(' ')}>
						{formatReferralCountLabel(entry.totalReferrals)}
					</span>
					<AnimatedCurrency value={entry.totalCommission} className="text-xs font-semibold tabular-nums text-muted" />
					<PositionChange change={entry.positionChange} previousPosition={entry.previousPosition} />
				</div>
			) : (
				<div className="flex flex-col items-center gap-0.5">
					<AnimatedCurrency
						value={entry.volume}
						className={[
							size === 'large' ? 'text-sm' : 'text-xs',
							'font-extrabold tabular-nums',
							textClass,
						].join(' ')}
					/>
					<PositionChange change={entry.positionChange} previousPosition={entry.previousPosition} />
				</div>
			)}

			<div
				className="w-full rounded-t-lg ranking-podium-bar"
				style={{ height: stepHeight, backgroundColor: stepBg, borderTop: `2px solid ${stepBorder}`, animationDelay }}
			/>
		</div>
	);
}
