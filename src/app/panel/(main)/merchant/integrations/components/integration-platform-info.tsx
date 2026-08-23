'use client';

import { useState } from 'react';
import { Avatar, Button } from '@heroui/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface IntegrationPlatformInfoProps {
	name: string;
	subtitle: string;
	imageUrl: string | null;
	isActive: boolean;
	websiteUrl?: string | null;
}

interface IntegrationPlatformAvatarProps {
	name: string;
	imageUrl: string | null;
	isActive: boolean;
}

function IntegrationPlatformAvatar({ name, imageUrl, isActive }: IntegrationPlatformAvatarProps) {
	const [isImageLoaded, setIsImageLoaded] = useState(!imageUrl);

	if (!imageUrl) {
		return (
			<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-deep text-sm font-semibold text-foreground">
				{name.charAt(0)}
			</div>
		);
	}

	return (
		<Avatar size="lg" className="relative overflow-hidden bg-surface-deep">
			{!isImageLoaded ? <div className="absolute inset-0 animate-pulse bg-content3/50" /> : null}
			<Avatar.Image
				src={imageUrl}
				alt={`Logo da ${name}`}
				onLoad={() => setIsImageLoaded(true)}
				onError={() => setIsImageLoaded(true)}
				className={`${isActive ? '' : 'grayscale'} transition-opacity duration-300 ${
					isImageLoaded ? 'opacity-100' : 'opacity-0'
				}`}
			/>
			<Avatar.Fallback>{name.charAt(0)}</Avatar.Fallback>
		</Avatar>
	);
}

export function IntegrationPlatformInfo({
	name,
	subtitle,
	imageUrl,
	isActive,
	websiteUrl,
}: IntegrationPlatformInfoProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="relative">
				<IntegrationPlatformAvatar key={imageUrl ?? 'no-image'} name={name} imageUrl={imageUrl} isActive={isActive} />
				<span
					className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-background ${isActive ? 'bg-success' : 'bg-muted'}`}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">{name}</span>
					{websiteUrl ? (
						<Button
							size="sm"
							variant="ghost"
							onPress={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')}
						>
							<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
							Site
						</Button>
					) : null}
				</div>
				<p className="text-sm text-muted">{subtitle}</p>
			</div>
		</div>
	);
}
