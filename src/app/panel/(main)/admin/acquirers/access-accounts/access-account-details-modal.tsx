'use client';

import { Button, Modal } from '@heroui/react';
import { ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AccessAccountRow } from './types';

interface AccessAccountDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onClose: () => void;
	selectedAccountRow: AccessAccountRow | null;
	isSensitiveVisible: boolean;
	maskLogin: (value: string) => string;
	maskPassword: (value: string) => string;
	maskDescription: (value: string | null) => string;
}

export function AccessAccountDetailsModal({
	isOpen,
	onOpenChange,
	onClose,
	selectedAccountRow,
	isSensitiveVisible,
	maskLogin,
	maskPassword,
	maskDescription,
}: AccessAccountDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={ViewIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes da conta de acesso</Modal.Heading>
						<p className="text-sm text-muted">Dados da conta vinculada a adquirente selecionada.</p>
					</Modal.Header>

					<Modal.Body>
						{selectedAccountRow ? (
							<div className="flex flex-col gap-3 text-sm">
								<div className="rounded-lg border border-border bg-surface-deep p-3">
									<p className="text-xs text-muted">Adquirente</p>
									<p className="font-medium text-foreground">{selectedAccountRow.acquirerDisplayName}</p>
								</div>
								<div className="rounded-lg border border-border bg-surface-deep p-3">
									<p className="text-xs text-muted">Login</p>
									<p className="font-medium text-foreground">
										{isSensitiveVisible ? selectedAccountRow.login : maskLogin(selectedAccountRow.login)}
									</p>
								</div>
								<div className="rounded-lg border border-border bg-surface-deep p-3">
									<p className="text-xs text-muted">Senha</p>
									<p className="font-medium text-foreground">
										{isSensitiveVisible ? selectedAccountRow.password : maskPassword(selectedAccountRow.password)}
									</p>
								</div>
								<div className="rounded-lg border border-border bg-surface-deep p-3">
									<p className="text-xs text-muted">Descricao</p>
									<p className="font-medium text-foreground">
										{isSensitiveVisible
											? selectedAccountRow.description || '-'
											: maskDescription(selectedAccountRow.description)}
									</p>
								</div>
							</div>
						) : null}
					</Modal.Body>

					<Modal.Footer>
						<Button variant="secondary" onPress={onClose}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
