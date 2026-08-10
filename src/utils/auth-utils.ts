

export async function performClientLogout() {
	
	await fetch('/api/auth/signout', {
		method: 'POST',
		credentials: 'include',
		redirect: 'manual',
	}).catch(() => undefined);
	window.location.assign('/');
}
