'use client';

import Image from 'next/image';
import { SwiftPayBrandLogo } from '@/components/swiftpay-brand-logo';

interface ThemeLogoProps {
	logoUrl?: string | null;
}

export function ThemeLogo({ logoUrl }: ThemeLogoProps) {
	if (logoUrl) {
		return (
			<div className="inline-flex items-center justify-center">
				<Image
					src={logoUrl}
					alt="Logo"
					width={160}
					height={48}
					className="h-12 w-auto max-w-52 object-contain"
					unoptimized
					priority
				/>
			</div>
		);
	}

	return <SwiftPayBrandLogo iconSize={32} priority />;
}
