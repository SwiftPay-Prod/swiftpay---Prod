'use client';

import { useEffect } from 'react';
import { onForegroundMessage } from '@/lib/firebase';
import { toast } from '@heroui/react';
import { useRouter } from 'next/navigation';

interface NotificationPayload {
	notification?: {
		title?: string;
		body?: string;
	};
	data?: {
		notificationId?: string;
		merchantName?: string;
		actionUrl?: string;
		actionLabel?: string;
		priority?: string;
		environment?: string;
		merchantId?: string;
		title?: string;
		body?: string;
	};
}

export function ForegroundNotificationListener() {
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onForegroundMessage((payload) => {
			const data = payload as NotificationPayload;
			// Payload agora vem via 'data' ao invés de 'notification' para evitar duplicação
			const title = data.data?.title || 'Nova Notificação';
			const body = data.data?.body || '';
			const actionUrl = data.data?.actionUrl;
			const actionLabel = data.data?.actionLabel || 'Ver detalhes';

			toast(title, {
				description: body,
				timeout: 5000,
				actionProps: actionUrl
					? {
						children: actionLabel,
						onPress: () => {
							router.push(actionUrl);
						},
						variant: 'secondary',
					}
					: undefined,
			});
		});

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [router]);

	return null;
}

