'use client';

import { useState } from 'react';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot, Modal } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { requestDeleteMerchant, confirmDeleteMerchant } from '@/app/actions/merchant/crud';
import { useMerchant } from '@/contexts/merchant-context';
import { toast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Alert01Icon, Mail01Icon } from '@hugeicons/core-free-icons';

interface MerchantDeleteModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function MerchantDeleteModal({ isOpen, onClose }: MerchantDeleteModalProps) {
	const router = useRouter();
	const { selectedMerchant, setSelectedMerchant, refreshMerchantList } = useMerchant();
	const [step, setStep] = useState<'request' | 'confirm'>('request');
	const [isLoading, setIsLoading] = useState(false);
	const [otp, setOtp] = useState('');

	async function handleRequestDelete() {
		if (!selectedMerchant) return;
		setIsLoading(true);
		const response = await requestDeleteMerchant(selectedMerchant.id);
		setIsLoading(false);
		if (response.error) {
			toast('Erro ao solicitar exclusão', {
				description: response.error.message,
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}
		toast('Solicitação enviada', {
			description: 'Enviamos um código para seu email.',
			indicator: <Icon icon={Mail01Icon} className="icon-sm" />,
			variant: 'success',
		});
		setStep('confirm');
	}

	async function handleConfirmDelete() {
		if (!selectedMerchant) return;
		if (otp.length !== 6) {
			toast('Código inválido', {
				description: 'Informe o código de 6 dígitos enviado por email.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}
		setIsLoading(true);
		const response = await confirmDeleteMerchant(selectedMerchant.id, otp);
		setIsLoading(false);
		if (response.error) {
			toast('Erro ao confirmar exclusão', {
				description: response.error.message,
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}
		toast('Organização excluída', {
			description: 'A organização foi excluída com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		await refreshMerchantList();
		await setSelectedMerchant(null);
		handleClose();
		router.push(Routes.panel.merchant.new);
	}

	function handleClose() {
		setStep('request');
		setOtp('');
		onClose();
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>{step === 'request' ? 'Excluir organização' : 'Confirmar exclusão'}</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="flex flex-col gap-4">
						{step === 'request' && (
							<p>
								Tem certeza que deseja excluir <strong>{selectedMerchant?.name}</strong>? Essa ação não poderá ser
								desfeita.
							</p>
						)}
						{step === 'confirm' && (
							<>
								<p>Digite o código de 6 dígitos enviado para seu email para confirmar a exclusão.</p>
								<div className="flex justify-center py-2">
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
					</Modal.Body>
					<Modal.Footer>
						<div className="flex gap-3 w-full">
							<Button variant="tertiary" onPress={handleClose} className="flex-1">
								Cancelar
							</Button>
							{step === 'request' && (
								<AsyncButton variant="danger" isPending={isLoading} onPress={handleRequestDelete} className="flex-1">
									Solicitar exclusão
								</AsyncButton>
							)}
							{step === 'confirm' && (
								<AsyncButton
									variant="danger"
									isPending={isLoading}
									onPress={handleConfirmDelete}
									className="flex-1"
									isDisabled={otp.length !== 6}
								>
									Confirmar exclusão
								</AsyncButton>
							)}
						</div>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

