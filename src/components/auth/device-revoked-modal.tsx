'use client';

import { Modal } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ComputerIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';

interface DeviceRevokedModalProps {
	isOpen: boolean;
	deviceName: string;
	reason?: string;
	onConfirm: () => void;
	isPending?: boolean;
}

export function DeviceRevokedModal({ isOpen, deviceName, reason, onConfirm, isPending }: DeviceRevokedModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.Header>
						<div className="flex items-center gap-2 text-warning">
							<Icon icon={ComputerIcon} className="icon-md" />
							<Modal.Heading>Dispositivo Removido</Modal.Heading>
						</div>
					</Modal.Header>
					<Modal.Body className="flex flex-col gap-3">
						<p className="text-foreground-600">
							O dispositivo <span className="font-semibold">{deviceName}</span> foi removido da sua conta.
						</p>
						{reason && (
							<p className="text-foreground-500 text-sm">{reason}</p>
						)}
						<p className="text-foreground-500 text-sm">
							Para continuar usando este dispositivo, faça login novamente.
						</p>
					</Modal.Body>
					<Modal.Footer className="flex flex-col gap-3">
						<AsyncButton variant="secondary" className="w-full" onPress={onConfirm} isPending={isPending}>
							Fazer Login
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

