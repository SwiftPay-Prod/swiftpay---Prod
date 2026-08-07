import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { getMerchantNotificationCount } from '@/app/actions/merchant/notifications';
import { listAllNotifications, getUserNotificationCount } from '@/app/actions/user';
import { NotificationsContent } from './notifications-content';
import { NotificationsSkeleton } from './notifications-skeleton';
import { Routes } from '@/router/routes';
import type { NotificationScope, NotificationType, NotificationPriority, NotificationStatusType, PaymentEnvironment } from '@/types/enums';

export interface NotificationFilters {
	scope: NotificationScope | 'all';
	type?: NotificationType | null;
	statusType?: NotificationStatusType | null;
	priority?: NotificationPriority | null;
	isRead?: boolean | null;
	search?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	page: number;
	pageSize: number;
	environment?: PaymentEnvironment;
}

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const merchant = await getSelectedMerchant();
	const environment = await getSelectedEnvironment();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const filters: NotificationFilters = {
		scope: (params.scope as NotificationScope | 'all') || 'all',
		type: params.type as NotificationType | undefined,
		statusType: params.statusType as NotificationStatusType | undefined,
		priority: params.priority as NotificationPriority | undefined,
		isRead: params.isRead === 'true' ? true : params.isRead === 'false' ? false : undefined,
		search: params.search || undefined,
		startDate: params.startDate || undefined,
		endDate: params.endDate || undefined,
		page: Number(params.page) || 1,
		pageSize: Number(params.pageSize) || 10,
		environment,
	};

	// Promise para a lista unificada com todos os filtros
	const notificationsPromise = listAllNotifications(merchant.id, {
		scope: filters.scope === 'all' ? undefined : filters.scope,
		page: filters.page,
		pageSize: filters.pageSize,
		isRead: filters.isRead,
		type: filters.type,
		statusType: filters.statusType,
		priority: filters.priority,
		search: filters.search,
		startDate: filters.startDate,
		endDate: filters.endDate,
	});

	// Promises para obter os counts de cada scope (para as tabs)
	const merchantCountPromise = getMerchantNotificationCount(merchant.id);
	const userCountPromise = getUserNotificationCount();

	return (
		<Suspense fallback={<NotificationsSkeleton filters={filters} />}>
			<NotificationsContent
				notificationsPromise={notificationsPromise}
				merchantCountPromise={merchantCountPromise}
				userCountPromise={userCountPromise}
				merchantId={merchant.id}
				filters={filters}
			/>
		</Suspense>
	);
}

