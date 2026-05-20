'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { getFCMToken, onForegroundMessage, isPushNotificationSupported, isIOSPWA, isAndroidPWA } from '@/lib/firebase';
import { registerPushToken, unregisterPushToken } from '@/app/actions/user';
import { BaseLocalStorage } from '@/constants/base';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Notification03Icon } from '@hugeicons/core-free-icons';

interface PushNotificationContextValue {
	isSupported: boolean;
	isEnabled: boolean;
	isLoading: boolean;
	permission: NotificationPermission;
	isIOSPWA: boolean;
	isIOSBrowser: boolean;
	isAndroidPWA: boolean;
	isPWA: boolean;
	lastError: string | null;
	enablePushNotifications: () => Promise<boolean>;
	disablePushNotifications: () => Promise<void>;
	tryAutoEnablePush: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps {
	children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
	const [isSupported, setIsSupported] = useState(false);
	const [isEnabled, setIsEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [permission, setPermission] = useState<NotificationPermission>('default');
	const [isIOSPWAState, setIsIOSPWAState] = useState(false);
	const [isIOSBrowser, setIsIOSBrowser] = useState(false);
	const [isAndroidPWAState, setIsAndroidPWAState] = useState(false);
	const [isPWA, setIsPWA] = useState(false);
	const [lastError, setLastError] = useState<string | null>(null);
	const currentTokenRef = useRef<string | null>(null);
	const foregroundUnsubscribeRef = useRef<(() => void) | null>(null);
	const autoPromptAttemptedRef = useRef(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			const isPWAiOS = isIOSPWA();
			const isPWAAndroid = isAndroidPWA();
			const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
				(window.navigator as Navigator & { standalone?: boolean }).standalone === true;
			
			setIsIOSBrowser(isIOS && !isPWAiOS);
			setIsIOSPWAState(isPWAiOS);
			setIsAndroidPWAState(isPWAAndroid);
			setIsPWA(isStandalone || isPWAiOS || isPWAAndroid);
			
			const supported = isPushNotificationSupported();
			setIsSupported(supported);

			if ('Notification' in window) {
				setPermission(Notification.permission);
			}

			// Verificar se já tem token salvo (indica que notificações estão ativas)
			const storedToken = localStorage.getItem(BaseLocalStorage.fcmToken);
			const isEnabledStored = localStorage.getItem(BaseLocalStorage.pushEnabled) === 'true';
			
			if (storedToken && isEnabledStored) {
				currentTokenRef.current = storedToken;
				setIsEnabled(true);
			}
		}
	}, []);

	useEffect(() => {
		if (isEnabled && isSupported) {
			foregroundUnsubscribeRef.current = onForegroundMessage(() => {
				// Message handled by ForegroundNotificationListener
			});
		}

		return () => {
			if (foregroundUnsubscribeRef.current) {
				foregroundUnsubscribeRef.current();
				foregroundUnsubscribeRef.current = null;
			}
		};
	}, [isEnabled, isSupported]);

