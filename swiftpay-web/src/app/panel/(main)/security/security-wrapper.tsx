'use client';

import { use, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SecurityContent } from './security-content';
import type { TrustedDeviceData } from '@/types/auth';
import type { ApiResponse } from '@/types/common';

type DevicesPromise = Promise<ApiResponse<{ devices: TrustedDeviceData[] }>>;

interface SecurityWrapperProps {
	fetchPromise: DevicesPromise;
}

export function SecurityWrapper({ fetchPromise }: SecurityWrapperProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const response = use(fetchPromise);
	const devices = response?.data?.devices ?? [];

	function handleRefresh() {
		startTransition(() => {
			router.refresh();
		});
	}

	return <SecurityContent devices={devices} onRefresh={handleRefresh} isRefreshing={isPending} />;
}

