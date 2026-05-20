'use client';

import { useActionState } from 'react';
import { Modal, Button, toast } from '@heroui/react';
import { Alert01Icon, CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { deleteMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import type { MinimalPaymentLink } from '@/types/merchant/payment-links';

interface FormState {
  error: string | null;
}

interface DeletePaymentLinkModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  merchantId: string;
  paymentLink: MinimalPaymentLink | null;
  onSuccess: () => void;
}

export function DeletePaymentLinkModal({
  isOpen,
  onOpenChange,
  merchantId,
  paymentLink,
  onSuccess,
}: DeletePaymentLinkModalProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState): Promise<FormState> => {
      if (!paymentLink) {
        return { error: 'Link de pagamento não encontrado.' };
      }

      const response = await deleteMerchantPaymentLink(merchantId, paymentLink.id);

      if (response?.error) {
        return { error: response.error.message ?? 'Erro ao excluir link de pagamento.' };
      }

      toast('Link removido', {
        description: response?.message ?? 'O link de pagamento foi removido com sucesso.',
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });

      onSuccess();
      return { error: null };
    },
    { error: null }
  );

  function handleClose() {
    if (!isPending) {
      onOpenChange(false);
    }
  }

  if (!paymentLink) {
    return null;
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose} isDismissable={!isPending}>
      <Modal.Container size="md" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-danger text-danger-foreground">
              <Icon icon={Alert01Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Excluir Link de Pagamento</Modal.Heading>
            <p className="text-sm text-muted">Esta ação não pode ser desfeita</p>
          </Modal.Header>

          <form action={formAction}>
            <Modal.Body>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-foreground">
                  Tem certeza que deseja excluir este link de pagamento?
                </p>
                <p className="text-sm text-muted break-all">
                  <strong>URL:</strong> {paymentLink.paymentLinkUrl}
                </p>
                <p className="text-sm text-muted">
                  Após excluir, ninguém conseguirá abrir este link para gerar novas cobranças.
                </p>

                {state.error && (
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <Icon icon={Alert01Icon} className="icon-sm" />
                    <span>{state.error}</span>
                  </div>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
                Cancelar
              </Button>
              <AsyncButton type="submit" variant="danger" isPending={isPending}>
                <Icon icon={Delete02Icon} className="icon-sm" />
                Excluir link
              </AsyncButton>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
