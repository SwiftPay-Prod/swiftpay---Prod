'use client';

import { Button } from '@heroui/react';
import { WhatsappIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface WhatsAppManagerButtonProps {
  href: string;
}

export function WhatsAppManagerButton({ href }: WhatsAppManagerButtonProps) {
  function handlePress() {
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  return (
    <Button variant="primary" className="w-full" onPress={handlePress}>
      <Icon icon={WhatsappIcon} className="icon-sm" />
      Falar com um Gerente
    </Button>
  );
}

