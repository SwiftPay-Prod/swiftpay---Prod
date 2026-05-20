export const DEFAULT_MODAL_DELAY = 150;

export function openWithDelay(action: () => void, delay = DEFAULT_MODAL_DELAY): void {
	setTimeout(action, delay);
}

