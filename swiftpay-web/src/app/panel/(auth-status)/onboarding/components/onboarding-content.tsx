'use client';

import { Button } from '@heroui/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logout01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Routes } from '@/router/routes';
import type { UserOnboardingData } from '@/types/user/onboarding';
import { OnboardingForm } from '@/app/panel/(auth-status)/onboarding/forms/onboarding-form';
import { useOnboardingForm } from '@/app/panel/(auth-status)/onboarding/hooks/use-onboarding-form';

interface OnboardingContentProps {
	userName: string | null;
	initialData: UserOnboardingData | null;
}

export function OnboardingContent({ userName, initialData }: OnboardingContentProps) {
	const router = useRouter();
	const formController = useOnboardingForm({
		initialData,
		onSuccess: () => router.push(Routes.panel.merchant.dashboard),
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
				<header className="flex items-center justify-between gap-2">
					<div className="flex flex-col">
						<div className="mb-2">
							<Image
								src="/logos/swiftpay-logo.png"
								alt="SwiftPay"
								width={96}
								height={99}
								className="h-24 w-auto"
							/>
						</div>
						<p className="text-sm text-muted">Primeiros passos</p>
						<h1 className="text-xl font-semibold text-foreground sm:text-2xl">
							{userName ? `${userName}, vamos personalizar sua experiência` : 'Vamos personalizar sua experiência'}
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onPress={() => router.push('/api/auth/signout')}>
							<Icon icon={Logout01Icon} className="icon-md" />
							Sair
						</Button>
					</div>
				</header>

				<OnboardingForm controller={formController} />
			</div>
		</div>
	);
}
