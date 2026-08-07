import { signOut } from '@/app/actions/auth';

export async function performClientLogout() {
	await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
	await signOut();
	window.location.href = '/';
}
