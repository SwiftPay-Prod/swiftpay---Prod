'use client';

import { Button, InputGroup, Label, Link, TextField } from '@heroui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { AsyncButton } from '@/components/ui/async-button';
import { getOrCreateDeviceId } from '@/utils/device';
import { DeviceVerificationForm } from './device-verification-form';
import { Icon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';

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

	const [requiresVerification, setRequiresVerification] = useState(false);
	const [maskedEmail, setMaskedEmail] = useState('');
	const [verificationId, setVerificationId] = useState('');

	useEffect(() => {
		setDeviceId(getOrCreateDeviceId());
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/auth/signin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, deviceId }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error?.message || 'Erro ao fazer login');
				return;
			}

			if (data.data?.requiresDeviceVerification) {
				setMaskedEmail(data.data.maskedEmail || email);
				setVerificationId(data.data.verificationId);
				if (data.data.deviceId) {
					setDeviceId(data.data.deviceId);
				}
				setRequiresVerification(true);
				return;
			}

			router.push(Routes.panel.merchant.dashboard);
		} catch {
			setError('Erro ao conectar com o servidor');
		} finally {
			setIsLoading(false);
		}
	}

	function handleVerificationSuccess() {
		router.push(Routes.panel.merchant.dashboard);
	}

	function handleBackToLogin() {
		setRequiresVerification(false);
		setPassword('');
		setError(null);
	}

	if (requiresVerification) {
		return (
			<DeviceVerificationForm
				verificationId={verificationId}
				maskedEmail={maskedEmail}
				deviceId={deviceId}
				onSuccess={handleVerificationSuccess}
				onBack={handleBackToLogin}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Entrar</h1>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Endereço de Email</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Digite seu email" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary"
					isRequired
					value={password}
					onChange={setPassword}
					name="password"
					type={isPasswordVisible ? 'text' : 'password'}
				>
					<Label>Senha</Label>
					<InputGroup>
						<InputGroup.Input
							placeholder="Digite sua senha"
							autoComplete="current-password"
						/>
						<InputGroup.Suffix>
							<Button
								isIconOnly
								size="sm"
								variant="ghost"
								onPress={() => setIsPasswordVisible((prev) => !prev)}
								aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
							>
								<Icon icon={isPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
							</Button>
						</InputGroup.Suffix>
					</InputGroup>
				</TextField>

				<Link onPress={onSwitchToForgotPassword} className="text-sm cursor-pointer self-end">
					Esqueceu a senha?
				</Link>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} className="w-full">
					Entrar
				</AsyncButton>
			</form>

			<div className="flex items-center gap-4">
				<div className="flex-1 border-t border-divider" />
				<span className="text-default-500 text-sm">OU</span>
				<div className="flex-1 border-t border-divider" />
			</div>

			<div className="text-center text-sm">
				<span className="text-default-500">Precisa criar uma conta? </span>
				<Link onPress={onSwitchToSignUp} className="cursor-pointer">
					Cadastre-se
				</Link>
			</div>
		</div>
	);
}

