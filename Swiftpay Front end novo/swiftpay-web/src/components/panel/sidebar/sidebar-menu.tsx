'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, Chip, Disclosure, DisclosureGroup, Popover } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/sidebar-context';
import { useMerchant } from '@/contexts/merchant-context';
import { usePublicConfig } from '@/contexts/public-config-context';
import { Routes } from '@/router/routes';
import type { RouteConfig, MenuSection } from '@/types/router';
import { getIcon } from '@/router/icons';
import { getMerchantDisplayParse, mapParseColorToChipColor } from '@/parse';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { SIDEBAR_EXPANDED_SECTIONS_KEY } from '@/constants/base';
import type { Key } from '@react-types/shared';
import './sidebar-effects.css';

const SIDEBAR_EFFECT_CLASS: Record<NonNullable<RouteConfig['sidebarEffect']>, string> = {
	'gold-reflection': 'sidebar-effect-gold-reflection',
	'soft-shimmer': 'sidebar-effect-soft-shimmer',
	'gentle-pulse': 'sidebar-effect-gentle-pulse',
	'underline-sweep': 'sidebar-effect-underline-sweep',
	'top-glint': 'sidebar-effect-top-glint',
	'aurora-wash': 'sidebar-effect-aurora-wash',
	'border-flow': 'sidebar-effect-border-flow',
	'corner-glow': 'sidebar-effect-corner-glow',
	'diagonal-sheen': 'sidebar-effect-diagonal-sheen',
	'halo-breathe': 'sidebar-effect-halo-breathe',
	'mist-pass': 'sidebar-effect-mist-pass',
	'prism-glow': 'sidebar-effect-prism-glow',
	'satin-wave': 'sidebar-effect-satin-wave',
	'soft-neon': 'sidebar-effect-soft-neon',
	'sparkle-drift': 'sidebar-effect-sparkle-drift',
};

function getSidebarEffectClass(item: RouteConfig): string {
	if (item.isDisabled || !item.sidebarEffect) return '';
	return SIDEBAR_EFFECT_CLASS[item.sidebarEffect] ?? '';
}

interface SidebarMenuProps {
	sections: MenuSection[];
	forceFull?: boolean;
}

const EMPTY_SET: Set<Key> = new Set();

function loadExpandedKeys(): Set<Key> {
	if (typeof window === 'undefined') return EMPTY_SET;
	const stored = localStorage.getItem(SIDEBAR_EXPANDED_SECTIONS_KEY);
	if (!stored) return EMPTY_SET;
	try {
		return new Set(JSON.parse(stored) as string[]);
	} catch {
		return EMPTY_SET;
	}
}

function saveExpandedKeys(keys: Set<Key>): void {
	localStorage.setItem(SIDEBAR_EXPANDED_SECTIONS_KEY, JSON.stringify(Array.from(keys)));
}

function useExpandedSections() {
	const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(EMPTY_SET);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// Use Promise to make setState call async (React Compiler requirement)
		Promise.resolve().then(() => {
			const storedKeys = loadExpandedKeys();
			if (storedKeys.size > 0) {
				setExpandedKeys(storedKeys);
			}
			setIsHydrated(true);
		});
	}, []);

	const updateExpandedKeys = useCallback((keys: Set<Key>) => {
		setExpandedKeys(keys);
		saveExpandedKeys(keys);
	}, []);

	return { expandedKeys, updateExpandedKeys, isHydrated };
}

function useMenuNavigation() {
	const router = useRouter();
	const { isMobile, closeSidebar } = useSidebar();
	const { docsUrl } = usePublicConfig();

	const navigate = (item: RouteConfig): void => {
		if (item.isDisabled) return;

		if (isMobile) closeSidebar();

		if (item.isExternal) {
			const url = item.path === Routes.panel.docs ? docsUrl : item.path;
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			router.push(item.path);
		}
	};

	return { navigate };
}

