'use client';

import { useCallback, useEffect, useState } from 'react';
import { registerPushToken, unregisterPushToken } from '@/app/actions/user';
import { BaseLocalStorage } from '@/constants/base';
import { getFCMToken, isIOSPWA, isPushNotificationSupported } from '@/lib/firebase';

interface PushNotificationState {
	isSupported: boolean;
	isEnabled: boolean;
	isLoading: boolean;
	permission: NotificationPermission;
	isIOSBrowser: boolean;
	isIOSPWA: boolean;
	lastError: string | null;
}

const initialState: PushNotificationState = {
	isSupported: false,
	isEnabled: false,
	isLoading: false,
	permission: 'default',
	isIOSBrowser: false,
	isIOSPWA: false,
	lastError: null,
};

function getDeviceName(): string {
	return navigator.userAgent.slice(0, 200);
}

export function usePushNotifications() {
	const [state, setState] = useState<PushNotificationState>(initialState);

	useEffect(() => {
		const isSupported = isPushNotificationSupported();
		const iosPwa = isIOSPWA();
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		const permission = isSupported ? Notification.permission : 'default';
		const storedToken = window.localStorage.getItem(BaseLocalStorage.fcmToken);
		const locallyEnabled = window.localStorage.getItem(BaseLocalStorage.pushEnabled) === 'true';

		setState((current) => ({
			...current,
			isSupported,
			isEnabled: Boolean(isSupported && permission === 'granted' && storedToken && locallyEnabled),
			permission,
			isIOSBrowser: isIOS && !iosPwa,
			isIOSPWA: iosPwa,
		}));

		if (isSupported && permission === 'granted' && storedToken && locallyEnabled) {
			void registerPushToken({ token: storedToken, platform: 'web', deviceName: getDeviceName() }).then(
				(response) => {
					if (response?.error) {
						setState((current) => ({ ...current, lastError: response.error?.message ?? 'Falha ao registrar notificações.' }));
					}
				}
			);
		}
	}, []);

	const enablePushNotifications = useCallback(async (): Promise<boolean> => {
		setState((current) => ({ ...current, isLoading: true, lastError: null }));

		try {
			const result = await getFCMToken();
			const permission = Notification.permission;
			if (!result.token || result.error) {
				throw new Error(result.error ?? 'Firebase não retornou um token de notificação.');
			}

			const response = await registerPushToken({
				token: result.token,
				platform: 'web',
				deviceName: getDeviceName(),
			});
			if (response?.error) {
				throw new Error(response.error.message ?? 'Não foi possível registrar as notificações.');
			}

			window.localStorage.setItem(BaseLocalStorage.fcmToken, result.token);
			window.localStorage.setItem(BaseLocalStorage.pushEnabled, 'true');
			setState((current) => ({
				...current,
				isEnabled: true,
				isLoading: false,
				permission,
				lastError: null,
			}));
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Não foi possível ativar as notificações.';
			setState((current) => ({
				...current,
				isEnabled: false,
				isLoading: false,
				permission: 'Notification' in window ? Notification.permission : 'default',
				lastError: message,
			}));
			return false;
		}
	}, []);

	const disablePushNotifications = useCallback(async (): Promise<boolean> => {
		setState((current) => ({ ...current, isLoading: true, lastError: null }));

		try {
			const token = window.localStorage.getItem(BaseLocalStorage.fcmToken);
			if (token) {
				const response = await unregisterPushToken({ token });
				if (response?.error) {
					throw new Error(response.error.message ?? 'Não foi possível desativar as notificações.');
				}
			}

			window.localStorage.removeItem(BaseLocalStorage.fcmToken);
			window.localStorage.setItem(BaseLocalStorage.pushEnabled, 'false');
			setState((current) => ({ ...current, isEnabled: false, isLoading: false, lastError: null }));
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Não foi possível desativar as notificações.';
			setState((current) => ({ ...current, isLoading: false, lastError: message }));
			return false;
		}
	}, []);

	return {
		...state,
		enablePushNotifications,
		disablePushNotifications,
	};
}
