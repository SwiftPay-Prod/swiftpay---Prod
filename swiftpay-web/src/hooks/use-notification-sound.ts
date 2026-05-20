'use client';

import { useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { BaseLocalStorage } from '@/constants/base';

const CASHIN_SOUND_PATH = '/audio/cashin-sound.mp3';
const DEFAULT_SOUND_PATH = '/audio/notification-default.mp3';
const DEBOUNCE_MS = 500;
const CROSS_TAB_DEDUPE_WINDOW_MS = 15000;
const SOUND_DEDUPE_PREFIX = 'safefy:notification-sound:played:';
const SOUND_DEDUPE_LOCK = 'safefy-notification-sound-lock';
const SOUND_DEDUPE_STATE_KEY = 'safefy:notification-sound:last-event';
const SOUND_TAB_ID_KEY = 'safefy:notification-sound:tab-id';

let lastCashinPlayTime = 0;
let lastDefaultPlayTime = 0;

interface NotificationSoundEventState {
	eventId: string;
	soundType: 'cashin' | 'default';
	playedAt: number;
	tabId: string;
}

function getSoundEnabled() {
	const stored = localStorage.getItem(BaseLocalStorage.notificationSoundEnabled);
	return stored !== null ? stored === 'true' : true;
}

function subscribeSoundEnabled(callback: () => void) {
	const handleStorage = (e: StorageEvent) => {
		if (e.key === BaseLocalStorage.notificationSoundEnabled) {
			callback();
		}
	};
	window.addEventListener('storage', handleStorage);
	return () => window.removeEventListener('storage', handleStorage);
}

function getTabId() {
	const existing = sessionStorage.getItem(SOUND_TAB_ID_KEY);
	if (existing) {
		return existing;
	}

	const tabId = crypto.randomUUID();
	sessionStorage.setItem(SOUND_TAB_ID_KEY, tabId);
	return tabId;
}

function canPlayInCurrentTab() {
	return typeof document !== 'undefined' && document.visibilityState === 'visible';
}

function clearLegacySoundDedupeKeys() {
	for (let index = localStorage.length - 1; index >= 0; index -= 1) {
		const key = localStorage.key(index);
		if (key?.startsWith(SOUND_DEDUPE_PREFIX)) {
			localStorage.removeItem(key);
		}
	}
}

function readLastSoundEvent(): NotificationSoundEventState | null {
	const raw = localStorage.getItem(SOUND_DEDUPE_STATE_KEY);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as NotificationSoundEventState;
	} catch {
		return null;
	}
}

function canPlayWithLocalStorage(soundType: 'cashin' | 'default', eventId: string): boolean {
	const now = Date.now();
	const previousEvent = readLastSoundEvent();

	if (
		previousEvent &&
		previousEvent.eventId === eventId &&
		previousEvent.soundType === soundType &&
		now - previousEvent.playedAt < CROSS_TAB_DEDUPE_WINDOW_MS
	) {
		return false;
	}

	const payload: NotificationSoundEventState = {
		eventId,
		soundType,
		playedAt: now,
		tabId: getTabId(),
	};

	localStorage.setItem(SOUND_DEDUPE_STATE_KEY, JSON.stringify(payload));
	return true;
}

async function canPlayAcrossTabs(soundType: 'cashin' | 'default', eventId?: string): Promise<boolean> {
	if (!eventId) return true;

	const lockManager = navigator.locks;
	if (!lockManager) {
		return canPlayWithLocalStorage(soundType, eventId);
	}

	let canPlay = false;
	await lockManager.request(SOUND_DEDUPE_LOCK, async () => {
		canPlay = canPlayWithLocalStorage(soundType, eventId);
	});

	return canPlay;
}

export function useNotificationSound() {
	const cashinAudioRef = useRef<HTMLAudioElement | null>(null);
	const defaultAudioRef = useRef<HTMLAudioElement | null>(null);
	const isSoundEnabled = useSyncExternalStore(
		subscribeSoundEnabled,
		getSoundEnabled,
		() => true
	);

	useEffect(() => {
		clearLegacySoundDedupeKeys();

		const cashinAudio = new Audio(CASHIN_SOUND_PATH);
		cashinAudio.preload = 'auto';
		cashinAudio.volume = 0.4;
		cashinAudioRef.current = cashinAudio;

		const defaultAudio = new Audio(DEFAULT_SOUND_PATH);
		defaultAudio.preload = 'auto';
		defaultAudio.volume = 0.4;
		defaultAudioRef.current = defaultAudio;

		return () => {
			if (cashinAudioRef.current) {
				cashinAudioRef.current.pause();
				cashinAudioRef.current = null;
			}
			if (defaultAudioRef.current) {
				defaultAudioRef.current.pause();
				defaultAudioRef.current = null;
			}
		};
	}, []);

	const playCashinSound = useCallback((notificationId?: string) => {
		const now = Date.now();
		if (now - lastCashinPlayTime < DEBOUNCE_MS) return;

		if (!canPlayInCurrentTab()) return;
		lastCashinPlayTime = now;

		if (!cashinAudioRef.current || !isSoundEnabled) return;

		void canPlayAcrossTabs('cashin', notificationId).then((canPlay) => {
			if (!canPlay || !cashinAudioRef.current) return;
			cashinAudioRef.current.currentTime = 0;
			cashinAudioRef.current.play().catch(() => {});
		});
	}, [isSoundEnabled]);

	const playDefaultSound = useCallback((notificationId?: string) => {
		const now = Date.now();
		if (now - lastDefaultPlayTime < DEBOUNCE_MS) return;

		if (!canPlayInCurrentTab()) return;
		lastDefaultPlayTime = now;

		if (!defaultAudioRef.current || !isSoundEnabled) return;

		void canPlayAcrossTabs('default', notificationId).then((canPlay) => {
			if (!canPlay || !defaultAudioRef.current) return;
			defaultAudioRef.current.currentTime = 0;
			defaultAudioRef.current.play().catch(() => {});
		});
	}, [isSoundEnabled]);

	const toggleSound = useCallback((enabled: boolean) => {
		localStorage.setItem(BaseLocalStorage.notificationSoundEnabled, String(enabled));
		window.dispatchEvent(
			new StorageEvent('storage', { key: BaseLocalStorage.notificationSoundEnabled })
		);
	}, []);

	return { playCashinSound, playDefaultSound, isSoundEnabled, toggleSound };
}

