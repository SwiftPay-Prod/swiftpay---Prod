'use client';

import { Button, InputGroup, Label, Link, TextField, InputOTP, InputOTPGroup, InputOTPSlot } from '@heroui/react';
import { useState, useTransition } from 'react';
import { toast } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { forgotPassword, resetPassword } from '@/app/actions/auth';
import { Icon } from '@/components/ui/icon';
import { ArrowReloadHorizontalIcon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';

interface ForgotPasswordFormProps {
	onSwitchToSignIn: () => void;
}

type Step = 'request' | 'verify' | 'success';

export function ForgotPasswordForm({ onSwitchToSignIn }: ForgotPasswordFormProps) {
	const [step, setStep] = useState<Step>('request');
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, startResendTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [resendSuccess, setResendSuccess] = useState(false);

	async function handleRequestCode(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setResendSuccess(false);

		try {
			const requestPromise = forgotPassword({ email }).then((result) => {
				if (result.error) {
					throw new Error(result.error.message || 'Erro ao enviar código');
				}
				return result;
			});

			toast.promise(requestPromise, {
				loading: 'Enviando código...',
				success: (result) => result.message ?? 'Código enviado com sucesso!',
				error: (err) => err.message,
			});

			await requestPromise;
			setStep('verify');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Erro ao conectar com o servidor';
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}

	function handleResendCode() {
		startResendTransition(async () => {
			setError(null);
			setResendSuccess(false);

			const result = await forgotPassword({ email });

			if (result.error) {
				setError(result.error.message || 'Erro ao reenviar código');
				return;
			}

			setCode('');
			setResendSuccess(true);
		});
	}

	async function handleResetPassword(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (newPassword !== confirmPassword) {
			setError('As senhas não coincidem');
			return;
		}

		if (newPassword.length < 8) {
			setError('A senha deve ter pelo menos 8 caracteres');
			return;
		}

		setIsLoading(true);

		try {
			const resetPromise = resetPassword({ email, code, newPassword }).then((result) => {
				if (result.error) {
					throw new Error(result.error.message || 'Erro ao redefinir senha');
				}
				return result;
			});

			toast.promise(resetPromise, {
				loading: 'Redefinindo senha...',
				success: (result) => result.message ?? 'Senha alterada com sucesso!',
				error: (err) => err.message,
			});

			await resetPromise;
			setStep('success');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Erro ao conectar com o servidor';
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}

	if (step === 'success') {
		return (
			<div className="flex flex-col gap-6 text-center">
				<h1 className="text-2xl font-bold">Senha Alterada</h1>
				<p className="text-default-500">Sua senha foi redefinida com sucesso. Você já pode fazer login.</p>
				<Button variant="primary" onPress={onSwitchToSignIn} className="w-full">
					Ir para o Login
				</Button>
			</div>
		);
	}

	if (step === 'verify') {
		return (
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-bold">Redefinir Senha</h1>
					<p className="text-default-500 mt-2">
						Digite o código enviado para <span className="font-medium">{email}</span>
					</p>
				</div>

				<form onSubmit={handleResetPassword} className="flex flex-col gap-4">
					{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}

					{resendSuccess && (
						<p className="text-success text-sm text-center bg-success/10 py-2 px-4 rounded-lg">
							Código reenviado com sucesso! Verifique sua caixa de entrada.
						</p>
					)}

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-foreground">Código de Verificação</label>
						<div className="flex justify-center py-2">
							<InputOTP variant="secondary" maxLength={6} value={code} onChange={setCode}>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>

					<TextField
						variant="secondary"
						isRequired
						value={newPassword}
						onChange={setNewPassword}
						name="newPassword"
						type={isNewPasswordVisible ? 'text' : 'password'}
						autoComplete="new-password"
					>
						<Label>Nova Senha</Label>
						<InputGroup>
							<InputGroup.Input
								placeholder="Digite a nova senha"
							/>
							<InputGroup.Suffix>
								<Button
									isIconOnly
									size="sm"
									variant="ghost"
									onPress={() => setIsNewPasswordVisible((prev) => !prev)}
									aria-label={isNewPasswordVisible ? 'Ocultar nova senha' : 'Mostrar nova senha'}
								>
									<Icon icon={isNewPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
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
						autoComplete="new-password"
					>
						<Label>Confirmar Senha</Label>
						<InputGroup>
							<InputGroup.Input
								placeholder="Confirme a nova senha"
							/>
							<InputGroup.Suffix>
								<Button
									isIconOnly
									size="sm"
									variant="ghost"
									onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
									aria-label={
										isConfirmPasswordVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'
									}
								>
									<Icon icon={isConfirmPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
								</Button>
							</InputGroup.Suffix>
						</InputGroup>
					</TextField>

					<AsyncButton
						type="submit"
						variant="primary"
						isPending={isLoading}
						isDisabled={isResending}
						className="w-full"
					>
						Redefinir Senha
					</AsyncButton>
				</form>

				<div className="flex flex-col items-center gap-2 text-sm">
					<Link
						onPress={handleResendCode}
						className="cursor-pointer inline-flex items-center gap-1"
						isDisabled={isResending || isLoading}
					>
						<Icon icon={ArrowReloadHorizontalIcon} className={`icon-sm ${isResending ? 'animate-spin' : ''}`} />
						{isResending ? 'Reenviando...' : 'Reenviar código'}
					</Link>
					<Link onPress={onSwitchToSignIn} className="cursor-pointer text-default-500">
						Voltar para o login
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Esqueceu sua senha?</h1>
				<p className="text-default-500 mt-2">Digite seu email para receber um código de recuperação</p>
			</div>

			<form onSubmit={handleRequestCode} className="flex flex-col gap-4">
				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Email</Label>
					<InputGroup>
						<InputGroup.Input placeholder="seu@email.com" />
					</InputGroup>
				</TextField>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} className="w-full">
					Enviar Código
				</AsyncButton>
			</form>

			<div className="text-center">
				<Link onPress={onSwitchToSignIn} className="text-sm cursor-pointer">
					Voltar para o login
				</Link>
			</div>
		</div>
	);
}
