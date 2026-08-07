'use client';

import { Button, InputGroup, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { toast } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { sendFirebasePasswordReset } from '@/lib/firebase';

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
			await sendFirebasePasswordReset(email);
			setSuccess(true);
			toast.success('Link de redefinição enviado!');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erro ao conectar com o servidor';
			setError(message);
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
				<Button variant="primary" onPress={onSwitchToSignIn} className="w-full">
					Voltar para o Login
				</Button>
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
					<InputGroup>
						<InputGroup.Input placeholder="seu@email.com" />
					</InputGroup>
				</TextField>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} className="w-full">
					Enviar link de redefinição
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
