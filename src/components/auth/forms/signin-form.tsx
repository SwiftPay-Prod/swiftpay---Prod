'use client';

import { Button, InputGroup, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getOrCreateDeviceId } from '@/utils/device';
import { Icon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { signIn } from '@/app/actions/auth';

interface SignInFormProps {
	onSwitchToSignUp: () => void;
	onSwitchToForgotPassword: () => void;
}

export function SignInForm({ onSwitchToSignUp, onSwitchToForgotPassword }: SignInFormProps) {
	const router = useRouter();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deviceId] = useState<string>(() => {
		if (typeof window === 'undefined') return '';
		return getOrCreateDeviceId();
	});
	const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
	const [createdEmail, setCreatedEmail] = useState<string>('');

	async function handleEmailSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await signIn({ email, password, deviceId });

			if (!result?.data) {
				if (result?.error?.code === 'EMAIL_NOT_VERIFIED') {
					setCreatedEmail(email);
					setRequiresEmailVerification(true);
					return;
				}
				setError(result?.error?.message || 'Erro ao fazer login');
				return;
			}

			const user = result.data.auth?.user;
			if (user && user.emailVerified === false) {
				setCreatedEmail(email);
				setRequiresEmailVerification(true);
				return;
			}

			router.push(Routes.panel.dashboard);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erro ao conectar com o servidor';
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}

	if (requiresEmailVerification) {
		return (
			<div className="flex flex-col gap-4 text-center">
				<h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
				<p className="text-default-500">
					Seu e-mail <span className="font-semibold text-foreground">{createdEmail}</span> ainda não foi confirmado.
				</p>
				<p className="text-sm text-muted-foreground">
					Enviamos um link de verificação na criação da conta. Confirme para acessar o painel.
				</p>
				<div className="flex flex-col gap-2">
					<button type="button" onClick={() => router.push(Routes.verifyEmail)} className="button-primary w-full py-3">
						Ir para página de verificação
					</button>
					<button type="button" onClick={() => setRequiresEmailVerification(false)} className="button-outline-dark w-full py-3">
						Voltar para o login
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Entrar</h1>
			</div>

			<form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
				{error && (
					<p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>
				)}

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Endereço de Email</Label>
					<InputGroup className="h-14 rounded-[12px]">
						<InputGroup.Input placeholder="Digite seu email" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary" isRequired value={password} onChange={setPassword} name="password" type={isPasswordVisible ? 'text' : 'password'}>
					<Label>Senha</Label>
					<InputGroup className="h-14 rounded-[12px]">
						<InputGroup.Input placeholder="Digite sua senha" autoComplete="current-password" />
						<InputGroup.Suffix>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => setIsPasswordVisible((prev) => !prev)} aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}>
								<Icon icon={isPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
							</Button>
						</InputGroup.Suffix>
					</InputGroup>
				</TextField>

				<div className="flex justify-end">
					<button type="button" onClick={onSwitchToForgotPassword} className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0">
						Esqueceu a senha?
					</button>
				</div>

				<Button type="submit" isPending={isLoading} className="button-primary w-full py-3 text-sm font-bold cursor-pointer">
					Entrar com E-mail
				</Button>
			</form>

			<div className="text-center text-sm">
				<span className="text-white/40">Ainda não tem conta? </span>
				<button type="button" onClick={onSwitchToSignUp} className="text-white hover:text-white/80 underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0 text-sm font-bold">
					Criar Conta
				</button>
			</div>
		</div>
	);
}
