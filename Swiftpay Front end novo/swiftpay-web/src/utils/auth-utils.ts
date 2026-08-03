export async function performClientLogout() {
	const { signOut } = await import('@/app/actions/auth');
	await signOut();
	document.cookie.split(';').forEach(c => {
		document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`);
	});
	window.location.href = '/';
}