function useActiveRoute() {
	const pathname = usePathname();

	const isActive = (href: string): boolean => {
		if (href === Routes.panel.merchant.dashboard) return pathname === href;
		return pathname.startsWith(href);
	};

	return { isActive };
}

interface MenuItemBadgeProps {
	item: RouteConfig;
	isReviewRoute: boolean;
	statusChip: React.ReactNode | null;
}

function MenuItemBadge({ item, isReviewRoute, statusChip }: MenuItemBadgeProps) {
	if (isReviewRoute && statusChip) {
		return statusChip;
	}

	if (item.badgeText) {
		return (
			<span className="mockup-sidebar-badge ml-auto">{item.badgeText}</span>
		);
	}

	return null;
}

interface MenuItemProps {
	item: RouteConfig;
	showFull: boolean;
}

function MenuItem({ item, showFull }: MenuItemProps) {
	const { navigate } = useMenuNavigation();
	const { isActive } = useActiveRoute();
	const { selectedMerchant } = useMerchant();

	const active = isActive(item.path);
	const effectClassName = getSidebarEffectClass(item);
	const icon = getIcon(item.iconName);
	const isReviewRoute = item.path === Routes.panel.merchant.review;

	const statusParse =
		selectedMerchant?.status && selectedMerchant?.kycStatus
			? getMerchantDisplayParse(selectedMerchant.status, selectedMerchant.kycStatus)
			: null;
	const statusChip = statusParse ? (
		<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="ml-auto">
			{statusParse.label}
		</Chip>
	) : null;

	const buttonClassName = [
		showFull ? 'w-full justify-start gap-3' : 'w-8 h-8',
		effectClassName,
		active
			? 'mockup-sidebar-item active'
			: 'mockup-sidebar-item',
		item.isDisabled ? 'opacity-60 cursor-not-allowed' : '',
		!showFull && active ? '!bg-brand-soft !text-accent rounded-md' : '',
		!showFull && !active ? 'rounded-md text-muted-foreground hover:text-foreground hover:bg-default/50' : '',
	]
		.filter(Boolean)
		.join(' ');

	const menuButton = (
		<button
			disabled={item.isDisabled}
			className={buttonClassName}
			onClick={() => navigate(item)}
		>
			{icon && <span className="shrink-0">{icon}</span>}
			{showFull && <span className="truncate">{item.title}</span>}
			{showFull && <MenuItemBadge item={item} isReviewRoute={isReviewRoute} statusChip={statusChip} />}
		</button>
	);

	if (!showFull) {
		return (
			<Tooltip>
				<Tooltip.Trigger>{menuButton}</Tooltip.Trigger>
				<Tooltip.Content placement="right">{item.title}</Tooltip.Content>
			</Tooltip>
		);
	}

	return menuButton;
}

interface PopoverMenuItemProps {
	item: RouteConfig;
	onClose: () => void;
}

function PopoverMenuItem({ item, onClose }: PopoverMenuItemProps) {
	const { navigate } = useMenuNavigation();
	const { isActive } = useActiveRoute();
	const { selectedMerchant } = useMerchant();

	const active = isActive(item.path);
	const effectClassName = getSidebarEffectClass(item);
	const icon = getIcon(item.iconName);
	const isReviewRoute = item.path === Routes.panel.merchant.review;

	const statusParse =
		selectedMerchant?.status && selectedMerchant?.kycStatus
			? getMerchantDisplayParse(selectedMerchant.status, selectedMerchant.kycStatus)
			: null;
	const statusChip = statusParse ? (
		<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="ml-auto">
			{statusParse.label}
		</Chip>
	) : null;

	const buttonClassName = [
		'w-full justify-start gap-3 font-normal rounded-md transition-all duration-150',
		effectClassName,
		active ? '!bg-default !text-foreground' : 'text-muted hover:text-foreground hover:bg-default/50',
		item.isDisabled ? 'opacity-60 cursor-not-allowed' : '',
	]
		.filter(Boolean)
		.join(' ');

	function handlePress() {
		navigate(item);
		onClose();
	}

	return (
		<Button variant="ghost" size="md" isDisabled={item.isDisabled} className={buttonClassName} onPress={handlePress}>
			{icon}
			<span className="truncate">{item.title}</span>
			<MenuItemBadge item={item} isReviewRoute={isReviewRoute} statusChip={statusChip} />
		</Button>
	);
}

