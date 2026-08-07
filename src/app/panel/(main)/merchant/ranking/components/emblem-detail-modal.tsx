'use client';

import Image from 'next/image';
import { Modal, Button, Chip } from '@heroui/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatDateOnly } from '@/utils/datetime';
import type { PublicProfileEmblem } from '@/types/user';

interface EmblemDetailModalProps {
	emblem: PublicProfileEmblem | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EmblemDetailModal({ emblem, isOpen, onOpenChange }: EmblemDetailModalProps) {
	if (!emblem) return null;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container placement="center" scroll="outside">
				<Modal.Dialog className="max-w-xs">
					<Modal.CloseTrigger />
					<Modal.Body>
						<div className="flex flex-col items-center gap-4 py-6 px-4">
							<div className="relative w-24 h-24">
								<Image
									src={emblem.imageUrl}
									alt={emblem.title}
									fill
									className="object-contain"
									unoptimized
								/>
							</div>

							<div className="flex flex-col items-center gap-1 text-center">
								<span className="font-semibold text-base">{emblem.title}</span>
								{emblem.description && (
									<p className="text-sm text-muted">{emblem.description}</p>
								)}
							</div>

							<div className="flex flex-col items-center gap-1.5">
								<Chip size="sm" variant="soft" color="success">
									<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
									Conquistado
								</Chip>
								{emblem.earnedAt && (
									<p className="text-xs text-muted">
										em {formatDateOnly(emblem.earnedAt)}
									</p>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="primary" onPress={() => onOpenChange(false)} className="w-full">
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
