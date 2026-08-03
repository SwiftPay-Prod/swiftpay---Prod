import { Spinner } from '@heroui/react';
import { SplashRedirect } from '@/components/splash-redirect';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

export default function SplashPage() {
	return (
		<>
			<SplashRedirect />
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-linear-to-br from-accent/5 via-transparent to-accent/10">
				<div className="flex flex-col items-center gap-6">
					<SwiftPayBrandLogo iconSize={80} textClassName="text-4xl" />
					<Spinner color="accent" size="lg" />
				</div>
			</div>
		</>
	);
}

