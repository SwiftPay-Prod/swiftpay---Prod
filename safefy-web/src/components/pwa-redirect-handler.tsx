'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PWARedirectHandler() {
	const pathname = usePathname();

	useEffect(() => {
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
		const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
		const isIOSPWA = isIOS && (isStandalone || isDisplayModeStandalone);

		if (isIOSPWA) {
			console.log('[PWA] iOS PWA detected, current path:', pathname);
		}
	}, [pathname]);

	return null;
}

