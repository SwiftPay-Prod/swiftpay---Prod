'use client';

import Image from 'next/image';
import { Modal, Button, Chip } from '@heroui/react';
import { Shield01Icon, CheckmarkCircle02Icon, LockIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { merchantLevelParse } from '@/parse';
import type { MerchantLevel } from '@/types/merchant/achievements';

interface BorderModalProps {
  level: MerchantLevel | null;
  borderImageUrl: string | null;
  isUnlocked: boolean;
  isSelected: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (level: MerchantLevel | null) => void;
  isPending: boolean;
}

export function BorderModal({
  level,
  borderImageUrl,
  isUnlocked,
  isSelected,
  isOpen,
  onOpenChange,
  onSelect,
  isPending,
}: BorderModalProps) {
  if (!level) return null;

  const parse = merchantLevelParse[level];

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center" scroll="outside">
        <Modal.Dialog className="max-w-sm">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={Shield01Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>{parse.label}</Modal.Heading>
            <p className="text-sm text-muted">{parse.description}</p>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col items-center gap-4">
              {borderImageUrl && (
                <div className="relative w-28 h-28">
                  <Image
                    src={borderImageUrl}
                    alt={parse.label}
                    fill
                    className={['object-contain', !isUnlocked && 'grayscale'].filter(Boolean).join(' ')}
                    unoptimized
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                <Chip size="sm" variant="soft" color="default" style={{ borderColor: parse.color, color: parse.color }}>
                  {parse.label}
                </Chip>
                {isUnlocked ? (
                  <Chip size="sm" variant="soft" color="success">
                    <Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
                    Desbloqueado
                  </Chip>
                ) : (
                  <Chip size="sm" variant="soft" color="default">
                    <Icon icon={LockIcon} className="icon-xs" />
                    Bloqueado
                  </Chip>
                )}
              </div>

              {!isUnlocked && (
                <p className="text-xs text-muted text-center">
                  Atinja o nível <span className="font-semibold" style={{ color: parse.color }}>{parse.label}</span> para desbloquear esta dinastia.
                </p>
              )}
            </div>
          </Modal.Body>

          {isUnlocked && (
            <Modal.Footer>
              <Button
                variant="tertiary"
                onPress={() => onOpenChange(false)}
                isDisabled={isPending}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                isPending={isPending}
                onPress={() => onSelect(isSelected ? null : level)}
              >
                {isSelected ? 'Remover Dinastia' : 'Usar Dinastia'}
              </Button>
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