interface MenuSectionComponentProps {
	section: MenuSection;
	showFull: boolean;
}

function MenuSectionComponent({ section, showFull }: MenuSectionComponentProps) {
	const { isActive } = useActiveRoute();
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	if (section.items.length === 0) return null;

	const hasActiveItem = section.items.some((item) => isActive(item.path));
	const firstItem = section.items[0];
	const sectionIcon = firstItem?.iconName ? getIcon(firstItem.iconName) : null;

	if (!showFull) {
		if (!sectionIcon) return null;

		const triggerClassName = ['w-8 h-8 transition-all duration-150', hasActiveItem ? '!bg-default !text-foreground' : 'text-muted hover:text-foreground hover:bg-default/50']
			.filter(Boolean)
			.join(' ');

		return (
			<Tooltip delay={0} closeDelay={0}>
				<Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
					<Tooltip.Trigger>
						<Popover.Trigger>
							<Button variant="ghost" size="md" isIconOnly className={triggerClassName}>
								{sectionIcon}
							</Button>
						</Popover.Trigger>
					</Tooltip.Trigger>
					<Popover.Content placement="right" className="w-72">
						<Popover.Dialog>
							<div className="mb-2 px-2 text-xs font-medium tracking-wide text-muted">{section.title}</div>
							<div className="flex flex-col">
								{section.items.map((item) => (
									<PopoverMenuItem key={item.path} item={item} onClose={() => setIsPopoverOpen(false)} />
								))}
							</div>
						</Popover.Dialog>
					</Popover.Content>
				</Popover>
				{!isPopoverOpen && <Tooltip.Content placement="right">{section.title}</Tooltip.Content>}
			</Tooltip>
		);
	}

	const triggerClassName = [
		'group my-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 transition-all duration-150',
		'mockup-sidebar-section-title !mb-0 !pl-3',
	].join(' ');

	return (
		<Disclosure id={section.title}>
			<Disclosure.Trigger className={triggerClassName}>
				<span>{section.title}</span>
				<Icon
					icon={ArrowDown01Icon}
					className="icon-xs transition-transform duration-160 group-aria-expanded:-rotate-180"
				/>
			</Disclosure.Trigger>
			<Disclosure.Content>
				<div className="ml-3 flex flex-col pl-3">
					{section.items.map((item) => (
						<MenuItem key={item.path} item={item} showFull={showFull} />
					))}
				</div>
			</Disclosure.Content>
		</Disclosure>
	);
}

export function SidebarMenu({ sections, forceFull = false }: SidebarMenuProps) {
	const { isExpanded, isMobile, isOpen } = useSidebar();
	const showFull = forceFull || (isMobile ? isOpen : isExpanded);
	const { expandedKeys, updateExpandedKeys, isHydrated } = useExpandedSections();

	if (!showFull) {
		return (
			<nav className="flex flex-col items-center gap-0.5 sidebar-animate-in">
				{sections.map((section) => (
					<MenuSectionComponent key={section.title} section={section} showFull={showFull} />
				))}
			</nav>
		);
	}

	return (
		<nav className="flex flex-col sidebar-animate-in">
			<DisclosureGroup
				allowsMultipleExpanded
				expandedKeys={isHydrated ? expandedKeys : EMPTY_SET}
				onExpandedChange={updateExpandedKeys}
			>
				{sections.map((section) => (
					<MenuSectionComponent key={section.title} section={section} showFull={showFull} />
				))}
			</DisclosureGroup>
		</nav>
	);
}

