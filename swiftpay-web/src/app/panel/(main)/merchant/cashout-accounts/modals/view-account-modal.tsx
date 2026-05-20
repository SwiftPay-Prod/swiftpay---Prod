'use client';

import { useState } from 'react';
import {
	Button,
	Modal,
	Chip,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@heroui/react';
import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	Mail01Icon,
	SecurityCheckIcon,
	StarIcon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { CashoutAccountListData, ViewCashoutAccountData } from '@/types/merchant/cashout-accounts';
import { PayoutAccountActionType } from '@/types/enums';
import { pixKeyTypeParse, payoutAccountStatusParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { AsyncButton } from '@/components/ui/async-button';
import {
	requestCashoutAccountAction,
	viewCashoutAccount,
} from '@/app/actions/merchant/cashout-accounts';
import { toast } from '@heroui/react';

interface ViewAccountModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	account: CashoutAccountListData | null;
}

type ModalStep = 'preview' | 'verify' | 'revealed';

export function ViewAccountModal({ isOpen, onOpenChange, merchantId, account }: ViewAccountModalProps) {
	const [step, setStep] = useState<ModalStep>('preview');
	const [code, setCode] = useState('');
	const [inputKey, setInputKey] = useState(0);
	const [isPending, setIsPending] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [revealedData, setRevealedData] = useState<ViewCashoutAccountData | null>(null);

	const handleRequestCode = async () => {
		if (!account) return;

		setIsPending(true);
		try {
			const response = await requestCashoutAccountAction(merchantId, account.id, PayoutAccountActionType.View);
			if (response.error) {
				toast('Erro ao solicitar código', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
			} else {
				toast('Código enviado', {
					description: 'Verifique seu e-mail para obter o código de verificação.',
					variant: 'success',
					indicator: <Icon icon={Mail01Icon} className="icon-sm" />,
				});
				setStep('verify');
			}
		} catch {
			toast('Erro ao solicitar código', {
				description: 'Ocorreu um erro inesperado. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleVerifyCode = async () => {
		if (!account || code.length !== 6) return;

		setIsPending(true);
		try {
			const response = await viewCashoutAccount(merchantId, account.id, code);
			if (response.error) {
				toast('Código inválido', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
			} else if (response.data) {
				setRevealedData(response.data);
				setStep('revealed');
			}
		} catch {
			toast('Erro ao verificar código', {
				description: 'Ocorreu um erro inesperado. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleResendCode = async () => {
		if (!account) return;

		setIsResending(true);
		try {
			const response = await requestCashoutAccountAction(merchantId, account.id, PayoutAccountActionType.View);
			if (response.error) {
				toast('Erro ao reenviar código', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
			} else {
				toast('Código reenviado', {
					description: 'Verifique seu e-mail para obter o novo código.',
					variant: 'success',
					indicator: <Icon icon={Mail01Icon} className="icon-sm" />,
				});
				setCode('');
				setInputKey((prev) => prev + 1);
			}
		} catch {
			toast('Erro ao reenviar código', {
				description: 'Ocorreu um erro inesperado. Tente novamente.',
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
			});
		} finally {
			setIsResending(false);
		}
	};

	const handleCopyValue = (value: string, label: string) => {
		void navigator.clipboard.writeText(value).catch(() => undefined);
		toast('Copiado!', {
			description: `${label} copiado para a área de transferência.`,
			variant: 'success',
			indicator: <Icon icon={Copy01Icon} className="icon-sm" />,
		});
	};

	const handleClose = () => {
		if (!isPending) {
			setStep('preview');
			setCode('');
			setInputKey((prev) => prev + 1);
			setRevealedData(null);
			onOpenChange(false);
		}
	};

	if (!account) return null;

	const keyTypeParse = pixKeyTypeParse[account.pixKeyType];
	const statusParse = payoutAccountStatusParse[account.status];

	const renderPreviewStep = () => (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={ViewIcon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Visualizar Conta de Saque</Modal.Heading>
				<p className="text-sm text-muted">
					Para visualizar os dados completos sem máscara, confirme sua identidade.
				</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 rounded-lg bg-surface-secondary p-4">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted">Tipo de Chave</span>
							<Chip variant="soft" color="default" size="sm" className="gap-1">
								{keyTypeParse.icon}
								{keyTypeParse.label}
							</Chip>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted">Chave PIX (mascarada)</span>
							<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
								{account.pixKey}
							</code>
						</div>
						{account.holderName && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Titular</span>
								<span className="text-sm text-foreground">{account.holderName}</span>
							</div>
						)}
						{account.bankName && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Banco</span>
								<span className="text-sm text-foreground">{account.bankName}</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted">Status</span>
							<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
								{statusParse.icon}
								{statusParse.label}
							</Chip>
						</div>
						{account.isDefault && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Conta Padrão</span>
								<Chip variant="soft" color="accent" size="sm" className="gap-1">
										<Icon icon={StarIcon} className="icon-xs" />
									Sim
								</Chip>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted">Criada em</span>
							<span className="text-sm text-foreground">{formatDate(account.createdAt)}</span>
						</div>
					</div>

					<div className="rounded-lg border border-warning-soft-hover bg-warning/10 p-3">
                        <p className="text-xs text-muted">
							Para sua segurança, será enviado um código de verificação para seu e-mail cadastrado.
						</p>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
					Fechar
				</Button>
				<AsyncButton variant="primary" onPress={handleRequestCode} isPending={isPending}>
					<Icon icon={SecurityCheckIcon} className="icon-sm" />
					Solicitar Código
				</AsyncButton>
			</Modal.Footer>
		</>
	);

	const renderVerifyStep = () => (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={SecurityCheckIcon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Verificar Código</Modal.Heading>
				<p className="text-sm text-muted">
					Insira o código de 6 dígitos enviado para seu e-mail.
				</p>
			</Modal.Header>
			<Modal.Body className="overflow-visible">
				<div className="flex flex-col items-center gap-4">
					<div className="flex justify-center overflow-visible py-2">
						<InputOTP variant="secondary" key={inputKey} maxLength={6} value={code} onChange={setCode}>
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
					<div className="flex flex-col items-center gap-2">
						<p className="text-xs text-muted">
							Verifique seu e-mail para obter o código de 6 dígitos.
						</p>
						<Button
							variant="ghost"
							size="sm"
							onPress={handleResendCode}
							isDisabled={isPending || isResending}
							className="gap-1"
						>
							<Icon icon={Mail01Icon} className="icon-xs" />
							{isResending ? 'Reenviando...' : 'Reenviar código'}
						</Button>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="tertiary" onPress={() => setStep('preview')} isDisabled={isPending}>
					Voltar
				</Button>
				<AsyncButton
					variant="primary"
					onPress={handleVerifyCode}
					isPending={isPending}
					isDisabled={code.length !== 6}
				>
					Verificar
				</AsyncButton>
			</Modal.Footer>
		</>
	);

	const renderRevealedStep = () => {
		if (!revealedData) return null;

		const revealedKeyTypeParse = pixKeyTypeParse[revealedData.pixKeyType];
		const revealedStatusParse = payoutAccountStatusParse[revealedData.status];

		return (
			<>
				<Modal.Header>
					<Modal.Icon className="bg-success text-success-foreground">
						<Icon icon={CheckmarkCircle02Icon} className="icon-md" />
					</Modal.Icon>
					<Modal.Heading>Dados Completos</Modal.Heading>
					<p className="text-sm text-muted">
						Informações verificadas da conta de saque.
					</p>
				</Modal.Header>
				<Modal.Body>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-3 rounded-lg bg-surface-secondary p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Tipo de Chave</span>
								<Chip variant="soft" color="default" size="sm" className="gap-1">
									{revealedKeyTypeParse.icon}
									{revealedKeyTypeParse.label}
								</Chip>
							</div>

							<div className="flex items-center justify-between gap-2">
								<span className="text-sm text-muted">Chave PIX</span>
								<div className="flex items-center gap-2">
									<code className="rounded bg-success-soft-hover px-2 py-1 text-xs font-mono text-success">
										{revealedData.pixKey}
									</code>
									<Button
										isIconOnly
										size="sm"
										variant="ghost"
										onPress={() => handleCopyValue(revealedData.pixKey, 'Chave PIX')}
									>
										<Icon icon={Copy01Icon} className="icon-sm" />
									</Button>
								</div>
							</div>

							{revealedData.holderName && (
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm text-muted">Titular</span>
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-foreground">{revealedData.holderName}</span>
										<Button
											isIconOnly
											size="sm"
											variant="ghost"
											onPress={() => handleCopyValue(revealedData.holderName!, 'Nome do titular')}
										>
											<Icon icon={Copy01Icon} className="icon-sm" />
										</Button>
									</div>
								</div>
							)}

							{revealedData.holderDocument && (
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm text-muted">Documento</span>
									<div className="flex items-center gap-2">
										<code className="rounded bg-success-soft-hover px-2 py-1 text-xs font-mono text-success">
											{revealedData.holderDocument}
										</code>
										<Button
											isIconOnly
											size="sm"
											variant="ghost"
											onPress={() => handleCopyValue(revealedData.holderDocument!, 'Documento')}
										>
											<Icon icon={Copy01Icon} className="icon-sm" />
										</Button>
									</div>
								</div>
							)}

							{revealedData.bankName && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">Banco</span>
									<span className="text-sm text-foreground">{revealedData.bankName}</span>
								</div>
							)}

							{revealedData.bankIspb && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">ISPB</span>
									<code className="rounded bg-default/20 px-2 py-1 text-xs font-mono text-foreground">
										{revealedData.bankIspb}
									</code>
								</div>
							)}

							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Status</span>
								<Chip variant="soft" color={mapParseColorToChipColor(revealedStatusParse.color)} size="sm" className="gap-1">
									{revealedStatusParse.icon}
									{revealedStatusParse.label}
								</Chip>
							</div>

							{revealedData.isDefault && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">Conta Padrão</span>
									<Chip variant="soft" color="accent" size="sm" className="gap-1">
										<Icon icon={StarIcon} className="icon-xs" />
										Sim
									</Chip>
								</div>
							)}

							<div className="flex items-center justify-between">
								<span className="text-sm text-muted">Criada em</span>
								<span className="text-sm text-foreground">{formatDate(revealedData.createdAt)}</span>
							</div>
						</div>

						<div className="rounded-lg border border-warning-soft-hover bg-warning/10 p-3">
							<p className="text-xs text-muted">
								Estas informações são sensíveis. Ao fechar esta janela, será necessário um novo código para visualizar novamente.
							</p>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onPress={handleClose}>
						Fechar
					</Button>
				</Modal.Footer>
			</>
		);
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					{step === 'preview' && renderPreviewStep()}
					{step === 'verify' && renderVerifyStep()}
					{step === 'revealed' && renderRevealedStep()}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

