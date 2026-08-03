import { signOut } from '@/app/actions/auth';
import { clearAuthCookies } from '@/auth/session';

export async function performClientLogout() {
	await signOut();
	await clearAuthCookies();
	document.cookie.split(';').forEach(c => {
		document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`);
	});
	window.location.href = '/';
}
