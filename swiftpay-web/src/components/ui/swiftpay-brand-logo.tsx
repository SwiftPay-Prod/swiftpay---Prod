import Image from 'next/image';

interface SwiftPayBrandLogoProps {
	className?: string;
	iconClassName?: string;
	textClassName?: string;
	iconSize?: number;
	priority?: boolean;
}

function joinClasses(...classes: Array<string | undefined>) {
	return classes.filter(Boolean).join(' ');
}

const LOGO_ASPECT_RATIO = 1439 / 1607;

export function SwiftPayBrandLogo({
	className,
	iconClassName,
	textClassName,
	iconSize = 32,
	priority = false,
}: SwiftPayBrandLogoProps) {
	const logoHeight = iconSize;
	const logoWidth = Math.round(logoHeight * LOGO_ASPECT_RATIO);

	return (
		<div className={joinClasses('inline-flex items-center justify-center', className)}>
			<Image
				src="/logos/swiftpay-logo.png"
				alt="SwiftPay"
				width={logoWidth}
				height={logoHeight}
				sizes={`${logoWidth}px`}
				priority={priority}
				className={joinClasses('h-auto w-auto', iconClassName, textClassName)}
			/>
		</div>
	);
}
