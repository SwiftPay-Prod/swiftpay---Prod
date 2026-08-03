'use client';

import { Button, Modal } from '@heroui/react';
import { Alert01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import type { AdminPlatformPayoutAccountData } from '@/types/admin/platform-payouts';

interface DeleteModalProps {
	isOpen: boolean;
	account: AdminPlatformPayoutAccountData | null;
	onOpenChange: (isOpen: boolean) => void;
	isDeleting: boolean;
	onConfirm: () => void;
}

export function AdminDeletePlatformPayoutAccountModal({
	isOpen,
	account,
	onOpenChange,
	isDeleting,
	onConfirm,
}: DeleteModalProps) {
	function handleClose() {
		if (isDeleting) return;
		onOpenChange(false);
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isDeleting}>
			<Modal.Container size="md" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-danger text-danger-foreground">
							<Icon icon={Alert01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Excluir Conta de Saque</Modal.Heading>
						<p className="text-sm text-muted">
							Tem certeza que deseja excluir esta conta?
						</p>
					</Modal.Header>
					<Modal.Body>
						{account && (
							<div className="flex flex-col gap-2 rounded-lg border border-danger-soft-hover bg-danger/5 p-4">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">Chave PIX</span>
									<span className="font-mono text-sm font-medium">{account.pixKey}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted">Titular</span>
									<span className="text-sm font-medium">{account.holderName || '—'}</span>
								</div>
								{account.bankName && (
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted">Banco</span>
										<span className="text-sm font-medium">{account.bankName}</span>
									</div>
								)}
							</div>
						)}
						<p className="mt-3 text-sm text-muted">
							Esta ação não pode ser desfeita. A conta não poderá mais ser utilizada para novos saques da plataforma.
						</p>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isDeleting}>
							Cancelar
						</Button>
						<AsyncButton variant="danger" onPress={onConfirm} isPending={isDeleting}>
							Excluir Conta
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

