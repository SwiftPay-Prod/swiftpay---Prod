'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { NotificationData } from '@/types/merchant/notifications';
import { NotificationStatusType, PaymentEnvironment } from '@/types/enums';
import { useSignalR } from '@/contexts/signalr-context';
import { SignalRMethods } from '@/lib/signalr/methods';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import {
	getMerchantNotificationCount,
	listMerchantNotifications,
	markNotificationRead,
	markAllNotificationsRead,
} from '@/app/actions/merchant/notifications';
import { useMerchant } from './merchant-context';
import { useEnvironment } from './environment-context';

interface NotificationContextValue {
	unreadCount: number;
	hasNewNotification: boolean;
	notifications: NotificationData[];
	latestSignalRNotification: NotificationData | null;
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

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
	children: ReactNode;
	initialUnreadCount?: number;
}

const POPOVER_NOTIFICATIONS_PAGE_SIZE = 15;

export function NotificationProvider({
	children,
	initialUnreadCount = 0,
}: NotificationProviderProps) {
	const { isConnected, subscribe, invoke } = useSignalR();
	const { selectedMerchant, refreshMerchantList, refreshBalance } = useMerchant();
	const { environment } = useEnvironment();
	const merchantId = selectedMerchant?.id ?? null;
	const { playCashinSound, playDefaultSound } = useNotificationSound();

	const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
	const [hasNewNotification, setHasNewNotification] = useState(false);
	const [notifications, setNotifications] = useState<NotificationData[]>([]);
	const [latestSignalRNotification, setLatestSignalRNotification] = useState<NotificationData | null>(null);
	const [signalRNotificationVersion, setSignalRNotificationVersion] = useState(0);
	const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

	const currentEnvironmentRef = useRef<PaymentEnvironment>(environment);
	const merchantIdRef = useRef<string | null>(merchantId);
	const newNotificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const refreshMerchantListRef = useRef(refreshMerchantList);
	const refreshBalanceRef = useRef(refreshBalance);
	const playCashinSoundRef = useRef(playCashinSound);
	const playDefaultSoundRef = useRef(playDefaultSound);

	useEffect(() => {
		currentEnvironmentRef.current = environment;
	}, [environment]);

	useEffect(() => {
		merchantIdRef.current = merchantId;
	}, [merchantId]);

	useEffect(() => {
		refreshMerchantListRef.current = refreshMerchantList;
		refreshBalanceRef.current = refreshBalance;
		playCashinSoundRef.current = playCashinSound;
		playDefaultSoundRef.current = playDefaultSound;
	}, [refreshMerchantList, refreshBalance, playCashinSound, playDefaultSound]);

	const refreshCount = useCallback(async () => {
		if (!merchantId) return;

		const response = await getMerchantNotificationCount(merchantId);
		if (response?.data) {
			setUnreadCount(response.data.unreadCount);
		}
	}, [merchantId]);

	const markAsRead = useCallback(
		async (notificationId: string) => {
			if (!merchantId) return;

			const response = await markNotificationRead(merchantId, notificationId);
			if (!response.error) {
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		},
		[merchantId]
	);

	const markAllAsRead = useCallback(async () => {
		if (!merchantId) return;

		const response = await markAllNotificationsRead(merchantId);
		if (!response.error) {
			setUnreadCount(0);
			setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
			setHasNewNotification(false);
		}
	}, [merchantId]);

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
		if (!merchantId) return;
		const response = await listMerchantNotifications(merchantId, { pageSize: POPOVER_NOTIFICATIONS_PAGE_SIZE });
		if (response?.data?.items) {
			setNotifications(response.data.items);
		}
	}, [merchantId]);

	const handleNotification = useCallback((notification: NotificationData) => {
		if (notification.environment !== currentEnvironmentRef.current) {
			return;
		}

		setUnreadCount((prev) => prev + 1);
		setNotifications((prev) => [notification, ...prev].slice(0, POPOVER_NOTIFICATIONS_PAGE_SIZE));
		setLatestSignalRNotification(notification);
		setSignalRNotificationVersion((prev) => prev + 1);
		setHasNewNotification(true);

		if (newNotificationTimeoutRef.current) {
			clearTimeout(newNotificationTimeoutRef.current);
		}
		newNotificationTimeoutRef.current = setTimeout(() => {
			setHasNewNotification(false);
			newNotificationTimeoutRef.current = null;
		}, 3000);

		const statusTypesRefreshBalance = [
			NotificationStatusType.PaymentCompleted,
			NotificationStatusType.PayoutPending,
			NotificationStatusType.PayoutProcessing,
			NotificationStatusType.PayoutCompleted,
			NotificationStatusType.PayoutFailed,
			NotificationStatusType.PayoutRejected,
			NotificationStatusType.PayoutCancelled,
		];

		if (notification.statusType === NotificationStatusType.PaymentCompleted) {
			playCashinSoundRef.current(notification.id);
		} else {
			playDefaultSoundRef.current(notification.id);
		}

		if (notification.statusType && statusTypesRefreshBalance.includes(notification.statusType)) {
			refreshBalanceRef.current();
		}

		if (notification.requiresMerchantRefresh && merchantIdRef.current) {
			refreshMerchantListRef.current(merchantIdRef.current);
		}
	}, []);

	useEffect(() => {
		return subscribe(SignalRMethods.NotificationReceived, handleNotification);
	}, [subscribe, handleNotification]);

	useEffect(() => {
		if (!isConnected || !merchantId) return;
		invoke('JoinMerchantGroup', merchantId);
		return () => { invoke('LeaveMerchantGroup', merchantId).catch(() => {}); };
	}, [isConnected, merchantId, invoke]);

	useEffect(() => {
		if (!merchantId) {
			queueMicrotask(() => {
				setNotifications([]);
				setUnreadCount(0);
				setIsLoadingNotifications(false);
			});
			return;
		}
		queueMicrotask(() => {
			setIsLoadingNotifications(true);
		});
		Promise.all([
			getMerchantNotificationCount(merchantId),
			listMerchantNotifications(merchantId, { pageSize: POPOVER_NOTIFICATIONS_PAGE_SIZE }),
		]).then(([countResponse, listResponse]) => {
			if (countResponse?.data) setUnreadCount(countResponse.data.unreadCount);
			if (listResponse?.data?.items) setNotifications(listResponse.data.items);
			setIsLoadingNotifications(false);
		});
	}, [merchantId, environment]);

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

	return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
}

