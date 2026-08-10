'use client';

import { Button, InputGroup, Label, Link, TextField } from '@heroui/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@heroui/react';
import { Routes } from '@/router/routes';
import { AsyncButton } from '@/components/ui/async-button';
import { getOrCreateDeviceId } from '@/utils/device';
import { Icon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { Separator } from '@/components/ui/separator';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { isValidPhone } from '@/utils/validations';
import { signUp as signUpAction } from '@/app/actions/auth';

interface SignUpFormProps {
	onSwitchToSignIn: () => void;
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [whatsApp, setWhatsApp] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deviceId, setDeviceId] = useState<string>('');
	const [refCode, setRefCode] = useState<string>('');
	const [isReferralValid, setIsReferralValid] = useState(false);
	const [isReferralLoading, setIsReferralLoading] = useState(false);
	const [referralError, setReferralError] = useState<string | null>(null);
	const [referralOwnerName, setReferralOwnerName] = useState<string>('');
	const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
	const [createdEmail, setCreatedEmail] = useState<string>('');

	useEffect(() => {
		setDeviceId(getOrCreateDeviceId());
	}, []);

	useEffect(() => {
		const rawCode = searchParams.get('refCode')?.trim();
		const code = rawCode?.toUpperCase() ?? '';

		setRefCode(code);
		setIsReferralValid(false);
		setReferralError(null);
		setReferralOwnerName('');

		if (!code) {
			return;
		}

		let cancelled = false;
		setIsReferralLoading(true);

		fetch(`/api/auth/referrals/${encodeURIComponent(code)}`)
			.then(async (response) => {
				const data = await response.json();

				if (!response.ok || !data?.data?.ownerName) {
					throw new Error(data?.error?.message ?? 'Código de indicação inválido');
				}

				if (!cancelled) {
					setIsReferralValid(true);
					setReferralOwnerName(String(data.data.ownerName));
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setIsReferralValid(false);
					setReferralOwnerName('');
					setReferralError(err instanceof Error ? err.message : 'Código de indicação inválido');
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsReferralLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [searchParams]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		if (password !== confirmPassword) {
			setError('As senhas não coincidem');
			setIsLoading(false);
			return;
		}

		if (!whatsApp || !isValidPhone(whatsApp)) {
			setError('Informe um WhatsApp válido com o DDI do país');
			setIsLoading(false);
			return;
		}

		try {
			const result = await signUpAction({
				name,
				email,
				whatsApp,
				password,
				deviceId: deviceId || undefined,
				refCode: refCode || undefined,
			});

			if (!result?.data) {
				setError(result?.error?.message || 'Erro ao criar conta');
				return;
			}

			toast.success('Conta criada com sucesso!');
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
					Enviamos um link de verificação para <span className="font-semibold text-foreground">{createdEmail}</span>.
				</p>
				<p className="text-sm text-muted-foreground">
					Depois de confirmar, entre com E-mail para acessar o painel.
				</p>
				<div className="flex flex-col gap-2">
					<Button variant="primary" onPress={() => router.push(Routes.verifyEmail)}>
						Ir para página de verificação
					</Button>
					<Button variant="tertiary" onPress={onSwitchToSignIn}>
						Já verifiquei, quero entrar
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Criar Conta</h1>
				<p className="text-default-500 mt-2">Crie sua conta com E-mail</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}
				{referralError && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{referralError}</p>}
				{Boolean(refCode && isReferralValid && referralOwnerName) && (
					<p className="text-accent text-sm text-center bg-accent-soft py-2 px-4 rounded-lg border border-accent-soft-hover">
						Você está sendo indicado por <span className="text-accent font-bold">{referralOwnerName}</span>.
					</p>
				)}

				<TextField variant="secondary" isRequired value={name} onChange={setName} name="name">
					<Label>Nome</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Seu nome" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Email</Label>
					<InputGroup>
						<InputGroup.Input placeholder="seu@email.com" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary" isRequired name="whatsApp">
					<Label>WhatsApp</Label>
					<InternationalPhoneInput
						name="whatsApp"
						value={whatsApp}
						defaultCountry="br"
						required
						placeholder="Ex: +55 99 91234-5678"
						onChange={setWhatsApp}
					/>
				</TextField>

				<TextField
					variant="secondary"
					isRequired
					value={password}
					onChange={setPassword}
					name="password"
					type={isPasswordVisible ? 'text' : 'password'}
				>
					<Label>Senha</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Digite sua senha" autoComplete="new-password" />
						<InputGroup.Suffix>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => setIsPasswordVisible((prev) => !prev)} aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}>
								<Icon icon={isPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
							</Button>
						</InputGroup.Suffix>
					</InputGroup>
				</TextField>

				<TextField
					variant="secondary"
					isRequired
					value={confirmPassword}
					onChange={setConfirmPassword}
					name="confirmPassword"
					type={isConfirmPasswordVisible ? 'text' : 'password'}
				>
					<Label>Confirmar Senha</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Confirme sua senha" autoComplete="new-password" />
						<InputGroup.Suffix>
							<Button isIconOnly size="sm" variant="ghost" onPress={() => setIsConfirmPasswordVisible((prev) => !prev)} aria-label={isConfirmPasswordVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}>
								<Icon icon={isConfirmPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
							</Button>
						</InputGroup.Suffix>
					</InputGroup>
				</TextField>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} isDisabled={Boolean(refCode && (isReferralLoading || referralError || !isReferralValid))} className="w-full">
					Criar Conta com E-mail
				</AsyncButton>
			</form>
		</div>
	);
}
