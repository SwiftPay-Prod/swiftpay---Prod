'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserNotificationData } from '@/types/user/notifications';
import { NotificationStatusType } from '@/types/enums';
import { useSignalR } from '@/contexts/signalr-context';
import { SignalRMethods } from '@/lib/signalr/methods';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import {
	getUserNotificationCount,
	listUserNotifications,
	markUserNotificationRead,
	markAllUserNotificationsRead,
} from '@/app/actions/user';
import { adminRefreshPlatformBalance } from '@/app/actions/admin/dashboard';

interface UserNotificationContextValue {
	unreadCount: number;
	hasNewNotification: boolean;
	notifications: UserNotificationData[];
	latestSignalRNotification: UserNotificationData | null;
	signalRNotificationVersion: number;
	isLoadingNotifications: boolean;
	markAsRead: (notificationId: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	refreshCount: () => Promise<void>;
	refreshNotifications: () => Promise<void>;
	clearNewNotificationFlag: () => void;
	decrementCount: () => void;
	setNotificationAsRead: (notificationId: string) => void;
}

const UserNotificationContext = createContext<UserNotificationContextValue | null>(null);

interface UserNotificationProviderProps {
	children: ReactNode;
	initialUnreadCount?: number;
}

const POPOVER_NOTIFICATIONS_PAGE_SIZE = 15;

export function UserNotificationProvider({
	children,
	initialUnreadCount = 0,
}: UserNotificationProviderProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { isConnected, subscribe } = useSignalR();
	const { playDefaultSound } = useNotificationSound();

	const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
	const [hasNewNotification, setHasNewNotification] = useState(false);
	const [notifications, setNotifications] = useState<UserNotificationData[]>([]);
	const [latestSignalRNotification, setLatestSignalRNotification] = useState<UserNotificationData | null>(null);
	const [signalRNotificationVersion, setSignalRNotificationVersion] = useState(0);
	const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

	const pathnameRef = useRef(pathname);
	const routerRef = useRef(router);
	const newNotificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playDefaultSoundRef = useRef(playDefaultSound);

	useEffect(() => {
		pathnameRef.current = pathname;
		routerRef.current = router;
	}, [pathname, router]);

	useEffect(() => {
		playDefaultSoundRef.current = playDefaultSound;
	}, [playDefaultSound]);

	const refreshCount = useCallback(async () => {
		const response = await getUserNotificationCount();
		if (response?.data) {
			setUnreadCount(response.data.unreadCount);
		}
	}, []);

	const markAsRead = useCallback(async (notificationId: string) => {
		const response = await markUserNotificationRead(notificationId);
		if (!response.error) {
			setUnreadCount((prev) => Math.max(0, prev - 1));
		}
	}, []);

	const markAllAsRead = useCallback(async () => {
		const response = await markAllUserNotificationsRead();
		if (!response.error) {
			setUnreadCount(0);
			setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
			setHasNewNotification(false);
		}
	}, []);

	const clearNewNotificationFlag = useCallback(() => {
		setHasNewNotification(false);
		if (newNotificationTimeoutRef.current) {
			clearTimeout(newNotificationTimeoutRef.current);
			newNotificationTimeoutRef.current = null;
		}
	}, []);

	const decrementCount = useCallback(() => {
		setUnreadCount((prev) => Math.max(0, prev - 1));
	}, []);

	const setNotificationAsRead = useCallback((notificationId: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
	}, []);

	const refreshNotifications = useCallback(async () => {
		const response = await listUserNotifications({ pageSize: POPOVER_NOTIFICATIONS_PAGE_SIZE });
		if (response?.data?.items) {
			setNotifications(response.data.items);
		}
	}, []);

	const handleNotification = useCallback((notification: UserNotificationData) => {
		setUnreadCount((prev) => prev + 1);
		setNotifications((prev) => [notification, ...prev].slice(0, POPOVER_NOTIFICATIONS_PAGE_SIZE));
		setLatestSignalRNotification(notification);
		setSignalRNotificationVersion((prev) => prev + 1);

		const financialStatusTypes = [
			NotificationStatusType.PaymentPending,
			NotificationStatusType.PaymentCompleted,
			NotificationStatusType.PaymentExpired,
			NotificationStatusType.PaymentFailed,
			NotificationStatusType.PaymentRefunded,
			NotificationStatusType.PayoutPending,
			NotificationStatusType.PayoutProcessing,
			NotificationStatusType.PayoutCompleted,
			NotificationStatusType.PayoutFailed,
			NotificationStatusType.PayoutRejected,
			NotificationStatusType.PayoutCancelled,
		];

		if (!notification.statusType || !financialStatusTypes.includes(notification.statusType)) {
			playDefaultSoundRef.current(notification.id);
		}

		// Trigger System PWA Push Notification for User/Admin
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
			const title = notification.title || 'SwiftPay Alerta';
			const body = notification.message || 'Nova notificação de usuário';
			if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
				navigator.serviceWorker.ready.then((reg) => {
					reg.showNotification(title, {
						body,
						icon: '/logos/swiftpay-icon-logo.png',
						badge: '/logos/swiftpay-icon-logo.png',
						data: { url: '/panel/merchant/dashboard' },
					});
				}).catch(() => {});
			} else {
				try {
					new Notification(title, {
						body,
						icon: '/logos/swiftpay-icon-logo.png',
					});
				} catch (e) {
					console.error('Erro ao exibir notificação:', e);
				}
			}
		}

		const payoutStatusTypes = [
			NotificationStatusType.PayoutCompleted,
			NotificationStatusType.PayoutFailed,
		];

		if (notification.statusType && payoutStatusTypes.includes(notification.statusType)) {
			if (pathnameRef.current.startsWith('/panel/admin/balances')) {
				adminRefreshPlatformBalance().then(() => {
					setTimeout(() => {
						routerRef.current.refresh();
					}, 0);
				});
			}
		}

		setHasNewNotification(true);
		if (newNotificationTimeoutRef.current) {
			clearTimeout(newNotificationTimeoutRef.current);
		}
		newNotificationTimeoutRef.current = setTimeout(() => {
			setHasNewNotification(false);
			newNotificationTimeoutRef.current = null;
		}, 3000);
	}, []);

	useEffect(() => {
		return subscribe(SignalRMethods.UserNotificationReceived, handleNotification);
	}, [subscribe, handleNotification]);

	useEffect(() => {
		Promise.all([
			getUserNotificationCount(),
			listUserNotifications({ pageSize: POPOVER_NOTIFICATIONS_PAGE_SIZE }),
		]).then(([countResponse, listResponse]) => {
			if (countResponse?.data) setUnreadCount(countResponse.data.unreadCount);
			if (listResponse?.data?.items) setNotifications(listResponse.data.items);
			setIsLoadingNotifications(false);
		});
	}, []);

	const value = useMemo(
		() => ({
			unreadCount,
			hasNewNotification,
			notifications,
			latestSignalRNotification,
			signalRNotificationVersion,
			isLoadingNotifications,
			markAsRead,
			markAllAsRead,
			refreshCount,
			refreshNotifications,
			clearNewNotificationFlag,
			decrementCount,
			setNotificationAsRead,
		}),
		[
			unreadCount,
			hasNewNotification,
			notifications,
			latestSignalRNotification,
			signalRNotificationVersion,
			isLoadingNotifications,
			markAsRead,
			markAllAsRead,
			refreshCount,
			refreshNotifications,
			clearNewNotificationFlag,
			decrementCount,
			setNotificationAsRead,
		]
	);

	return <UserNotificationContext.Provider value={value}>{children}</UserNotificationContext.Provider>;
}

export function useUserNotifications() {
	const context = useContext(UserNotificationContext);
	if (!context) {
		throw new Error('useUserNotifications deve ser usado dentro de um UserNotificationProvider');
	}
	return context;
}