	const enablePushNotifications = useCallback(async (): Promise<boolean> => {
		if (!isSupported) {
			toast('Não suportado', {
				description: 'Notificações push não são suportadas neste dispositivo.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return false;
		}

		setIsLoading(true);
		setLastError(null);
		
		try {
			const result = await getFCMToken();

			if (result.error) {
				setLastError(result.error);
				toast('Erro ao obter token', {
					description: result.error,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				setPermission(Notification.permission);
				return false;
			}

			if (!result.token) {
				setLastError('Nenhum token retornado');
				toast('Erro de token', {
					description: 'Não foi possível obter o token de notificação.',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return false;
			}

			const response = await registerPushToken({
				token: result.token,
				platform: 'web',
				deviceName: navigator.userAgent,
				deviceId: localStorage.getItem(BaseLocalStorage.safefyDeviceId) ?? undefined,
			});

			if (response?.error) {
				setLastError(response.error.message);
				toast('Falha ao registrar', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return false;
			}

			currentTokenRef.current = result.token;
			localStorage.setItem(BaseLocalStorage.fcmToken, result.token);
			localStorage.setItem(BaseLocalStorage.pushEnabled, 'true');
			setIsEnabled(true);
			setPermission('granted');
			toast('Notificações ativadas', {
				description: 'Você receberá notificações push neste dispositivo.',
				variant: 'success',
				indicator: <Icon icon={Notification03Icon} className="icon-sm" />,
			});

			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			setLastError(errorMessage);
			toast('Erro inesperado', {
				description: errorMessage,
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [isSupported]);

	const disablePushNotifications = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		setLastError(null);
		
		try {
			const token = currentTokenRef.current;

			if (token) {
				await unregisterPushToken({ token });
			}

			currentTokenRef.current = null;
			localStorage.removeItem(BaseLocalStorage.fcmToken);
			localStorage.removeItem(BaseLocalStorage.pushEnabled);
			setIsEnabled(false);
			toast('Notificações desativadas', {
				description: 'Você não receberá mais notificações push neste dispositivo.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			setLastError(errorMessage);
			toast('Erro ao desativar', {
				description: errorMessage,
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Tenta ativar push automaticamente para PWA (apenas uma vez)
	const tryAutoEnablePush = useCallback(async (): Promise<void> => {
		// Evita múltiplas tentativas na mesma sessão
		if (autoPromptAttemptedRef.current) return;
		autoPromptAttemptedRef.current = true;

		// Verifica se já tentou antes (persistido)
		const alreadyPrompted = localStorage.getItem(BaseLocalStorage.pushAutoPrompted);
		if (alreadyPrompted === 'true') return;

		// Só tenta se for PWA, suportado, não está habilitado e permissão não negada
		if (!isPWA || !isSupported || isEnabled || permission === 'denied') {
			return;
		}

		// Marca que já tentou para não tentar novamente
		localStorage.setItem(BaseLocalStorage.pushAutoPrompted, 'true');

		// Pequeno delay para não ser muito intrusivo logo no login
		await new Promise(resolve => setTimeout(resolve, 2000));

		// Tenta ativar silenciosamente (sem toast de erro se falhar)
		try {
			const result = await getFCMToken();

			if (result.error || !result.token) {
				// Falha silenciosa - usuário pode ativar manualmente depois
				return;
			}

			const response = await registerPushToken({
				token: result.token,
				platform: 'web',
				deviceName: navigator.userAgent,
				deviceId: localStorage.getItem(BaseLocalStorage.safefyDeviceId) ?? undefined,
			});

			if (response?.error) {
				return;
			}

			currentTokenRef.current = result.token;
			localStorage.setItem(BaseLocalStorage.fcmToken, result.token);
			localStorage.setItem(BaseLocalStorage.pushEnabled, 'true');
			setIsEnabled(true);
			setPermission('granted');
			toast('Notificações ativadas', {
				description: 'Notificações push foram ativadas automaticamente.',
				variant: 'success',
				indicator: <Icon icon={Notification03Icon} className="icon-sm" />,
			});
		} catch {
			// Falha silenciosa
		}
	}, [isPWA, isSupported, isEnabled, permission]);

	const value = {
		isSupported,
		isEnabled,
		isLoading,
		permission,
		isIOSPWA: isIOSPWAState,
		isIOSBrowser,
		isAndroidPWA: isAndroidPWAState,
		isPWA,
		lastError,
		enablePushNotifications,
		disablePushNotifications,
		tryAutoEnablePush,
	};

	return <PushNotificationContext.Provider value={value}>{children}</PushNotificationContext.Provider>;
}

export function usePushNotifications() {
	const context = useContext(PushNotificationContext);
	if (!context) {
		throw new Error('usePushNotifications must be used within a PushNotificationProvider');
	}
	return context;
}

