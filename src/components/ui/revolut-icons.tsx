import React from 'react';

export interface RevolutIconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string;
	className?: string;
}

export function RevolutWalletIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<rect x="2" y="5" width="20" height="14" rx="4" />
			<path d="M2 10h20" />
			<circle cx="16.5" cy="14.5" r="1" fill="currentColor" />
		</svg>
	);
}

export function RevolutArrowUpRightIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M7 17L17 7" />
			<path d="M7 7h10v10" />
		</svg>
	);
}

export function RevolutArrowDownRightIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M7 7l10 10" />
			<path d="M17 7v10H7" />
		</svg>
	);
}

export function RevolutPlusIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</svg>
	);
}

export function RevolutStatementIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
			<line x1="10" y1="9" x2="8" y2="9" />
		</svg>
	);
}

export function RevolutAnalyticsIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M3 3v18h18" />
			<path d="M18 17V9" />
			<path d="M13 17V5" />
			<path d="M8 17v-3" />
		</svg>
	);
}

export function RevolutCheckIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<circle cx="12" cy="12" r="9" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

export function RevolutAlertIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<circle cx="12" cy="12" r="9" />
			<line x1="12" y1="8" x2="12" y2="12" />
			<line x1="12" y1="16" x2="12.01" y2="16" />
		</svg>
	);
}

export function RevolutRefundIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
			<path d="M12 7v5l3 3" />
		</svg>
	);
}

export function RevolutPixIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M9.5 4.5L4.5 9.5a3.5 3.5 0 0 0 0 5l5 5a3.5 3.5 0 0 0 5 0l5-5a3.5 3.5 0 0 0 0-5l-5-5a3.5 3.5 0 0 0-5 0z" />
			<path d="M9 12h6" />
			<path d="M12 9v6" />
		</svg>
	);
}

export function RevolutLockIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<rect x="3" y="11" width="18" height="11" rx="3" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
			<circle cx="12" cy="16" r="1" fill="currentColor" />
		</svg>
	);
}

export function RevolutRefreshIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
			<path d="M21 3v5h-5" />
		</svg>
	);
}

export function RevolutEyeIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function RevolutEyeOffIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
			<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
			<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
			<line x1="2" y1="2" x2="22" y2="22" />
		</svg>
	);
}

export function RevolutInfoIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<circle cx="12" cy="12" r="9" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	);
}

export function RevolutTrendingUpIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
			<polyline points="17 6 23 6 23 12" />
		</svg>
	);
}

export function RevolutTrendingDownIcon({ size = 20, className = '', ...props }: RevolutIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
			<polyline points="17 18 23 18 23 12" />
		</svg>
	);
}

export interface RevolutIconBadgeProps {
	icon: React.ComponentType<RevolutIconProps>;
	variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'subtle';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export function RevolutIconBadge({
	icon: IconComponent,
	variant = 'default',
	size = 'md',
	className = '',
}: RevolutIconBadgeProps) {
	const sizeMap = {
		sm: 'h-8 w-8 rounded-xl',
		md: 'h-10 w-10 rounded-2xl',
		lg: 'h-12 w-12 rounded-[18px]',
	};

	const iconSizeMap = {
		sm: 16,
		md: 20,
		lg: 24,
	};

	const variantMap = {
		default: 'bg-white/5 text-white/90',
		primary: 'bg-brand/15 text-link',
		success: 'bg-success/15 text-success',
		danger: 'bg-danger/15 text-danger',
		warning: 'bg-warning/15 text-warning',
		neutral: 'bg-white/10 text-white',
		subtle: 'bg-white/[0.03] text-white/60',
	};

	return (
		<div
			className={`inline-flex items-center justify-center shrink-0 transition-colors ${sizeMap[size]} ${variantMap[variant]} ${className}`}
		>
			<IconComponent size={iconSizeMap[size]} />
		</div>
	);
}
