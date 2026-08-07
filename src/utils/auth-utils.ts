import { signOutFirebase } from '@/lib/firebase';

export async function performClientLogout() {
	await signOutFirebase().catch(() => undefined);
	await fetch('/api/auth/signout', {
		method: 'POST',
		credentials: 'include',
		redirect: 'manual',
	}).catch(() => undefined);
	window.location.assign('/');
}
