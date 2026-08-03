'use client';

import { Button, Tooltip } from '@heroui/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import {
	KBarAnimator,
	KBarPortal,
	KBarPositioner,
	KBarProvider,
	KBarResults,
	KBarSearch,
	useKBar,
	useMatches,
} from 'kbar';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { useSidebar } from '@/contexts/sidebar-context';
import { usePublicConfig } from '@/contexts/public-config-context';
import { useMerchant } from '@/contexts/merchant-context';
import { Routes } from '@/router/routes';
import { getIcon } from '@/router/icons';
import type { MenuSection } from '@/types/router';
import type { UserInfo } from '@/types/auth';
import { buildSidebarKbarActions } from './sidebar-kbar-actions';

interface SidebarKbarProps {
	sections: MenuSection[];
	user: UserInfo;
	forceFull?: boolean;
}

function SidebarKbarTrigger({ showFull }: { showFull: boolean }) {
	const { query } = useKBar();

	if (showFull) {
		return (
			<Button
				variant="secondary"
				className="w-full justify-between gap-2 rounded-xl border border-divider px-3 py-2.5"
				onPress={() => query.toggle()}
			>
				<span className="flex items-center gap-2 text-sm text-muted">
					<Icon icon={Search01Icon} className="icon-sm text-muted" />
					Buscar comando...
				</span>
				<span className="text-xs text-muted">Ctrl/⌘ K</span>
			</Button>
		);
	}

	return (
		<Tooltip>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					isIconOnly
					className="mx-auto h-9 w-9"
					onPress={() => query.toggle()}
					aria-label="Buscar comando"
				>
					<Icon icon={Search01Icon} className="icon-md" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content placement="right">Buscar comando</Tooltip.Content>
		</Tooltip>
	);
}

function SidebarKbarPalette() {
	const { results } = useMatches();

	return (
		<KBarPortal>
			<KBarPositioner className="z-300 bg-overlay/60 backdrop-blur-sm">
				<KBarAnimator className="w-full max-w-2xl overflow-hidden rounded-2xl border border-divider bg-surface shadow-xl">
					<div className="border-b border-divider">
						<KBarSearch
							className="kbar-search-input m-0 h-14 w-full border-0 bg-transparent px-4 text-base text-foreground outline-none placeholder:text-muted"
							placeholder="Digite um comando ou pesquise..."
						/>
					</div>
					<KBarResults
						items={results}
						onRender={({ item, active }) => {
							if (typeof item === 'string') {
								return (
									<div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
										{item}
									</div>
								);
							}

							return (
								<div
									className={`cursor-pointer flex items-center gap-3 px-4 py-3 text-sm ${
										active ? 'bg-accent-soft text-accent' : 'text-foreground'
									}`}
								>
									{item.icon ?? null}
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-medium">{item.name}</span>
										{item.subtitle ? (
											<span className="truncate text-xs text-muted">{item.subtitle}</span>
										) : null}
									</div>
									{item.shortcut?.length ? (
										<div className="flex items-center gap-1">
											{item.shortcut.map((shortcutKey: string) => (
												<span
													key={`${item.id}-${shortcutKey}`}
													className="rounded-md bg-content3 px-2 py-1 text-xs text-muted"
												>
													{shortcutKey}
												</span>
											))}
										</div>
									) : null}
								</div>
							);
						}}
					/>
				</KBarAnimator>
			</KBarPositioner>
		</KBarPortal>
	);
}

export function SidebarKbar({ sections, user, forceFull = false }: SidebarKbarProps) {
	const router = useRouter();
	const { docsUrl } = usePublicConfig();
	const { selectedMerchant } = useMerchant();
	const { isExpanded, isMobile, isOpen, closeSidebar } = useSidebar();

	const showFull = forceFull || (isMobile ? isOpen : isExpanded);

	const actionDefinitions = buildSidebarKbarActions({
		userRole: user.role,
		emailVerified: user.emailVerified,
		hasMerchant: !!selectedMerchant,
		merchantStatus: selectedMerchant?.status,
		merchantKycStatus: selectedMerchant?.kycStatus,
	});

	const sectionMap = new Map(sections.map((section) => [section.title, section.title]));

	const actions = actionDefinitions.map((item) => {
		const target = item.path === Routes.panel.docs ? docsUrl : item.path;
		const mappedSection = sectionMap.get(item.section) ?? item.section;

		return {
			id: item.id,
			name: item.name,
			subtitle: item.subtitle ?? mappedSection,
			section: mappedSection,
			icon: item.iconName ? getIcon(item.iconName) : null,
			keywords: `${item.keywords ?? ''} ${item.name} ${mappedSection}`.trim(),
			shortcut: item.shortcut,
			perform: () => {
				if (item.isDisabled) return;
				if (isMobile) {
					closeSidebar();
				}
				if (item.isExternal) {
					window.open(target, '_blank', 'noopener,noreferrer');
					return;
				}
				router.push(target);
			},
		};
	});

	return (
		<KBarProvider actions={actions}>
			<SidebarKbarTrigger showFull={showFull} />
			<SidebarKbarPalette />
		</KBarProvider>
	);
}
