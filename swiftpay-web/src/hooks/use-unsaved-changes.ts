'use client';

import { useEffect, useCallback, useMemo } from 'react';

export function useUnsavedChanges<T>(currentData: T, initialData: T, enabled: boolean = true): boolean {
	const hasChanges = useMemo(() => {
		if (!enabled) return false;
		return JSON.stringify(currentData) !== JSON.stringify(initialData);
	}, [currentData, initialData, enabled]);

	const handleBeforeUnload = useCallback(
		(e: BeforeUnloadEvent) => {
			if (hasChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		},
		[hasChanges]
	);

	useEffect(() => {
		if (!enabled) return;

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [handleBeforeUnload, enabled]);

	return hasChanges;
}

