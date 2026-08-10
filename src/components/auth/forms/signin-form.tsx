'use client';

import { Button, InputGroup, Label, Link, TextField } from '@heroui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getOrCreateDeviceId } from '@/utils/device';
import { Icon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon, GoogleIcon } from '@hugeicons/core-free-icons';
import { Separator } from '@/components/ui/separator';
import { sendEmailConfirmation, signIn } from '@/app/actions/auth';

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
	const [deviceId, setDeviceId] = useState<string>('');

	useEffect(() => {
		setDeviceId(getOrCreateDeviceId());
	}, []);

	async function handleEmailSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await signIn({ email, password, deviceId });

			if (!result?.data) {
				setError(result?.error?.message || 'Erro ao fazer login');
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
					<InputGroup>
						<InputGroup.Input placeholder="Digite seu email" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary" isRequired value={password} onChange={setPassword} name="password" type={isPasswordVisible ? 'text' : 'password'}>
					<Label>Senha</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Digite sua senha" autoComplete="current-password" />
						<InputGroup.Suffix>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => setIsPasswordVisible((prev) => !prev)} aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}>
								<Icon icon={isPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
							</Button>
						</InputGroup.Suffix>
					</InputGroup>
				</TextField>

				<div className="flex justify-end">
					<Link onPress={onSwitchToForgotPassword} className="text-sm cursor-pointer">
						Esqueceu a senha?
					</Link>
				</div>

				<Button type="submit" isPending={isLoading} variant="primary" className="w-full">
					Entrar com E-mail
				</Button>
			</form>

			<div className="text-center text-sm">
				<span className="text-default-500">Ainda não tem conta? </span>
				<button type="button" onClick={onSwitchToSignUp} className="text-primary underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0 text-sm font-medium">
					Criar Conta
				</button>
			</div>
		</div>
	);
}
