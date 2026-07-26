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
		<div className="min-h-dvh flex items-center justify-center bg-white p-4">
			<StatusModalProvider />
			<DeviceRevokedModalProvider />
			<div className="w-full max-w-md flex flex-col items-center gap-6">
				<SwiftPayBrandLogo iconSize={40} />
				<Card className="w-full p-8">{renderForm()}</Card>
			</div>
		</div>
	);
}

