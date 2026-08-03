import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BaseCookie } from '@/constants/base';
import { AuthPageClient } from './auth-page-client';

export default async function Page() {
	const cookieStore = await cookies();
	const token = cookieStore.get(BaseCookie.accessToken)?.value;

	if (token) {
		redirect('/panel/merchant/dashboard');
	}

	return <AuthPageClient />;
}
