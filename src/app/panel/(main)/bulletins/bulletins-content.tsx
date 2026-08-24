'use client';

import { use, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Chip } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	Calendar03Icon,
	CheckmarkCircle02Icon,
	News01Icon,
} from '@hugeicons/core-free-icons';
import { formatRelativeTime } from '@/utils/datetime';
import { getBulletinContent } from '@/app/actions/user';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { RichTextPreview } from '@/components/ui/rich-text-preview';
import { ExpandableList, ExpandableListContentSkeleton } from '@/components/ui/expandable-list';
import { BulletinReactions } from '@/components/ui/bulletin-reactions';
import type { ApiResponse } from '@/types/common';
import type { BulletinListItem, BulletinContent } from '@/types/user/bulletins';

type BulletinsPromise = Promise<ApiResponse<BulletinListItem[]>>;

interface BulletinsContentProps {
	bulletinsPromise: BulletinsPromise;
}

export function BulletinsContent({ bulletinsPromise }: BulletinsContentProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [loadedContents, setLoadedContents] = useState<Record<string, BulletinContent | null>>({});
	const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
	const [updatedReactions, setUpdatedReactions] = useState<
		Record<string, { userReactions: string[]; reactionCounts: Record<string, number> }>
	>({});

	const response = use(bulletinsPromise);
	const bulletins = response?.data ?? [];

	function handleRefresh() {
		startTransition(() => router.refresh());
	}

	async function handleToggle(bulletinId: string) {
		const isExpanded = expandedId === bulletinId;

		if (isExpanded) {
			setExpandedId(null);
			return;
		}

		setExpandedId(bulletinId);

		if (!loadedContents[bulletinId] && !loadingIds.has(bulletinId)) {
			setLoadingIds((prev) => new Set([...prev, bulletinId]));
			try {
				const res = await getBulletinContent(bulletinId);
				setLoadedContents((prev) => ({ ...prev, [bulletinId]: res?.data ?? null }));
			} catch {
				setLoadedContents((prev) => ({ ...prev, [bulletinId]: null }));
			} finally {
				setLoadingIds((prev) => {
					const next = new Set(prev);
					next.delete(bulletinId);
					return next;
				});
			}
		}
	}

	function handleReactionChange(bulletinId: string, userReactions: string[], reactionCounts: Record<string, number>) {
		setUpdatedReactions((prev) => ({
			...prev,
			[bulletinId]: { userReactions, reactionCounts },
		}));

		const content = loadedContents[bulletinId];
		if (content) {
			setLoadedContents((prev) => ({
				...prev,
				[bulletinId]: {
					...content,
					userReactions,
					reactionCounts,
				},
			}));
		}
	}

	function renderContent(bulletin: BulletinListItem) {
		const content = loadedContents[bulletin.id];
		const isLoading = loadingIds.has(bulletin.id);

		if (isLoading) {
			return <ExpandableListContentSkeleton lines={3} />;
		}

		if (!content) {
			return <p className="text-sm text-muted">Não foi possível carregar o conteúdo.</p>;
		}

		return <RichTextPreview content={content.content} />;
	}

	function renderFooter(bulletin: BulletinListItem) {
		const updated = updatedReactions[bulletin.id];
		return (
			<BulletinReactions
				bulletinId={bulletin.id}
				userReactions={updated?.userReactions ?? bulletin.userReactions}
				reactionCounts={updated?.reactionCounts ?? bulletin.reactionCounts}
				onReactionChange={(userReactions, reactionCounts) =>
					handleReactionChange(bulletin.id, userReactions, reactionCounts)
				}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={News01Icon} className="icon-sm text-link" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Informativos</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Veja os comunicados e novidades operacionais da plataforma
					</p>
				</div>

				<button
					type="button"
					onClick={handleRefresh}
					disabled={isPending}
					className="button-outline-dark cursor-pointer text-xs"
				>
					<Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${isPending ? 'animate-spin' : ''}`} />
					<span>Atualizar</span>
				</button>
			</div>
			<ExpandableList
				items={bulletins}
				getKey={(b) => b.id}
				getTitle={(b) => b.title}
				getSubtitle={(b) => (
					<div className="flex items-center gap-2">
						<Icon icon={Calendar03Icon} className="icon-xs shrink-0" />
						<span>{formatRelativeTime(b.createdAt)}</span>
					</div>
				)}
				renderLeading={() => (
					<div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-accent/10 text-accent">
						<Icon icon={News01Icon} className="icon-sm" />
					</div>
				)}
				renderTrailing={(b) =>
					b.isRead ? (
						<Chip variant="soft" color="success" size="sm">
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
							Lido
						</Chip>
					) : null
				}
				renderContent={renderContent}
				renderFooter={renderFooter}
				expandedKey={expandedId}
				onToggle={handleToggle}
				empty={
					<EmptyState>
						<EmptyState.Indicator>
							<Icon icon={News01Icon} className="icon-lg" />
						</EmptyState.Indicator>
						<EmptyState.Heading>Nenhum informativo</EmptyState.Heading>
						<EmptyState.Description>Não há informativos disponíveis no momento.</EmptyState.Description>
					</EmptyState>
				}
			/>
		</div>
	);
}

