'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_DOCS_URL } from '@/constants/useful-links';

export interface PublicConfig {
	docsUrl: string;
	integrationUrl: string | null;
}

const PublicConfigContext = createContext<PublicConfig | null>(null);

export function PublicConfigProvider({ value, children }: { value: PublicConfig; children: ReactNode }) {
	return <PublicConfigContext.Provider value={value}>{children}</PublicConfigContext.Provider>;
}

export function usePublicConfig(): PublicConfig {
	const config = useContext(PublicConfigContext);

	if (config) return config;

	return {
		docsUrl: DEFAULT_DOCS_URL,
		integrationUrl: null,
	};
}

