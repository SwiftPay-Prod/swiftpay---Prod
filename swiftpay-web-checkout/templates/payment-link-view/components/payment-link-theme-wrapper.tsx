'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ThemeToggle } from '@/templates/hero-pro/components/ThemeToggle';

interface PaymentLinkThemeWrapperProps {
	themeMode?: 'Light' | 'Dark' | 'Auto' | null;
	children: React.ReactNode;
}

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') {
		return 'dark';
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeToSystemTheme(onStoreChange: () => void): () => void {
	if (typeof window === 'undefined') {
		return () => undefined;
	}

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', onStoreChange);
	return () => mediaQuery.removeEventListener('change', onStoreChange);
}

export function PaymentLinkThemeWrapper({ themeMode, children }: PaymentLinkThemeWrapperProps) {
	const isAuto = !themeMode || themeMode === 'Auto';
	const forcedTheme = themeMode === 'Light' ? 'light' : themeMode === 'Dark' ? 'dark' : null;
	const systemTheme = useSyncExternalStore<'light' | 'dark'>(subscribeToSystemTheme, getSystemTheme, () => 'dark');
	const [manualTheme, setManualTheme] = useState<'light' | 'dark' | null>(null);
	const theme: 'light' | 'dark' = isAuto ? (manualTheme ?? systemTheme) : (forcedTheme ?? 'dark');
	const themeColor = theme === 'dark' ? '#0a0f1a' : '#f7f9fc';

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		document.documentElement.style.colorScheme = theme;
		document.body.style.backgroundColor = 'var(--hero-bg-page)';

		let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		const previousContent = themeColorMeta?.getAttribute('content');
		let createdByWrapper = false;
		if (!themeColorMeta) {
			themeColorMeta = document.createElement('meta');
			themeColorMeta.setAttribute('name', 'theme-color');
			themeColorMeta.setAttribute('data-owner', 'payment-link-theme-wrapper');
			document.head.appendChild(themeColorMeta);
			createdByWrapper = true;
		}
		themeColorMeta.setAttribute('content', themeColor);

		return () => {
			if (createdByWrapper) {
				if (themeColorMeta && themeColorMeta.isConnected && themeColorMeta.parentNode) {
					themeColorMeta.parentNode.removeChild(themeColorMeta);
				}
				return;
			}

			if (!themeColorMeta) {
				return;
			}

			if (previousContent == null) {
				themeColorMeta.removeAttribute('content');
				return;
			}

			themeColorMeta.setAttribute('content', previousContent);
		};
	}, [theme, themeColor]);

	return (
		<div
			data-theme={theme}
			style={{
				minHeight: '100dvh',
				backgroundColor: 'var(--hero-bg-page)',
				paddingBottom: 'env(safe-area-inset-bottom)',
			}}
		>
			{children}
			{isAuto && (
				<ThemeToggle
					theme={theme}
					onToggle={() =>
						setManualTheme((current) => {
							const baseTheme = current ?? systemTheme;
							return baseTheme === 'dark' ? 'light' : 'dark';
						})
					}
				/>
			)}
		</div>
	);
}
