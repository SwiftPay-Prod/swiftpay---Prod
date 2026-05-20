export async function clearPWACache(): Promise<number> {
	if (!('caches' in window)) {
		console.log('[PWA] Cache API not supported');
		return 0;
	}

	try {
		const cacheNames = await caches.keys();
		console.log(`[PWA] Found ${cacheNames.length} caches:`, cacheNames);

		await Promise.all(
			cacheNames.map(async (name) => {
				const deleted = await caches.delete(name);
				console.log(`[PWA] Cache "${name}" deleted:`, deleted);
			})
		);

		return cacheNames.length;
	} catch (error) {
		console.error('[PWA] Error clearing caches:', error);
		return 0;
	}
}

export async function unregisterServiceWorkers(): Promise<number> {
	if (!('serviceWorker' in navigator)) {
		console.log('[PWA] Service Worker not supported');
		return 0;
	}

	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		console.log(`[PWA] Found ${registrations.length} service workers`);

		await Promise.all(
			registrations.map(async (registration) => {
				const unregistered = await registration.unregister();
				console.log(`[PWA] SW "${registration.scope}" unregistered:`, unregistered);
			})
		);

		return registrations.length;
	} catch (error) {
		console.error('[PWA] Error unregistering service workers:', error);
		return 0;
	}
}

export async function clearLocalStorage() {
	try {
		const fcmToken = localStorage.getItem('safefy_fcm_token');
		if (fcmToken) {
			localStorage.removeItem('safefy_fcm_token');
			console.log('[PWA] FCM token removed from localStorage');
		}

		const keysToRemove = Object.keys(localStorage).filter(
			(key) => key.startsWith('firebase:') || key.startsWith('fcm_')
		);
		keysToRemove.forEach((key) => {
			localStorage.removeItem(key);
			console.log(`[PWA] Removed localStorage key: ${key}`);
		});
	} catch (error) {
		console.error('[PWA] Error clearing localStorage:', error);
	}
}
