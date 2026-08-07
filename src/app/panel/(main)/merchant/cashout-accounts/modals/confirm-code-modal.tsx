'use client';

import { useState } from 'react';
import { Button, Modal, InputOTP, InputOTPGroup, InputOTPSlot } from '@heroui/react';
import { Mail01Icon, SecurityCheckIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';

interface ConfirmCodeModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onConfirm: (code: string) => void;
	onResend?: () => void;
	isPending: boolean;
	title: string;
	description: string;
}

export function ConfirmCodeModal({
	isOpen,
	onOpenChange,
	onConfirm,
	onResend,
	isPending,
	title,
	description,
}: ConfirmCodeModalProps) {
	const [code, setCode] = useState('');
	const [inputKey, setInputKey] = useState(0);
	const [isResending, setIsResending] = useState(false);

	const handleSubmit = () => {
		if (code.length === 6) {
			onConfirm(code);
			setCode('');
		}
	};

	const handleResend = async () => {
		if (onResend) {
			setIsResending(true);
			try {
				await onResend();
			} finally {
				setIsResending(false);
			}
		}
	};

	const handleClose = () => {
		if (!isPending) {
			setCode('');
			setInputKey((prev) => prev + 1);
			onOpenChange(false);
		}
	};

	const isCodeComplete = code.length === 6;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size="sm" placement="center" scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={SecurityCheckIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
						<p className="text-sm text-muted">{description}</p>
					</Modal.Header>
					<Modal.Body className="overflow-visible">
						<div className="flex flex-col items-center gap-4">
							<div className="flex justify-center overflow-visible py-2">
								<InputOTP variant="secondary" key={inputKey} maxLength={6} value={code} onChange={setCode}>
									<InputOTPGroup>
										<InputOTPSlot index={0} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
										<InputOTPSlot index={1} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
										<InputOTPSlot index={2} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
										<InputOTPSlot index={3} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
										<InputOTPSlot index={4} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
										<InputOTPSlot index={5} className="bg-surface-tertiary text-surface-tertiary-foreground border border-border" />
									</InputOTPGroup>
								</InputOTP>
							</div>
							<div className="flex flex-col items-center gap-2">
								<p className="text-xs text-muted">Verifique seu e-mail para obter o código de 6 dígitos.</p>
								{onResend && (
									<Button
										variant="ghost"
										size="sm"
										onPress={handleResend}
										isDisabled={isPending || isResending}
										className="gap-1"
									>
										<Icon icon={Mail01Icon} className="icon-xs" />
										{isResending ? 'Reenviando...' : 'Reenviar código'}
									</Button>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending} className="border border-border bg-surface-tertiary text-surface-tertiary-foreground">
							Cancelar
						</Button>
						<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending} isDisabled={!isCodeComplete}>
							Confirmar
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

