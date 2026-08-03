'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { setSidebarExpanded as setSidebarExpandedCookie } from '@/auth/session';

interface SidebarContextValue {
	isExpanded: boolean;
	isMobile: boolean;
	isOpen: boolean;
	hasMounted: boolean;
	toggleSidebar: () => void;
	openSidebar: () => void;
	closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
	children: ReactNode;
	initialExpanded?: boolean;
}

export function SidebarProvider({ children, initialExpanded = true }: SidebarProviderProps) {
	const isMobileQuery = useMediaQuery('(max-width: 768px)', { initializeWithValue: false });
	const [hasMounted, setHasMounted] = useState(false);
	const [isExpanded, setIsExpanded] = useState(initialExpanded);
	const [isOpen, setIsOpen] = useState(false);

	const isMobile = hasMounted ? isMobileQuery : false;

	useEffect(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setHasMounted(true);
			});
		});
	}, []);

	const persistSidebarExpanded = useCallback((expanded: boolean) => {
		if (typeof window === 'undefined') return;

		const save = () => {
			void setSidebarExpandedCookie(expanded);
		};

		if ('requestIdleCallback' in window) {
			(window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(() => {
				save();
			});
			return;
		}

		globalThis.setTimeout(save, 0);
	}, []);

	const toggleSidebar = useCallback(() => {
		if (isMobile) {
			setIsOpen((prev) => !prev);
		} else {
			setIsExpanded((prev) => {
				const next = !prev;
				persistSidebarExpanded(next);
				return next;
			});
		}
	}, [isMobile, persistSidebarExpanded]);

	const openSidebar = useCallback(() => {
		if (isMobile) {
			setIsOpen(true);
		} else {
			setIsExpanded(true);
			persistSidebarExpanded(true);
		}
	}, [isMobile, persistSidebarExpanded]);

	const closeSidebar = useCallback(() => {
		if (isMobile) {
			setIsOpen(false);
		}
	}, [isMobile]);

	const value = useMemo(
		() => ({
			isExpanded,
			isMobile,
			isOpen,
			hasMounted,
			toggleSidebar,
			openSidebar,
			closeSidebar,
		}),
		[isExpanded, isMobile, isOpen, hasMounted, toggleSidebar, openSidebar, closeSidebar]
	);

	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
}

