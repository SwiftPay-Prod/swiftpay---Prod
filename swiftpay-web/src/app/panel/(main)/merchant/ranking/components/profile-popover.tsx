'use client';

import { use } from 'react';
import Image from 'next/image';
import { Skeleton, Separator, Tooltip } from '@heroui/react';
import { UserProfileProgressCard } from '@/components/user/user-profile-progress-card';
import { InstagramFillIcon, XFillIcon, TikTokFillIcon } from './brand-icons';
import { parseSocialLinks } from './utils';
import type { ApiResponse } from '@/types/common';
import type { UserPublicProfile, PublicProfileEmblem } from '@/types/user';

type PublicProfilePromise = Promise<ApiResponse<UserPublicProfile>>;

interface ProfilePopoverContentProps {
	profilePromise: PublicProfilePromise;
	onEmblemClick?: (emblem: PublicProfileEmblem) => void;
}

export function ProfilePopoverSkeleton() {
	return (
		<div className="flex flex-col gap-3 p-2 w-72">
			<div className="flex items-center gap-3">
				<Skeleton className="w-10 h-10 rounded-full shrink-0" />
				<div className="flex flex-col gap-1.5 flex-1">
					<Skeleton className="h-4 w-28 rounded" />
					<Skeleton className="h-3 w-36 rounded" />
				</div>
			</div>
		</div>
	);
}

export function ProfilePopoverContent({ profilePromise, onEmblemClick }: ProfilePopoverContentProps) {
	const response = use(profilePromise);
	const profile = response?.data;

	if (!profile) return <p className="text-sm text-muted p-3">Perfil não encontrado.</p>;

	const socialLinks = parseSocialLinks(profile.socialLinks);
	const visibleInstagram = socialLinks.instagram && socialLinks.visibility?.instagram !== false;
	const visibleX = socialLinks.x && socialLinks.visibility?.x !== false;
	const visibleTiktok = socialLinks.tiktok && socialLinks.visibility?.tiktok !== false;
	const hasSocialLinks = !!(visibleInstagram || visibleX || visibleTiktok);
	const hasEmblems = profile.selectedEmblems.length > 0;

	return (
		<div className="flex flex-col w-72">
			<UserProfileProgressCard
				name={profile.name}
				profileImageUrl={profile.profileImageUrl}
				borderImageUrl={profile.selectedBorderImageUrl}
				bannerImageUrl={profile.bannerImageUrl}
				level={profile.levelInfo?.current ?? null}
				nextLevel={profile.levelInfo?.nextLevel ?? null}
				nextLevelLabel={profile.levelInfo?.nextLevelDisplayName ?? null}
				totalVolume={profile.levelInfo?.totalVolume ?? null}
				maxThreshold={profile.levelInfo?.maxThreshold ?? null}
				progress={profile.levelInfo?.progress ?? null}
				earnedCount={profile.earnedCount ?? null}
				totalAchievements={profile.totalAchievements ?? null}
				compact
			/>

			{/* Bio */}
			{profile.bio && (
				<>
					<Separator />
					<div className="px-2 py-1.5">
						<p className="text-xs text-muted line-clamp-3">{profile.bio}</p>
					</div>
				</>
			)}

			{/* Emblemas */}
			{hasEmblems && (
				<>
					<Separator />
					<div className="px-2 py-1.5 flex flex-col gap-1.5">
						<span className="text-xs font-medium text-muted uppercase tracking-wide">Emblemas</span>
						<div className="flex flex-wrap gap-1.5">
							{profile.selectedEmblems.map((emblem) => (
								<Tooltip key={emblem.id}>
									<button
										type="button"
										onClick={() => onEmblemClick?.(emblem)}
										className="relative w-8 h-8 rounded p-0.5 shrink-0 hover:bg-surface transition-colors cursor-pointer"
									>
										<Image
											src={emblem.imageUrl}
											alt={emblem.title}
											fill
											className="object-contain"
											unoptimized
										/>
									</button>
									<Tooltip.Content>{emblem.title}</Tooltip.Content>
								</Tooltip>
							))}
						</div>
					</div>
				</>
			)}

			{/* Redes Sociais */}
			{hasSocialLinks && (
				<>
					<Separator />
					<div className="flex flex-col px-1 py-1">
						{visibleInstagram && (
							<a
								href={`https://instagram.com/${socialLinks.instagram!.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface hover:text-pink-400 transition-colors"
							>
								<InstagramFillIcon className="icon-sm shrink-0 text-pink-400" />
								<span className="truncate">@{socialLinks.instagram!.replace('@', '')}</span>
							</a>
						)}
						{visibleX && (
							<a
								href={`https://x.com/${socialLinks.x!.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface hover:text-foreground transition-colors"
							>
								<XFillIcon className="icon-sm shrink-0" />
								<span className="truncate">@{socialLinks.x!.replace('@', '')}</span>
							</a>
						)}
						{visibleTiktok && (
							<a
								href={`https://tiktok.com/@${socialLinks.tiktok!.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface hover:text-foreground transition-colors"
							>
								<TikTokFillIcon className="icon-sm shrink-0" />
								<span className="truncate">@{socialLinks.tiktok!.replace('@', '')}</span>
							</a>
						)}
					</div>
				</>
			)}
		</div>
	);
}
