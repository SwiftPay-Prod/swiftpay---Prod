'use client';

import { Modal } from '@heroui/react';
import { UserStatus } from '@/types/enums';
import { Icon } from '@/components/ui/icon';
import { Alert01Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';

interface UserStatusModalProps {
	isOpen: boolean;
	status: UserStatus;
	reason?: string | null;
	onConfirm: () => void;
	isPending?: boolean;
}

export function UserStatusModal({ isOpen, status, reason, onConfirm, isPending }: UserStatusModalProps) {
	const title = status === UserStatus.Suspended ? 'Conta Suspensa' : 'Conta Inativa';
	const defaultReason =
		status === UserStatus.Suspended
			? 'Sua conta foi suspensa pelo administrador.'
			: 'Sua conta foi inativada pelo administrador.';

	return (
		<Modal.Backdrop isOpen={isOpen}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.Header>
						<div className="flex items-center gap-2 text-danger">
							<Icon icon={Alert01Icon} className="icon-md" />
							<Modal.Heading>{title}</Modal.Heading>
						</div>
					</Modal.Header>
					<Modal.Body>
						<p className="text-foreground-600">{reason || defaultReason}</p>
					</Modal.Body>
					<Modal.Footer className="flex flex-col gap-3">
						<AsyncButton variant="danger" className="w-full" onPress={onConfirm} isPending={isPending}>
							Eu entendo
						</AsyncButton>
						<p className="text-xs text-foreground-400 text-center">
							Se tiver dúvidas, entre em contato com o suporte.
						</p>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

