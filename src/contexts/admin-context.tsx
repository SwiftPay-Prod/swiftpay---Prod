'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface AdminContextValue {
	dashboardRefreshKey: number;
	triggerDashboardRefresh: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
	const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

	const triggerDashboardRefresh = useCallback(() => {
		setDashboardRefreshKey((prev) => prev + 1);
	}, []);

	const value = useMemo(
		() => ({
			dashboardRefreshKey,
			triggerDashboardRefresh,
		}),
		[dashboardRefreshKey, triggerDashboardRefresh]
	);

	return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
	const context = useContext(AdminContext);
	if (!context) {
		throw new Error('useAdmin must be used within an AdminProvider');
	}
	return context;
}

