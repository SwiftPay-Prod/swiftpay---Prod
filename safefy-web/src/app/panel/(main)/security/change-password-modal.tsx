'use client';

import { useState, useTransition } from 'react';
import {
	Modal,
	TextField,
	Label,
	InputGroup,
	Description,
	Button,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Key01Icon,
	Mail01Icon,
	SecurityLockIcon,
	ViewIcon,
	ViewOffIcon,
} from '@hugeicons/core-free-icons';
import { requestChangePassword, confirmChangePassword } from '@/app/actions/user';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';

interface ChangePasswordModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

export function ChangePasswordModal({ isOpen, onOpenChange }: ChangePasswordModalProps) {
	const [isPending, startTransition] = useTransition();
	const [step, setStep] = useState<'password' | 'otp'>('password');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [otp, setOtp] = useState('');
	const [error, setError] = useState<string | null>(null);

	function resetForm() {
		setStep('password');
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setIsCurrentPasswordVisible(false);
		setIsNewPasswordVisible(false);
		setIsConfirmPasswordVisible(false);
		setOtp('');
		setError(null);
	}

	function handleClose() {
		if (!isPending) {
			resetForm();
			onOpenChange(false);
		}
	}

	function handleRequestChange() {
		setError(null);

		if (newPassword !== confirmPassword) {
			setError('As senhas não coincidem');
			return;
		}

		if (newPassword.length < 8) {
			setError('A nova senha deve ter pelo menos 8 caracteres');
			return;
		}

		startTransition(async () => {
			const loadingId = toast('Enviando código de verificação', {
				description: 'Aguarde enquanto processamos sua solicitação.',
				isLoading: true,
				timeout: 0,
				variant: 'default',
			});

			const requestPromise = requestChangePassword({
				currentPassword,
				newPassword,
			}).then((response) => {
				if (response.error) {
				throw new Error(response.error.message ?? 'Erro ao solicitar alteração de senha');
			}
			return response;
		});

		try {
				await requestPromise;
				toast.close(loadingId);
				toast('Código enviado', {
					description: 'Verifique seu email para continuar a alteração.',
					actionProps: {
						children: 'Ok',
						onPress: () => toast.clear(),
						variant: 'tertiary',
					},
					indicator: <Icon icon={Mail01Icon} className="icon-sm" />,
					variant: 'success',
				});
				setStep('otp');
			} catch (error) {
				toast.close(loadingId);
				const message = error instanceof Error ? error.message : 'Erro ao solicitar alteração';
				toast('Não foi possível enviar o código', {
					description: message,
					actionProps: {
						children: 'Fechar',
						onPress: () => toast.clear(),
						variant: 'tertiary',
					},
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				setError(message);
			}
		});
	}

	function handleConfirmChange() {
		if (otp.length !== 6) {
			setError('Digite o código de 6 dígitos');
			return;
		}

		setError(null);

		startTransition(async () => {
			const loadingId = toast('Confirmando alteração', {
				description: 'Validando o código informado.',
				isLoading: true,
				timeout: 0,
				variant: 'default',
			});

			const confirmPromise = confirmChangePassword({ code: otp }).then((response) => {
				if (response.error) {
					throw new Error(response.error.message ?? 'Erro ao confirmar alteração de senha');
				}
				return response;
			});

			try {
				await confirmPromise;
				toast.close(loadingId);
				toast('Senha alterada com sucesso', {
					description: 'Sua senha foi atualizada e já está valendo.',
					actionProps: {
						children: 'Ok',
						onPress: () => toast.clear(),
						variant: 'tertiary',
					},
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				handleClose();
			} catch (error) {
				toast.close(loadingId);
				const message = error instanceof Error ? error.message : 'Erro ao confirmar alteração';
				toast('Não foi possível alterar a senha', {
					description: message,
					actionProps: {
						children: 'Fechar',
						onPress: () => toast.clear(),
						variant: 'tertiary',
					},
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				setError(message);
			}
		});
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							{step === 'password' ? (
								<Icon icon={Key01Icon} className="icon-md" />
							) : (
								<Icon icon={Mail01Icon} className="icon-md" />
							)}
						</Modal.Icon>
						<Modal.Heading>{step === 'password' ? 'Alterar Senha' : 'Confirmar Alteração'}</Modal.Heading>
						<p className="text-sm text-muted">
							{step === 'password'
								? 'Defina uma nova senha para sua conta'
								: 'Digite o código enviado para seu email'}
						</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							{error && (
								<p className="text-danger text-sm text-center bg-danger/10 py-2 px-4 rounded-lg">{error}</p>
							)}

							{step === 'password' && (
								<>
									<TextField variant="secondary"
										isRequired
										value={currentPassword}
										onChange={setCurrentPassword}
										type={isCurrentPasswordVisible ? 'text' : 'password'}
										autoComplete="current-password"
									>
										<Label>Senha Atual</Label>
										<InputGroup>
											<InputGroup.Input
												placeholder="Digite sua senha atual"
											/>
											<InputGroup.Suffix>
												<Button
													isIconOnly
													size="sm"
													variant="ghost"
													onPress={() => setIsCurrentPasswordVisible((prev) => !prev)}
													aria-label={isCurrentPasswordVisible ? 'Ocultar senha atual' : 'Mostrar senha atual'}
												>
													<Icon icon={isCurrentPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
												</Button>
											</InputGroup.Suffix>
										</InputGroup>
									</TextField>

									<TextField variant="secondary"
										isRequired
										value={newPassword}
										onChange={setNewPassword}
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
										<Description>
											Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
										</Description>
									</TextField>

									<TextField variant="secondary"
										isRequired
										value={confirmPassword}
										onChange={setConfirmPassword}
										type={isConfirmPasswordVisible ? 'text' : 'password'}
										autoComplete="new-password"
									>
										<Label>Confirmar Nova Senha</Label>
										<InputGroup>
											<InputGroup.Input
												placeholder="Digite novamente a nova senha"
											/>
											<InputGroup.Suffix>
												<Button
													isIconOnly
													size="sm"
													variant="ghost"
													onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
													aria-label={isConfirmPasswordVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
												>
													<Icon icon={isConfirmPasswordVisible ? ViewOffIcon : ViewIcon} className="icon-sm" />
												</Button>
											</InputGroup.Suffix>
										</InputGroup>
									</TextField>
								</>
							)}

							{step === 'otp' && (
								<>
									<p className="text-center text-muted">
										Enviamos um código de verificação para seu email. Digite o código abaixo para confirmar a
										alteração de senha.
									</p>
									<div className="flex justify-center py-4">
										<InputOTP variant="secondary" maxLength={6} value={otp} onChange={setOtp}>
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
								</>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						{step === 'password' && (
							<AsyncButton variant="primary" isPending={isPending} onPress={handleRequestChange}>
								<Icon icon={SecurityLockIcon} className="icon-sm" />
								Alterar Senha
							</AsyncButton>
						)}
						{step === 'otp' && (
							<AsyncButton
								variant="primary"
								isPending={isPending}
								onPress={handleConfirmChange}
								isDisabled={otp.length !== 6}
							>
								<Icon icon={SecurityLockIcon} className="icon-sm" />
								Confirmar
							</AsyncButton>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

