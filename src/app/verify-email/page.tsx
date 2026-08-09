'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { MailOpen01Icon, Refresh03Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import {
	onFirebaseAuthStateChanged,
	signOutFirebase,
	type FirebaseUser,
} from '@/lib/firebase';
import { sendEmailConfirmation } from '@/app/actions/auth';
import { Routes } from '@/router/routes';

export default function PublicVerifyEmailPage() {
	const router = useRouter();
	const [user, setUser] = useState<FirebaseUser | null>(null);
	const [email, setEmail] = useState<string>('');
	const [isResending, setIsResending] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		const unsubscribe = onFirebaseAuthStateChanged((firebaseUser) => {
			setUser(firebaseUser);
			setEmail(firebaseUser?.email ?? '');
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		if (user?.emailVerified) {
			void signOutFirebase().finally(() => router.replace(Routes.home));
		}
	}, [user, router]);

	async function handleResend() {
		if (!email) return;
		setIsResending(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await sendEmailConfirmation({ email });
			if (response.error) {
				throw new Error(response.error.message ?? 'Erro ao reenviar verificação.');
			}
			setSuccess(true);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erro ao reenviar verificação.';
			setError(message);
		} finally {
			setIsResending(false);
		}
	}

	async function handleReturnToLogin() {
		if (!user) {
			router.push(Routes.home);
			return;
		}

		setIsChecking(true);
		setError(null);
		try {
			await signOutFirebase();
			router.replace(`${Routes.home}?auth=signin`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.';
			setError(message);
		} finally {
			setIsChecking(false);
		}
	}

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="flex w-full max-w-lg flex-col items-center gap-6 p-8 text-center">
					<h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
					<p className="text-default-500">Acesse o login para continuar com a verificação do seu e-mail.</p>
					<Button variant="primary" onPress={() => router.push(Routes.home)} className="w-full">
						Ir para o Login
					</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="flex w-full max-w-lg flex-col items-center gap-6 p-8 text-center">
				<div className="flex flex-col items-center gap-4">
					<Icon icon={MailOpen01Icon} className="icon-xl text-warning" />
					<h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
					<p className="text-default-500">
						Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>
					</p>
				</div>

				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}
				{success && <p className="text-success text-sm text-center bg-success/10 py-2 px-4 rounded-lg">E-mail reenviado!</p>}

				<div className="flex flex-col gap-3 w-full">
					<Button variant="primary" onPress={handleResend} isPending={isResending} className="w-full">
						<Icon icon={Refresh03Icon} className="icon-sm" />
						Reenviar e-mail de verificação
					</Button>
					<Button variant="secondary" onPress={handleReturnToLogin} isPending={isChecking} className="w-full">
						<Icon icon={ArrowRight01Icon} className="icon-sm" />
						Já confirmei, entrar novamente
					</Button>
				</div>
			</Card>
		</div>
	);
}
