'use client';

import { useState, type ReactNode } from 'react';
import { Button, Modal, TextArea, Label } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Alert01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from './async-button';

type ModalStatus = 'danger' | 'warning' | 'accent' | 'success' | 'default';

interface ConfirmationModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	status?: ModalStatus;
	icon?: ReactNode;
	requireReason?: boolean;
	reasonLabel?: string;
	reasonPlaceholder?: string;
	isPending?: boolean;
	error?: string | null;
	onConfirm: (reason?: string) => void | Promise<void>;
	children?: ReactNode;
}

const statusIcons: Record<ModalStatus, ReactNode> = {
	danger: <Icon icon={Alert01Icon} className="icon-md" />,
	warning: <Icon icon={Alert01Icon} className="icon-md" />,
	accent: <Icon icon={InformationCircleIcon} className="icon-md" />,
	success: <Icon icon={InformationCircleIcon} className="icon-md" />,
	default: <Icon icon={InformationCircleIcon} className="icon-md" />,
};

const statusClasses: Record<ModalStatus, string> = {
	danger: 'bg-danger text-danger-foreground',
	warning: 'bg-warning text-warning-foreground',
	accent: 'bg-accent text-accent-foreground',
	success: 'bg-success text-success-foreground',
	default: 'bg-default text-default-foreground',
};

export function ConfirmationModal({
	isOpen,
	onOpenChange,
	title,
	description,
	confirmLabel = 'Confirmar',
	cancelLabel = 'Cancelar',
	status = 'danger',
	icon,
	requireReason = false,
	reasonLabel = 'Motivo',
	reasonPlaceholder = 'Informe o motivo...',
	isPending = false,
	error: externalError,
	onConfirm,
	children,
}: ConfirmationModalProps) {
	const [reason, setReason] = useState('');
	const [internalError, setInternalError] = useState<string | null>(null);

	const displayError = externalError || internalError;

	const handleConfirm = async () => {
		if (requireReason && !reason.trim()) {
			setInternalError('O motivo é obrigatório.');
			return;
		}

		setInternalError(null);
		await onConfirm(requireReason ? reason.trim() : undefined);
		setReason('');
	};

	const handleClose = () => {
		if (!isPending) {
			setReason('');
			setInternalError(null);
			onOpenChange(false);
		}
	};

	const hasBody = children || requireReason || displayError;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
			<Modal.Container size='lg' placement='center' scroll="outside">
				<Modal.Dialog>
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className={statusClasses[status]}>{icon || statusIcons[status]}</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
						{description && <p className="text-sm text-muted">{description}</p>}
					</Modal.Header>
					{hasBody && (
						<Modal.Body>
							<div className="flex flex-col gap-4">
								{children}
								{requireReason && (
									<div className="flex flex-col gap-2">
										<Label>{reasonLabel}</Label>
										<TextArea variant="secondary"
											placeholder={reasonPlaceholder}
											value={reason}
											onChange={(e) => {
												setReason(e.target.value);
												if (internalError) setInternalError(null);
											}}
											className="min-h-24"
											disabled={isPending}
										/>
									</div>
								)}
								{displayError && <span className="text-sm text-danger">{displayError}</span>}
							</div>
						</Modal.Body>
					)}
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							{cancelLabel}
						</Button>
						<AsyncButton
							variant="primary"
							className={statusClasses[status]}
							onPress={handleConfirm}
							isPending={isPending}
							isDisabled={requireReason && !reason.trim()}
						>
							{confirmLabel}
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

