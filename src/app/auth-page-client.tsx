'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LandingPage } from '@/components/landing/landing-page';
import type { AuthModalMode } from '@/components/landing/auth-modal';

function AuthPageContent() {
	const searchParams = useSearchParams();
	const authParam = searchParams.get('auth') || searchParams.get('mode');

	let initialMode: AuthModalMode = null;
	if (authParam === 'signin' || authParam === 'login') {
		initialMode = 'signin';
	} else if (authParam === 'signup' || authParam === 'register') {
		initialMode = 'signup';
	} else if (authParam === 'forgot-password') {
		initialMode = 'forgot-password';
	} else if (authParam === 'reset-password') {
		initialMode = 'reset-password';
	}

	return <LandingPage initialAuthMode={initialMode} />;
}

export function AuthPageClient() {
	return (
		<Suspense fallback={<LandingPage initialAuthMode={null} />}>
			<AuthPageContent />
		</Suspense>
	);
}
