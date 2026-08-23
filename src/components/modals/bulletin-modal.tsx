'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@heroui/react';
import { AsyncButton } from '@/components/ui/async-button';
import { RichTextPreview } from '@/components/ui/rich-text-preview';
import { BulletinReactions, BulletinReactionsSkeleton } from '@/components/ui/bulletin-reactions';
import { getBulletinContent } from '@/app/actions/user';
import type { UnreadBulletin, BulletinContent } from '@/types/user/bulletins';
import { News01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui/icon';

interface BulletinModalProps {
	bulletin: UnreadBulletin | null;
	isMarking: boolean;
	onMarkAsRead: () => Promise<void>;
	totalBulletins: number;
	currentIndex: number;
}

export function BulletinModal({
	bulletin,
	isMarking,
	onMarkAsRead,
	totalBulletins,
	currentIndex,
}: BulletinModalProps) {
	const [fetchedContent, setFetchedContent] = useState<{ bulletinId: string; content: BulletinContent | null } | null>(
		null
	);

	const bulletinId = bulletin?.id;
	const isLoadingContent = bulletinId ? fetchedContent?.bulletinId !== bulletinId : false;
	const bulletinContent =
		fetchedContent && fetchedContent.bulletinId === bulletinId ? fetchedContent.content : null;

	useEffect(() => {
		if (!bulletinId) return;

		let cancelled = false;

		getBulletinContent(bulletinId).then((res) => {
			if (!cancelled) {
				setFetchedContent({ bulletinId, content: res?.data ?? null });
			}
		});

		return () => {
			cancelled = true;
		};
	}, [bulletinId]);

	function handleReactionChange(userReactions: string[], reactionCounts: Record<string, number>) {
		if (!bulletinId || !fetchedContent?.content) return;
		setFetchedContent({
			bulletinId,
			content: { ...fetchedContent.content, userReactions, reactionCounts },
		});
	}

	if (!bulletin) return null;

	const hasMultiple = totalBulletins > 1;
	const remaining = totalBulletins - currentIndex;

	return (
		<Modal.Backdrop isOpen={!!bulletin} onOpenChange={() => {}}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<div className="flex items-center gap-3">
							<div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-accent/10 text-accent">
								<Icon icon={News01Icon} className="icon-md" />
							</div>
							<div className="flex flex-col gap-0.5">
								<Modal.Heading>{bulletin.title}</Modal.Heading>
								{hasMultiple && (
									<p className="text-sm text-muted">
										Informativo {currentIndex + 1} de {totalBulletins}
									</p>
								)}
							</div>
						</div>
					</Modal.Header>
					<Modal.Body className="flex flex-col gap-4 text-foreground">
						<RichTextPreview content={bulletin.content} />

						<div className="border-t border-border pt-4">
							{isLoadingContent ? (
								<BulletinReactionsSkeleton />
							) : bulletinContent ? (
								<BulletinReactions
									bulletinId={bulletin.id}
									userReactions={bulletinContent.userReactions}
									reactionCounts={bulletinContent.reactionCounts}
									onReactionChange={handleReactionChange}
								/>
							) : null}
						</div>
					</Modal.Body>
					<Modal.Footer className="flex-col gap-2 sm:flex-row">
						<AsyncButton
							variant="primary"
							onPress={onMarkAsRead}
							isPending={isMarking}
							className="w-full sm:w-auto"
						>
							{hasMultiple && remaining > 1 ? `Marcar como lido (${remaining} restantes)` : 'Marcar como lido'}
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

