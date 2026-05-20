'use client';

import { useTransition } from 'react';
import { Modal, Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Delete02Icon, Alert02Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { deleteMerchantProduct } from '@/app/actions/merchant/products';
import { toast } from '@heroui/react';
import { useRouter } from 'next/navigation';

interface DeleteProductModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	productId: string;
	productName: string;
	redirectUrl: string;
}

export function DeleteProductModal({
	isOpen,
	onOpenChange,
	merchantId,
	productId,
	productName,
	redirectUrl,
}: DeleteProductModalProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleDelete() {
		startTransition(async () => {
			const response = await deleteMerchantProduct(merchantId, productId);

			if (response?.error) {
				toast('Erro ao excluir produto', {
					description: response.error.message ?? 'Não foi possível excluir o produto.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Produto excluído', {
				description: response?.message ?? 'O produto foi excluído com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onOpenChange(false);
			router.push(redirectUrl);
		});
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="sm" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-danger/10 text-danger">
							<Icon icon={Alert02Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Excluir Produto</Modal.Heading>
						<p className="text-sm text-muted">Esta ação não pode ser desfeita</p>
					</Modal.Header>
					<Modal.Body>
						<p className="text-sm text-foreground">
							Tem certeza que deseja excluir o produto <strong>&quot;{productName}&quot;</strong>?
						</p>
						<p className="mt-2 text-sm text-muted">
							Todas as variantes, itens digitais e dados relacionados serão removidos permanentemente.
						</p>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton
							variant="danger"
							onPress={handleDelete}
							isPending={isPending}
						>
							<Icon icon={Delete02Icon} className="icon-sm" />
							Excluir
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

