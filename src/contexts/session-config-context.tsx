'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

interface SessionConfigContextValue {
	apiUrl: string;
	accessToken: string | null;
}

const SessionConfigContext = createContext<SessionConfigContextValue | null>(null);

interface SessionConfigProviderProps {
	apiUrl: string;
	accessToken: string | null;
	children: ReactNode;
}

export function SessionConfigProvider({ apiUrl, accessToken, children }: SessionConfigProviderProps) {
	const value = useMemo(
		() => ({
			apiUrl,
			accessToken,
		}),
		[apiUrl, accessToken]
	);

	return <SessionConfigContext.Provider value={value}>{children}</SessionConfigContext.Provider>;
}

export function useSessionConfig() {
	const context = useContext(SessionConfigContext);
	if (!context) {
		throw new Error('useSessionConfig must be used within a SessionConfigProvider');
	}
	return context;
}

