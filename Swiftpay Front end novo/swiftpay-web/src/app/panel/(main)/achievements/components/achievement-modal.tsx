'use client';

import Image from 'next/image';
import { Modal, Button, Chip } from '@heroui/react';
import { CheckmarkCircle02Icon, ChampionIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatDate } from '@/utils/datetime';
import { achievementTypeParse } from '@/parse';
import type { MerchantAchievementItem } from '@/types/merchant/achievements';

interface AchievementModalProps {
  achievement: MerchantAchievementItem | null;
  isOpen: boolean;
  isSelectedEmblem: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEmblem: (id: string) => void;
  isPending: boolean;
}

export function AchievementModal({
  achievement,
  isOpen,
  isSelectedEmblem,
  onOpenChange,
  onSelectEmblem,
  isPending,
}: AchievementModalProps) {
  if (!achievement) return null;

  const typeParse = achievementTypeParse[achievement.type];

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center" scroll="outside">
        <Modal.Dialog className="max-w-sm">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={ChampionIcon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>{achievement.title}</Modal.Heading>
            <p className="text-sm text-muted">{achievement.subtitle}</p>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-28 h-28">
                <Image
                  src={achievement.imageUrl}
                  alt={achievement.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              <p className="text-sm text-foreground text-center">{achievement.description}</p>

              <div className="flex flex-wrap gap-2 justify-center">
                <Chip size="sm" variant="soft" color="default">
                  {typeParse.label}
                </Chip>
                {achievement.isEarned && (
                  <Chip size="sm" variant="soft" color="success">
                    <Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
                    Desbloqueado
                  </Chip>
                )}
              </div>

              {achievement.isEarned && achievement.earnedAt && (
                <p className="text-xs text-muted">Conquistado em {formatDate(achievement.earnedAt)}</p>
              )}
            </div>
          </Modal.Body>

          {achievement.isEarned && (
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
                onPress={() => onSelectEmblem(achievement.id)}
              >
                {isSelectedEmblem ? 'Remover Emblema' : 'Usar como Emblema'}
              </Button>
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
