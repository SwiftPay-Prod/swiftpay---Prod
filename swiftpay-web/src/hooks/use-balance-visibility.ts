'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const BALANCE_VISIBILITY_KEY = 'safefy_balance_visible';
const BALANCE_VISIBILITY_EVENT = 'safefy_balance_visibility_changed';

export function useBalanceVisibility() {
	const [isVisible, setIsVisible] = useState(true);

	const isVisibleRef = useRef(isVisible);
	useEffect(() => {
		isVisibleRef.current = isVisible;
	}, [isVisible]);

	useEffect(() => {
		const saved = localStorage.getItem(BALANCE_VISIBILITY_KEY);
		if (saved === null) {
			return;
		}

		queueMicrotask(() => {
			setIsVisible(saved === 'true');
		});
	}, []);

	useEffect(() => {
		function handleStorageChange(e: StorageEvent) {
			if (e.key === BALANCE_VISIBILITY_KEY && e.newValue !== null) {
				setIsVisible(e.newValue === 'true');
			}
		}

		function handleCustomEvent(e: Event) {
			setIsVisible((e as CustomEvent<boolean>).detail);
		}

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener(BALANCE_VISIBILITY_EVENT, handleCustomEvent as EventListener);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener(BALANCE_VISIBILITY_EVENT, handleCustomEvent as EventListener);
		};
	}, []);

	const toggle = useCallback(() => {
		const next = !isVisibleRef.current;
		localStorage.setItem(BALANCE_VISIBILITY_KEY, String(next));
		setIsVisible(next);
		window.dispatchEvent(new CustomEvent<boolean>(BALANCE_VISIBILITY_EVENT, { detail: next }));
	}, []);

	return { isVisible, toggle };
}
