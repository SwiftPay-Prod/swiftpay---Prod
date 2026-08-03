'use client';

import { SwiftPayBrandLogo } from '@/components/swiftpay-brand-logo';
import Image from 'next/image';

interface HeaderProps {
	primaryColor: string;
	secondaryColor: string | null;
	logoUrl: string | null;
	bannerUrl: string | null;
	headerMessage: string | null;
	subHeaderMessage: string | null;
}

export function Header({ primaryColor, secondaryColor, logoUrl, bannerUrl, headerMessage, subHeaderMessage }: HeaderProps) {
	const gradientStyle = secondaryColor ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : primaryColor;
	const textureUrl = 'https://www.transparenttextures.com/patterns/carbon-fibre.png';

	const headerStyle = bannerUrl
		? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: { background: gradientStyle };

	return (
		<header className="h-36">
			<div className="relative -z-1 border-b border-black/10 h-52" style={headerStyle}>
				{!bannerUrl && (
					<div
						className="absolute inset-0 opacity-10"
						style={{ backgroundImage: `url(${textureUrl})`, backgroundRepeat: 'repeat' }}
					/>
				)}
				{bannerUrl && <div className="absolute inset-0 bg-black/40" />}
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="relative flex items-center justify-between">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							{logoUrl ? (
								<div className="w-15 h-15 rounded-xl overflow-hidden shadow-lg shrink-0">
									<Image
										src={logoUrl}
										alt="Logo"
										width={40}
										height={40}
										className="w-full h-full object-contain"
										unoptimized
									/>
								</div>
							) : (
									<SwiftPayBrandLogo className="shrink-0" iconSize={40} priority />
							)}
							<div className="min-w-0 flex-1">
								<h1 className="text-3xl font-extrabold italic text-white truncate">{headerMessage || 'CHECKOUT SEGURO'}</h1>
								<p className="text-xs text-white/80 truncate">{subHeaderMessage || 'Compra 100% protegida'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
