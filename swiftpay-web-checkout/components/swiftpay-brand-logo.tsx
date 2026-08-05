import * as React from 'react';
import Image from 'next/image';

interface SwiftPayBrandLogoProps {
	className?: string;
	iconClassName?: string;
	textClassName?: string;
	iconSize?: number;
	showText?: boolean;
	priority?: boolean;
}

export function SwiftPayBrandLogo({
	className = '',
	iconClassName = '',
	textClassName = '',
	iconSize = 34,
	showText = false,
	priority = true,
}: SwiftPayBrandLogoProps) {
	return (
		<div className={`inline-flex items-center gap-3 select-none ${className}`}>
			<div
				className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 ${iconClassName}`}
				style={{ width: iconSize, height: iconSize }}
			>
				<Image
					src="/swiftpay-obsidian-logo.png"
					alt="SwiftPay"
					width={512}
					height={512}
					priority={priority}
					unoptimized
					className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(163,230,53,0.3)]"
				/>
			</div>

			{showText && (
				<span className={`font-extrabold tracking-tight text-foreground text-xl ${textClassName}`}>
					Swift<span className="text-brand">Pay</span>
				</span>
			)}
		</div>
	);
}
