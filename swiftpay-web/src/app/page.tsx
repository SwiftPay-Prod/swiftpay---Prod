'use client';

import { useState } from 'react';
import { Card } from '@heroui/react';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { SignInForm } from '@/components/auth/forms/signin-form';
import { SignUpForm } from '@/components/auth/forms/signup-form';
import { ForgotPasswordForm } from '@/components/auth/forms/forgot-password-form';
import { StatusModalProvider } from '@/components/auth/status-modal-provider';
import { DeviceRevokedModalProvider } from '@/components/auth/device-revoked-modal-provider';

type AuthView = 'signin' | 'signup' | 'forgot-password';

function SwiftPayLogo() {
	return <SwiftPayBrandLogo iconSize={30} textClassName="text-2xl" />;
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
		<div className="h-dvh flex dark:bg-black bg-white">
			<StatusModalProvider />
			<DeviceRevokedModalProvider />
			<div className="hidden lg:flex lg:flex-1 bg-black dark:bg-black relative">
				<div className="flex flex-col justify-between items-start p-8 w-full">
					<SwiftPayBrandLogo iconSize={30} textClassName="text-2xl" logoSrc="/logos/swiftpay-horizontal-dark.png" />

					<div className="max-w-lg">
						<p className="text-neutral-400 text-lg leading-relaxed">
							&quot;A solu&ccedil;&atilde;o mais segura e confi&aacute;vel para seus pagamentos. Gerencie suas
							transa&ccedil;&otilde;es com total seguran&ccedil;a e praticidade.&quot;
						</p>
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col lg:max-w-xl relative bg-white">
				<div className="p-4 lg:p-6">
					<div className="lg:hidden">
						<SwiftPayLogo />
					</div>
				</div>

				<div className="flex-1 flex items-center justify-center p-4 lg:p-8">
					<Card className="w-full max-w-md p-8">{renderForm()}</Card>
				</div>
			</div>
		</div>
	);
}

