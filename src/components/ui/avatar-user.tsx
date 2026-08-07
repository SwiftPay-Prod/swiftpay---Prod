'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AvatarUserProps {
	name?: string | null;
	profileImageUrl?: string | null;
	borderImageUrl?: string | null;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	className?: string;
}

const sizeClasses: Record<NonNullable<AvatarUserProps['size']>, string> = {
	xs: 'w-8 h-8',
	sm: 'w-10 h-10',
	md: 'w-12 h-12',
	lg: 'w-16 h-16',
	xl: 'w-20 h-20',
	'2xl': 'w-26 h-26',
};

const borderTransform: Record<NonNullable<AvatarUserProps['size']>, string> = {
	xs: 'scale-180 -top-1!',
	sm: 'scale-180 -top-1.5!',
	md: 'scale-180 -top-2.5!',
	lg: 'scale-180 -top-3.5!',
	xl: 'scale-180 -top-4!',
	'2xl': 'scale-180 -top-5.5!',
};

const borderMarginClasses: Record<NonNullable<AvatarUserProps['size']>, string> = {
	xs: 'mx-1.5 my-1.5',
	sm: 'mx-2 my-2',
	md: 'mx-2.5 my-2.5',
	lg: 'mx-3.5 my-3.5',
	xl: 'mx-4.5 my-4.5',
	'2xl': 'mx-6 my-6',
};

const initialsTextSize: Record<NonNullable<AvatarUserProps['size']>, string> = {
	xs: 'text-[8px]',
	sm: 'text-xs',
	md: 'text-xs',
	lg: 'text-sm',
	xl: 'text-base',
	'2xl': 'text-lg',
};

function getInitials(name: string | null | undefined): string {
	if (!name) return 'U';
	return name
		.split(' ')
		.filter(Boolean)
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

export function AvatarUser({ name, profileImageUrl, borderImageUrl, size = 'md', className }: AvatarUserProps) {
	const [borderErrorUrl, setBorderErrorUrl] = useState<string | null>(null);
	const showBorder = !!borderImageUrl && borderImageUrl !== borderErrorUrl;

	return (
		<div
			className={[
				'relative shrink-0',
				sizeClasses[size],
				borderMarginClasses[size],
				className,
			]
				.filter(Boolean)
				.join(' ')}
		>
			<div className="absolute inset-0 rounded-full overflow-hidden">
				{profileImageUrl ? (
					<Image
						src={profileImageUrl}
						alt={name ?? 'Avatar'}
						fill
						className="object-cover"
						unoptimized={profileImageUrl.toLowerCase().endsWith('.gif')}
					/>
				) : (
					<div className="w-full h-full bg-accent/10 flex items-center justify-center">
						<span className={`font-semibold text-accent select-none ${initialsTextSize[size]}`}>
							{getInitials(name)}
						</span>
					</div>
				)}
			</div>

			{showBorder && (
				<div className="absolute inset-0 z-10 pointer-events-none">
					<Image
						src={borderImageUrl}
						alt=""
						fill
						className={`object-contain ${borderTransform[size]}`}
						unoptimized
						onError={() => setBorderErrorUrl(borderImageUrl)}
					/>
				</div>
			)}
		</div>
	);
}
