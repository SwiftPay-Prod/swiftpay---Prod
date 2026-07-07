'use client';

import { useState } from 'react';
import { Card } from '@heroui/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { SignInForm } from '@/components/auth/forms/signin-form';
import { SignUpForm } from '@/components/auth/forms/signup-form';
import { ForgotPasswordForm } from '@/components/auth/forms/forgot-password-form';
import { StatusModalProvider } from '@/components/auth/status-modal-provider';
import { DeviceRevokedModalProvider } from '@/components/auth/device-revoked-modal-provider';

type AuthView = 'signin' | 'signup' | 'forgot-password';

function SwiftPayLogo() {
	return <SwiftPayBrandLogo iconSize={30} textClassName="text-2xl text-white" />;
}

export default function AuthPage() {
	const [view, setView] = useState<AuthView>('signin');

	function renderForm() {
		switch (view) {
			case 'signin':
				return (
					<SignInForm
						onSwitchToSignUp={() => setView('signup')}
						onSwitchToForgotPassword={() => setView('forgot-password')}
					/>
				);
			case 'signup':
				return <SignUpForm onSwitchToSignIn={() => setView('signin')} />;
			case 'forgot-password':
				return <ForgotPasswordForm onSwitchToSignIn={() => setView('signin')} />;
		}
	}

	return (
		<BackgroundGradientAnimation
			gradientBackgroundStart="rgb(15, 23, 42)"
			gradientBackgroundEnd="rgb(30, 58, 138)"
			firstColor="59, 130, 246"
			secondColor="6, 182, 212"
			thirdColor="99, 102, 241"
			fourthColor="14, 165, 233"
			fifthColor="139, 92, 246"
			pointerColor="56, 189, 248"
			size="80%"
			blendingValue="hard-light"
			interactive={true}
			containerClassName="h-dvh"
		>
			<StatusModalProvider />
			<DeviceRevokedModalProvider />
			<div className="absolute inset-0 z-50 flex">
				<div className="hidden lg:flex lg:flex-1 relative">
					<div className="flex flex-col justify-between items-start p-8 w-full">
						<SwiftPayLogo />

						<div className="max-w-lg">
							<p className="text-white/90 text-lg leading-relaxed drop-shadow-lg">
								&quot;A solução mais segura e confiável para seus pagamentos. Gerencie suas transações com total
								segurança e praticidade.&quot;
							</p>
						</div>
					</div>
				</div>

				<div className="flex-1 flex flex-col lg:max-w-xl relative">
					<div className="flex justify-between items-center p-4 lg:p-6">
						<div className="lg:hidden">
							<SwiftPayLogo />
						</div>
						<div className="lg:ml-auto">
							<ThemeToggle />
						</div>
					</div>

					<div className="flex-1 flex items-center justify-center p-4 lg:p-8">
						<Card className="w-full max-w-md p-8 backdrop-blur-sm bg-background/80">{renderForm()}</Card>
					</div>
				</div>
			</div>
		</BackgroundGradientAnimation>
	);
}

