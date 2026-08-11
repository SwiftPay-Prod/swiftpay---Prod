'use client';

import { Button, InputGroup, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { Icon } from '@/components/ui/icon';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { resetPassword } from '@/app/actions/auth';

interface ResetPasswordFormProps {
	onSwitchToSignIn: () => void;
}

export function ResetPasswordForm({ onSwitchToSignIn }: ResetPasswordFormProps) {
	const searchParams = useSearchParams();
	const [email, setEmail] = useState(searchParams.get('email') ?? '');
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		if (newPassword !== confirmPassword) {
			setError('As senhas não coincidem');
			setIsLoading(false);
			return;
		}

		if (newPassword.length < 8) {
			setError('A senha deve ter pelo menos 8 caracteres');
			setIsLoading(false);
			return;
		}

		try {
			const response = await resetPassword({ email, code, newPassword });
			if (response.error) {
				setError(response.error.message ?? 'Código inválido ou expirado');
				return;
			}

			setSuccess(true);
			toast.success('Senha alterada com sucesso!');
		} catch {
			setError('Erro ao conectar com o servidor');
		} finally {
			setIsLoading(false);
		}
	}

	if (success) {
		return (
			<div className="flex flex-col gap-6 text-center">
				<h1 className="text-2xl font-bold">Senha alterada!</h1>
				<p className="text-default-500">Sua senha foi redefinida com sucesso. Entre com a nova senha.</p>
				<Button variant="primary" onPress={onSwitchToSignIn} className="w-full">
					Ir para o Login
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Redefinir Senha</h1>
				<p className="text-default-500 mt-2">Digite o código recebido por e-mail e defina uma nova senha.</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Email</Label>
					<InputGroup>
						<InputGroup.Input placeholder="seu@email.com" />
					</InputGroup>
				</TextField>

				<TextField variant="secondary" isRequired value={code} onChange={setCode} name="code" inputMode="numeric">
					<Label>Código de verificação</Label>
					<InputGroup>
						<InputGroup.Input placeholder="6 dígitos enviados por e-mail" />
					</InputGroup>
				</TextField>

				<TextField
					variant="secondary"
					isRequired
					value={newPassword}
					onChange={setNewPassword}
					name="newPassword"
					type={isPasswordVisible ? 'text' : 'password'}
				>
					<Label>Nova senha</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
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
					type={isPasswordVisible ? 'text' : 'password'}
				>
					<Label>Confirmar nova senha</Label>
					<InputGroup>
						<InputGroup.Input placeholder="Repita a nova senha" autoComplete="new-password" />
					</InputGroup>
				</TextField>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} className="w-full">
					Redefinir senha
				</AsyncButton>
			</form>

			<div className="text-center text-sm">
				<span className="text-default-500">Lembrou a senha? </span>
				<button type="button" onClick={onSwitchToSignIn} className="text-primary underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0 text-sm font-medium">
					Entrar
				</button>
			</div>
		</div>
	);
}
