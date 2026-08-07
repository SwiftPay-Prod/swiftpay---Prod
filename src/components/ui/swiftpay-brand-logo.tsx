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
	iconSize = 40,
	showText = false,
	priority = true,
}: SwiftPayBrandLogoProps) {
	return (
		<div className={`inline-flex items-center gap-3 select-none ${className}`}>
			<div
				className={`relative flex items-center justify-center shrink-0 transition-all duration-300 ease-out hover:scale-105 ${iconClassName}`}
				style={{ width: iconSize, height: iconSize }}
			>
				<div className="absolute inset-0 rounded-xl bg-brand/0 transition-colors duration-300 ease-out group-hover:bg-brand/10" />
				<Image
					src="/swiftpay-obsidian-logo.png"
					alt="SwiftPay"
					width={512}
					height={512}
					priority={priority}
					className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
				/>
			</div>

			{showText && (
<span className={`font-bold tracking-tight text-foreground text-xl ${textClassName}`}>
					Swift<span className="text-brand">Pay</span>
				</span>
			)}
		</div>
	);
}
