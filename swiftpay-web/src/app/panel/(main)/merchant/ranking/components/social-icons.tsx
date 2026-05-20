'use client';

import { Tooltip } from '@heroui/react';
import { InstagramFillIcon, XFillIcon, TikTokFillIcon } from './brand-icons';
import type { UserSocialLinks } from '@/types/user';

export function SocialIcons({ links }: { links: UserSocialLinks }) {
	const visibleInstagram = links.instagram && links.visibility?.instagram !== false;
	const visibleX = links.x && links.visibility?.x !== false;
	const visibleTiktok = links.tiktok && links.visibility?.tiktok !== false;

	if (!visibleInstagram && !visibleX && !visibleTiktok) return null;

	return (
		<div className="flex items-center gap-1">
			{visibleInstagram && (
				<Tooltip>
					<Tooltip.Trigger>
						<a
							href={`https://instagram.com/${links.instagram!.replace('@', '')}`}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="text-muted hover:text-pink-400 transition-colors"
						>
							<InstagramFillIcon className="icon-xs" />
						</a>
					</Tooltip.Trigger>
					<Tooltip.Content>@{links.instagram!.replace('@', '')} no Instagram</Tooltip.Content>
				</Tooltip>
			)}
			{visibleX && (
				<Tooltip>
					<Tooltip.Trigger>
						<a
							href={`https://x.com/${links.x!.replace('@', '')}`}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="text-muted hover:text-foreground transition-colors"
						>
							<XFillIcon className="icon-xs" />
						</a>
					</Tooltip.Trigger>
					<Tooltip.Content>@{links.x!.replace('@', '')} no X</Tooltip.Content>
				</Tooltip>
			)}
			{visibleTiktok && (
				<Tooltip>
					<Tooltip.Trigger>
						<a
							href={`https://tiktok.com/@${links.tiktok!.replace('@', '')}`}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="text-muted hover:text-foreground transition-colors"
						>
							<TikTokFillIcon className="icon-xs" />
						</a>
					</Tooltip.Trigger>
					<Tooltip.Content>@{links.tiktok!.replace('@', '')} no TikTok</Tooltip.Content>
				</Tooltip>
			)}
		</div>
	);
}
