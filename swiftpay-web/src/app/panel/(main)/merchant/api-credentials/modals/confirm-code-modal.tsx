'use client';

import { useState } from 'react';
import { Button, Modal, InputOTP, InputOTPGroup, InputOTPSlot } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SecurityCheckIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';

interface ConfirmCodeModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onConfirm: (code: string) => void;
	isPending: boolean;
	title: string;
	description: string;
}

export function ConfirmCodeModal({ isOpen, onOpenChange, onConfirm, isPending, title, description }: ConfirmCodeModalProps) {
	const [code, setCode] = useState('');
	const [inputKey, setInputKey] = useState(0);

	const handleSubmit = () => {
		if (code.length === 6) {
			onConfirm(code);
            setCode('');
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
							<div className="flex justify-center py-2 overflow-visible">
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
							<p className="text-xs text-muted">Verifique seu e-mail para obter o código de 6 dígitos.</p>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
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

