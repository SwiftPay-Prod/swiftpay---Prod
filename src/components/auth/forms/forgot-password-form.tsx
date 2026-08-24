'use client';

import { Button, InputGroup, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { toast } from '@heroui/react';
import { forgotPassword } from '@/app/actions/auth';

interface ForgotPasswordFormProps {
	onSwitchToSignIn: () => void;
}

export function ForgotPasswordForm({ onSwitchToSignIn }: ForgotPasswordFormProps) {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await forgotPassword({ email });
			if (response.error) {
				setError(response.error.message ?? 'Erro ao solicitar recuperação de senha');
				return;
			}

			setSuccess(true);
			toast.success('Se a conta existir, o link será enviado.');
		} catch {
			setError('Erro ao conectar com o servidor');
		} finally {
			setIsLoading(false);
		}
	}

	if (success) {
		return (
			<div className="flex flex-col gap-6 text-center">
				<h1 className="text-2xl font-bold">Redefinir Senha</h1>
				<p className="text-default-500">
					Enviamos um link para <span className="font-semibold text-foreground">{email}</span>. Se não encontrar, verifique o spam.
				</p>
				<p className="text-sm text-muted-foreground">
					Para evitar spam, aguarde 15 minutos entre novas solicitações.
				</p>
				<button type="button" onClick={onSwitchToSignIn} className="button-primary w-full py-3">
					Voltar para o Login
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
				<p className="text-default-500 mt-2">Informe seu e-mail para receber o link de redefinição.</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && <p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>}

				<TextField variant="secondary" isRequired value={email} onChange={setEmail} name="email" type="email">
					<Label>Endereço de Email</Label>
					<InputGroup className="h-14 rounded-[12px]">
						<InputGroup.Input placeholder="seu@email.com" />
					</InputGroup>
				</TextField>

				<Button type="submit" isPending={isLoading} className="button-primary w-full py-3 text-sm font-bold cursor-pointer">
					Enviar link de redefinição
				</Button>
			</form>

			<div className="text-center text-sm">
				<span className="text-white/40">Lembrou a senha? </span>
				<button type="button" onClick={onSwitchToSignIn} className="text-white hover:text-white/80 underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0 text-sm font-bold">
					Entrar no Painel
				</button>
			</div>
		</div>
	);
}
