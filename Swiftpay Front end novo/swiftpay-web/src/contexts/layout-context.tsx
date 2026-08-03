'use client';

import { createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

type LayoutMode = 'sidebar-fixed' | 'sidebar-centered';

interface LayoutContextType {
	layoutMode: LayoutMode;
	toggleLayoutMode: () => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

const LAYOUT_STORAGE_KEY = 'swiftpay_layout_mode';
const DEFAULT_LAYOUT: LayoutMode = 'sidebar-fixed';

function getStoredLayoutMode(): LayoutMode {
	if (typeof window === 'undefined') return DEFAULT_LAYOUT;
	const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
	if (stored === 'sidebar-fixed' || stored === 'sidebar-centered') {
		return stored;
	}
	return DEFAULT_LAYOUT;
}

function subscribeToStorage(callback: () => void) {
	window.addEventListener('storage', callback);
	return () => window.removeEventListener('storage', callback);
}

export function LayoutProvider({ children }: { children: ReactNode }) {
	const layoutMode = useSyncExternalStore(
		subscribeToStorage,
		getStoredLayoutMode,
		() => DEFAULT_LAYOUT
	);

	const toggleLayoutMode = useCallback(() => {
		const next = layoutMode === 'sidebar-fixed' ? 'sidebar-centered' : 'sidebar-fixed';
		localStorage.setItem(LAYOUT_STORAGE_KEY, next);
		window.dispatchEvent(new StorageEvent('storage', { key: LAYOUT_STORAGE_KEY }));
	}, [layoutMode]);

	return <LayoutContext.Provider value={{ layoutMode, toggleLayoutMode }}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
	const context = useContext(LayoutContext);
	if (!context) {
		throw new Error('useLayout must be used within a LayoutProvider');
	}
	return context;
}

