'use client';

import { type ReactNode, useCallback, useRef, useEffect } from 'react';
import { toast } from '@heroui/react';
import { useSignalR } from '@/contexts/signalr-context';
import { SignalRMethods } from '@/lib/signalr/methods';
import { useMerchant } from '@/contexts/merchant-context';
import { useAdmin } from '@/contexts/admin-context';
import { useEnvironment } from '@/contexts/environment-context';
import { Icon } from '@/components/ui/icon';
import { RefreshIcon } from '@hugeicons/core-free-icons';

interface DashboardHubProviderProps {
	isAdmin?: boolean;
	children: ReactNode;
}

export function DashboardHubProvider({ isAdmin, children }: DashboardHubProviderProps) {
	const { isConnected, subscribe, invoke } = useSignalR();
	const { selectedMerchant, triggerDashboardRefresh: triggerMerchantDashboardRefresh } = useMerchant();
	const { triggerDashboardRefresh: triggerAdminDashboardRefresh } = useAdmin();
	const { environment } = useEnvironment();
	const lastToastAtRef = useRef(0);

	const shouldToastUpdate = useCallback(() => {
		const now = Date.now();
		if (now - lastToastAtRef.current < 1500) return false;
		lastToastAtRef.current = now;
		return true;
	}, []);

	const handleMerchantDashboardUpdated = useCallback(() => {
		if (shouldToastUpdate()) {
			toast('Dashboard atualizado', {
				description: 'Os dados do dashboard foram atualizados.',
				variant: 'success',
				indicator: <Icon icon={RefreshIcon} className="icon-sm" />,
			});
		}
		triggerMerchantDashboardRefresh();
	}, [triggerMerchantDashboardRefresh, shouldToastUpdate]);

	const handleAdminDashboardUpdated = useCallback(() => {
		if (shouldToastUpdate()) {
			toast('Dashboard atualizado', {
				description: 'Os dados do dashboard foram atualizados.',
				variant: 'success',
				indicator: <Icon icon={RefreshIcon} className="icon-sm" />,
			});
		}
		triggerAdminDashboardRefresh();
	}, [triggerAdminDashboardRefresh, shouldToastUpdate]);

	useEffect(() => {
		const unsub1 = subscribe(SignalRMethods.MerchantDashboardUpdated, handleMerchantDashboardUpdated);
		const unsub2 = subscribe(SignalRMethods.AdminDashboardUpdated, handleAdminDashboardUpdated);
		return () => { unsub1(); unsub2(); };
	}, [subscribe, handleMerchantDashboardUpdated, handleAdminDashboardUpdated]);

	useEffect(() => {
		if (!isConnected || !selectedMerchant?.id) return;
		invoke('JoinMerchantDashboard', selectedMerchant.id);
		return () => { invoke('LeaveMerchantDashboard', selectedMerchant.id).catch(() => {}); };
	}, [isConnected, selectedMerchant?.id, invoke]);

	useEffect(() => {
		if (!isConnected || !isAdmin || !environment) return;
		invoke('JoinAdminDashboard', environment);
		return () => { invoke('LeaveAdminDashboard', environment).catch(() => {}); };
	}, [isConnected, isAdmin, environment, invoke]);

	return <>{children}</>;
}

