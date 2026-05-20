'use client';

import { useState, useTransition, useCallback } from 'react';
import { Button, Card } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { LogoutCircle01Icon, MailOpen01Icon, Refresh03Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { sendEmailConfirmation, signOut } from '@/app/actions/auth';
import { refreshSession } from '@/app/actions/session';
import { clearAuthCookies } from '@/auth/session';
import { Routes } from '@/router/routes';
import type { UserInfo } from '@/types/auth';
import { useStandaloneHub } from '@/hub/use-standalone-hub';
import { SignalRMethods } from '@/lib/signalr/methods';
import { SafefyBrandLogo } from '@/components/ui/safefy-brand-logo';

interface VerifyEmailContentProps {
	user: UserInfo;
	accessToken: string | null;
	apiUrl: string;
}

export function VerifyEmailContent({ user, accessToken, apiUrl }: VerifyEmailContentProps) {
	const router = useRouter();
	const [isResending, startResendTransition] = useTransition();
	const [isSigningOut, startSignOutTransition] = useTransition();
	const [isRefreshing, startRefreshTransition] = useTransition();
	const [emailSent, setEmailSent] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleEmailVerified = useCallback(async () => {
		router.push(Routes.panel.onboarding);
	}, [router]);

	useStandaloneHub({
		apiUrl,
		accessToken,
		handlers: { [SignalRMethods.EmailVerified]: handleEmailVerified },
	});

	function handleResendEmail() {
		startResendTransition(async () => {
			setErrorMessage(null);
			const response = await sendEmailConfirmation({ email: user.email });

			if (response.error) {
				setErrorMessage(response.error.message);
				return;
			}

			setEmailSent(true);
		});
	}

	function handleSignOut() {
		startSignOutTransition(async () => {
			await signOut();
			await clearAuthCookies();
			router.push(Routes.home);
		});
	}

	function handleRefresh() {
		startRefreshTransition(async () => {
			setErrorMessage(null);
			const response = await refreshSession();

			if (response.error) {
				setErrorMessage(response.error.message);
				return;
			}

			if (response.data?.emailVerified) {
				router.push(Routes.panel.onboarding);
			} else {
				setErrorMessage('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
			}
		});
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="flex w-full max-w-lg flex-col items-center gap-6 p-8 text-center">
				<div className="flex flex-col items-center gap-4">
					<SafefyBrandLogo iconSize={30} textClassName="text-3xl" />
				</div>

				<div className="flex size-20 items-center justify-center rounded-full bg-warning/10">
					<Icon icon={MailOpen01Icon} className="icon-xl text-warning" />
				</div>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
					<p className="text-default-500">
						Para continuar usando a plataforma, você precisa confirmar seu e-mail.
					</p>
					<p className="text-default-500">
						Enviamos um link de confirmação para <strong className="text-foreground">{user.email}</strong>
					</p>
				</div>

				{errorMessage && (
					<div className="w-full rounded-lg bg-danger/10 p-4 text-sm text-danger">
						{errorMessage}
					</div>
				)}

				{emailSent && (
					<div className="w-full rounded-lg bg-success/10 p-4 text-sm text-success">
						E-mail de confirmação reenviado! Verifique sua caixa de entrada.
					</div>
				)}

				<div className="flex flex-col gap-3 w-full">
					<Button
						variant="primary"
						onPress={handleResendEmail}
						isPending={isResending}
						isDisabled={isSigningOut || isRefreshing}
						className="w-full"
					>
						{!isResending && <Icon icon={MailOpen01Icon} className="icon-sm" />}
						Reenviar e-mail de confirmação
					</Button>

					<Button
						variant="secondary"
						onPress={handleRefresh}
						isPending={isRefreshing}
						isDisabled={isResending || isSigningOut}
						className="w-full"
					>
						{!isRefreshing && <Icon icon={Refresh03Icon} className="icon-sm" />}
						Já confirmei meu e-mail
					</Button>

					<Button
						variant="danger"
						onPress={handleSignOut}
						isPending={isSigningOut}
						isDisabled={isResending || isRefreshing}
						className="w-full"
					>
						{!isSigningOut && <Icon icon={LogoutCircle01Icon} className="icon-sm" />}
						Sair da conta
					</Button>
				</div>

				<p className="text-xs text-default-400">
					Não recebeu o e-mail? Verifique sua pasta de spam ou tente reenviar.
				</p>
			</Card>
		</div>
	);
}

