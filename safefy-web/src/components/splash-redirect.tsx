'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SplashRedirect() {
	const router = useRouter();

	useEffect(() => {
		const redirect = async () => {
			try {
				const response = await fetch('/api/auth/session');
				
				if (response.ok) {
					const data = await response.json();
					
					if (data.authenticated) {
						router.replace('/panel/dashboard');
					} else {
						router.replace('/');
					}
				} else {
					router.replace('/');
				}
			} catch (error) {
				console.error('[SplashRedirect] Error checking session:', error);
				router.replace('/');
			}
		};

		const timer = setTimeout(redirect, 500);

		return () => clearTimeout(timer);
	}, [router]);

	return null;
}

