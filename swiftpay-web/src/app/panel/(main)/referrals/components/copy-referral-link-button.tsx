'use client';

import { Button, toast } from '@heroui/react';
import { Copy01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface CopyReferralLinkButtonProps {
  value: string;
  copiedMessage: string;
  ariaLabel?: string;
}

export function CopyReferralLinkButton({ value, copiedMessage, ariaLabel = 'Copiar' }: CopyReferralLinkButtonProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast('Copiado!', {
        description: copiedMessage,
        variant: 'success',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      });
    } catch {
      toast('Não foi possível copiar', {
        description: 'Tente copiar manualmente o link de indicação.',
        variant: 'danger',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      });
    }
  }

  return (
    <Button
      isIconOnly
      variant="tertiary"
      size="sm"
      onPress={handleCopy}
      isDisabled={!value}
      aria-label={ariaLabel}
    >
      <Icon icon={Copy01Icon} className="icon-sm" />
    </Button>
  );
}
