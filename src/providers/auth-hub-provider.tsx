'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignalR } from '@/contexts/signalr-context';
import { SignalRMethods } from '@/lib/signalr/methods';
import type { DeviceRevokedData } from '@/lib/signalr/types';
import { UserStatus } from '@/types/enums';
import type { UserInfo } from '@/types/auth';
import { signOut } from '@/app/actions/auth';
import { clearAuthCookies, setStatusModal, setDeviceRevokedModal, setUserForStatusModal } from '@/auth/session';
import { Routes } from '@/router/routes';


interface AuthHubProviderProps {
	children: ReactNode;
}

export function AuthHubProvider({ children }: AuthHubProviderProps) {
	const router = useRouter();
	const { subscribe } = useSignalR();

	const handleUserStatusChanged = useCallback(async (user: UserInfo) => {
		if (user.status !== UserStatus.Active) {
			await setUserForStatusModal({
				status: user.status,
				suspendedReason: user.suspendedReason,
				inactiveReason: user.inactiveReason,
			});
			await setStatusModal();
			
			
			await signOut();
			await clearAuthCookies();
			
			router.push(Routes.home);
		}
	}, [router]);

	const handleDeviceRevoked = useCallback(async (data: DeviceRevokedData) => {
		await setDeviceRevokedModal(data.deviceName, data.reason);
		
		
		await clearAuthCookies();
		
		router.push(Routes.home);
	}, [router]);

	useEffect(() => {
		const unsub1 = subscribe(SignalRMethods.UserStatusChanged, handleUserStatusChanged);
		const unsub2 = subscribe(SignalRMethods.DeviceRevoked, handleDeviceRevoked);
		return () => { unsub1(); unsub2(); };
	}, [subscribe, handleUserStatusChanged, handleDeviceRevoked]);

	return <>{children}</>;
}

