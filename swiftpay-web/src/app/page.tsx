import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BaseCookie } from '@/constants/base';
import { getSessionData } from '@/auth/session';
import { AuthPageClient } from './auth-page-client';

export default async function Page() {
	const cookieStore = await cookies();
	const token = cookieStore.get(BaseCookie.accessToken)?.value;

	if (token) {
		// Só redireciona ao painel quando a sessão na API realmente existe.
		// Um token vencido/órfão aqui causava loop infinito de redirect
		// entre "/" e "/panel/*" (ERR_TOO_MANY_REDIRECTS), travando o acesso
		// ao painel sem conseguir deslogar.
		const session = await getSessionData();
		if (session?.emailVerified) {
			redirect('/panel/merchant/dashboard');
		}
	}

	return <AuthPageClient />;
}
