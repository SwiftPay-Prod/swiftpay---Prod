'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

interface MerchantNewStatusRedirectProps {
	to?: string;
}

export function MerchantNewStatusRedirect({ to = Routes.panel.merchant.dashboard }: MerchantNewStatusRedirectProps) {
	const router = useRouter();

	useEffect(() => {
		router.replace(to);
	}, [router, to]);

	return null;
}
