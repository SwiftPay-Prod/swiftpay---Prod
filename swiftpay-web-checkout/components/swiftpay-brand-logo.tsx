"use client";

import Image from 'next/image';
import { useSyncExternalStore } from 'react';

interface SwiftPayBrandLogoProps {
	className?: string;
	textClassName?: string;
	iconSize?: number;
	variant?: 'light' | 'dark' | 'auto';
	priority?: boolean;
}

function joinClasses(...classes: Array<string | undefined>) {
	return classes.filter(Boolean).join(' ');
}

export function SwiftPayBrandLogo({
	className,
	textClassName,
	iconSize = 32,
	variant = 'auto',
	priority = false,
}: SwiftPayBrandLogoProps) {
	const theme = useSyncExternalStore<'light' | 'dark'>(subscribeToThemeChange, getThemeSnapshot, () => 'dark');
	const resolvedVariant = variant === 'auto' ? (theme === 'dark' ? 'light' : 'dark') : variant;
	const logoSrc = resolvedVariant === 'dark' ? '/swiftpay-horizontal-light.png' : '/swiftpay-horizontal-dark.png';
	const logoWidth = Math.max(96, Math.round(iconSize * 3.3));

	return (
		<div className={joinClasses('inline-flex items-center justify-center', className)}>
			<Image
				src={logoSrc}
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

function getThemeSnapshot(): 'light' | 'dark' {
	if (typeof window === 'undefined') {
		return 'dark';
	}

	const currentTheme = document.documentElement.getAttribute('data-theme');
	if (currentTheme === 'light' || currentTheme === 'dark') {
		return currentTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeToThemeChange(onStoreChange: () => void): () => void {
	if (typeof window === 'undefined') {
		return () => undefined;
	}

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const observer = new MutationObserver(onStoreChange);

	mediaQuery.addEventListener('change', onStoreChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});

	return () => {
		mediaQuery.removeEventListener('change', onStoreChange);
		observer.disconnect();
	};
}
