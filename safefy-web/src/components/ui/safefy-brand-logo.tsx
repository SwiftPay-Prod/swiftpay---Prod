import Image from 'next/image';

interface SafefyBrandLogoProps {
	className?: string;
	iconClassName?: string;
	textClassName?: string;
	iconSize?: number;
	priority?: boolean;
}

function joinClasses(...classes: Array<string | undefined>) {
	return classes.filter(Boolean).join(' ');
}

const HORIZONTAL_LOGO_RATIO = 882 / 248;

export function SafefyBrandLogo({
	className,
	iconClassName,
	textClassName,
	iconSize = 32,
	priority = false,
}: SafefyBrandLogoProps) {
	const logoWidth = Math.round(iconSize * HORIZONTAL_LOGO_RATIO);
	const logoClassName = joinClasses('h-auto w-auto', iconClassName, textClassName);

	return (
		<div className={joinClasses('inline-flex items-center justify-center', className)}>
			<Image
				src="/logos/safefy-horizontal-light.png"
				alt="Safefy"
				width={logoWidth}
				height={iconSize}
				sizes={`${logoWidth}px`}
				priority={priority}
				className={joinClasses('block dark:hidden', logoClassName)}
			/>
			<Image
				src="/logos/safefy-horizontal-dark.png"
				alt="Safefy"
				width={logoWidth}
				height={iconSize}
				sizes={`${logoWidth}px`}
				priority={priority}
				className={joinClasses('hidden dark:block', logoClassName)}
			/>
		</div>
	);
}
