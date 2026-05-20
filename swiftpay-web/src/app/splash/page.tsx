import { Spinner } from '@heroui/react';
import { SplashRedirect } from '@/components/splash-redirect';
import Image from 'next/image';

export default function SplashPage() {
	return (
		<>
			<SplashRedirect />
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-linear-to-br from-accent/5 via-transparent to-accent/10">
				<div className="flex flex-col items-center gap-6">
					<Image src="/logos/safefy-icon-logo.png" alt="Safefy"  width={300} height={300} />
					<Spinner color="accent" size="lg" />
				</div>
			</div>
		</>
	);
}

