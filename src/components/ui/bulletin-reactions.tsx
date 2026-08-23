'use client';

import { useState, useTransition } from 'react';
import { Button, Popover, Skeleton, Tooltip } from '@heroui/react';
import { SmileIcon } from '@hugeicons/core-free-icons';
import { EmojiPicker } from 'frimousse';
import { reactToBulletin } from '@/app/actions/user';
import { Icon } from './icon';

interface BulletinReactionsProps {
	bulletinId: string;
	userReactions: string[];
	reactionCounts: Record<string, number>;
	onReactionChange?: (userReactions: string[], reactionCounts: Record<string, number>) => void;
}

export function BulletinReactions({
	bulletinId,
	userReactions,
	reactionCounts,
	onReactionChange,
}: BulletinReactionsProps) {
	const [isPending, startTransition] = useTransition();
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	const sortedEmojis = Object.entries(reactionCounts)
		.filter(([, count]) => count > 0)
		.sort((a, b) => b[1] - a[1]);

	const totalReactions = sortedEmojis.reduce((sum, [, count]) => sum + count, 0);

	function handleReaction(emoji: string) {
		startTransition(async () => {
			try {
				const res = await reactToBulletin(bulletinId, { emoji });
				const resData = res?.data;
				if (resData) {
					onReactionChange?.(resData.userReactions, resData.reactionCounts);
				}
			} catch {
				// Silent fail
			}
		});
	}

	function handleEmojiSelect(emoji: string) {
		setIsPickerOpen(false);
		handleReaction(emoji);
	}

	return (
		<div className="flex items-center justify-between gap-2">
			<div className="flex items-center gap-2 flex-wrap">
				{sortedEmojis.map(([emoji, count]) => {
					const isSelected = userReactions.includes(emoji);

					return (
						<Button
							key={emoji}
							variant={isSelected ? 'secondary' : 'tertiary'}
							size="sm"
							onPress={() => handleReaction(emoji)}
							isDisabled={isPending}
							className={`min-w-0 gap-1 px-2 ${isSelected ? 'ring-2 ring-accent/50' : ''}`}
						>
							<span className="text-base leading-none">{emoji}</span>
							<span className="text-xs font-medium">{count}</span>
						</Button>
					);
				})}

				<Popover isOpen={isPickerOpen} onOpenChange={setIsPickerOpen}>
					<Tooltip>
						<Button variant="primary" size="sm" isIconOnly isDisabled={isPending} className="">
							<Icon icon={SmileIcon} className="icon-sm" />
						</Button>
						<Tooltip.Content>Adicionar reação</Tooltip.Content>
					</Tooltip>
					<Popover.Trigger />

					<Popover.Content className="p-0 w-fit">
						<EmojiPicker.Root
							onEmojiSelect={({ emoji }) => handleEmojiSelect(emoji)}
							className="isolate flex h-80 w-fit flex-col bg-surface text-foreground rounded-lglg"
							locale="pt"
						>
							<EmojiPicker.Search
								className="z-10 mx-2 mt-2 appearance-none rounded-md bg-surface-secondary px-2.5 py-2 text-sm outline-none placeholder:text-muted"
								placeholder="Buscar emoji..."
							/>
							<EmojiPicker.Viewport className="flex-1 outline-none overflow-y-auto">
								<EmojiPicker.Loading className="flex h-full items-center justify-center text-sm text-muted">
									Carregando...
								</EmojiPicker.Loading>
								<EmojiPicker.Empty className="flex h-full items-center justify-center text-sm text-muted">
									Nenhum emoji encontrado
								</EmojiPicker.Empty>
								<EmojiPicker.List
									className="select-none pb-1.5"
									components={{
										CategoryHeader: ({ category, ...props }) => (
											<div className="bg-surface px-3 py-2 text-xs font-medium text-muted sticky top-0" {...props}>
												{category.label}
											</div>
										),
										Row: ({ children, ...props }) => (
											<div className="flex scroll-mt-6 px-1.5" {...props}>
												{children}
											</div>
										),
										Emoji: ({ emoji, ...props }) => (
											<button
												type="button"
												className="flex size-8 items-center justify-center rounded text-lg hover:bg-accent/10 transition-colors data-active:bg-accent/10"
												{...props}
											>
												{emoji.emoji}
											</button>
										),
									}}
								/>
							</EmojiPicker.Viewport>
						</EmojiPicker.Root>
					</Popover.Content>
				</Popover>
			</div>

			{totalReactions > 0 && (
				<span className="text-xs text-muted shrink-0">
					{totalReactions} {totalReactions === 1 ? 'reação' : 'reações'}
				</span>
			)}
		</div>
	);
}

export function BulletinReactionsSkeleton() {
	return (
		<div className="flex items-center gap-1">
			<Skeleton className="h-8 w-8 rounded-lg" />
		</div>
	);
}

