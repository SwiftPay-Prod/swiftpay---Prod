import Image from 'next/image';

interface SwiftPayBrandLogoProps {
	className?: string;
	textClassName?: string;
	iconSize?: number;
	priority?: boolean;
}

function joinClasses(...classes: Array<string | undefined>) {
	return classes.filter(Boolean).join(' ');
}

export function SwiftPayBrandLogo({
	className,
	textClassName,
	iconSize = 32,
	priority = false,
}: SwiftPayBrandLogoProps) {
	const logoWidth = Math.max(48, Math.round(iconSize * 1.2));

	return (
		<div className={joinClasses('inline-flex items-center justify-center', className)}>
			<Image
				src="/swiftpay-horizontal-dark.png"
				alt="SwiftPay"
				width={logoWidth}
				height={iconSize}
				className={joinClasses('h-auto w-auto object-contain', textClassName)}
				sizes={`${logoWidth}px`}
				priority={priority}
			/>
		</div>
	);
}
