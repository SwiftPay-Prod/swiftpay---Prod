'use client';

import { useState, useTransition } from 'react';
import { Link, Description, InputOTP, InputOTPGroup, InputOTPSlot } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft01Icon, ArrowReloadHorizontalIcon, LaptopIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { resendDeviceCode } from '@/app/actions/auth';

interface DeviceVerificationFormProps {
	verificationId: string;
	maskedEmail: string;
	deviceId: string;
	onSuccess: () => void;
	onBack: () => void;
}

export function DeviceVerificationForm({
	verificationId: initialVerificationId,
	maskedEmail,
	deviceId,
	onSuccess,
	onBack,
}: DeviceVerificationFormProps) {
	const [verificationId, setVerificationId] = useState(initialVerificationId);
	const [code, setCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, startResendTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [resendSuccess, setResendSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (code.length !== 6) {
			setError('Digite o código completo de 6 dígitos');
			return;
		}

		setIsLoading(true);
		setError(null);
		setResendSuccess(false);

		try {
			const response = await fetch('/api/auth/verify-device', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ verificationId, code, deviceId }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error?.message || 'Código inválido');
				setCode('');
				return;
			}

			onSuccess();
		} catch {
			setError('Erro ao conectar com o servidor');
		} finally {
			setIsLoading(false);
		}
	}

	function handleResendCode() {
		startResendTransition(async () => {
			setError(null);
			setResendSuccess(false);

			const response = await resendDeviceCode({ verificationId });

			if (response.error) {
				setError(response.error.message ?? 'Erro ao reenviar código');
				return;
			}

			if (response.data) {
				setVerificationId(response.data.verificationId);
				setCode('');
				setResendSuccess(true);
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
					<Icon icon={LaptopIcon} className="icon-lg text-accent" />
				</div>
				<div className="text-center">
					<h1 className="text-2xl font-bold">Novo dispositivo detectado</h1>
					<Description className="mt-2">
						Enviamos um código de verificação para <strong>{maskedEmail}</strong>
					</Description>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-6">
				{error && (
					<p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>
				)}

				{resendSuccess && (
					<p className="text-success text-sm text-center bg-success/10 py-2 px-4 rounded-lg">
						Código reenviado com sucesso! Verifique sua caixa de entrada.
					</p>
				)}

				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium text-foreground text-center">Digite o código de 6 dígitos</label>
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

				<div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
					<Icon icon={Mail01Icon} className="icon-md shrink-0 text-warning" />
					<p className="text-sm text-muted">Verifique sua caixa de entrada e spam. O código expira em 10 minutos.</p>
				</div>

				<AsyncButton type="submit" variant="primary" isPending={isLoading} isDisabled={code.length !== 6 || isResending} className="w-full">
					Verificar e Entrar
				</AsyncButton>
			</form>

			<div className="flex flex-col items-center gap-3">
				<Link
					onPress={handleResendCode}
					className="cursor-pointer inline-flex items-center gap-1 text-sm"
					isDisabled={isResending || isLoading}
				>
					<Icon icon={ArrowReloadHorizontalIcon} className={`icon-sm ${isResending ? 'animate-spin' : ''}`} />
					{isResending ? 'Reenviando...' : 'Reenviar código'}
				</Link>

				<Link onPress={onBack} className="cursor-pointer inline-flex items-center gap-1 text-sm text-muted">
					<Icon icon={ArrowLeft01Icon} className="icon-sm" />
					Voltar ao login
				</Link>
			</div>
		</div>
	);
}

