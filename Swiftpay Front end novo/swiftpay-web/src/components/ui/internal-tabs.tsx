'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key, ReactNode } from 'react';
import { Button, Popover, Tabs } from '@heroui/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export interface InternalTabItem {
	id: string;
	label: string;
	icon?: ReactNode;
}

interface InternalTabsBaseProps {
	ariaLabel: string;
	items: InternalTabItem[];
	children?: ReactNode;
	className?: string;
	orientation?: 'horizontal' | 'vertical';
}

interface InternalTabsControlledProps extends InternalTabsBaseProps {
	selectedKey: string;
	onSelectionChange: (key: string) => void;
	defaultSelectedKey?: never;
}

interface InternalTabsUncontrolledProps extends InternalTabsBaseProps {
	defaultSelectedKey: string;
	selectedKey?: never;
	onSelectionChange?: never;
}

type InternalTabsProps = InternalTabsControlledProps | InternalTabsUncontrolledProps;

export function InternalTabs({
	ariaLabel,
	items,
	selectedKey,
	onSelectionChange,
	defaultSelectedKey,
	children,
	className = 'w-full',
	orientation = 'horizontal',
}: InternalTabsProps) {
	const MORE_TAB_ID = '__internal_tabs_more__';
	const isVertical = orientation === 'vertical';
	const isControlled = selectedKey !== undefined;
	const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState(defaultSelectedKey);
	const [visibleIds, setVisibleIds] = useState<string[]>(items.map((item) => item.id));
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const moreMeasureRef = useRef<HTMLButtonElement | null>(null);
	const measureItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	const currentSelectedKey = isControlled ? selectedKey : uncontrolledSelectedKey;
	const itemIds = useMemo(() => items.map((item) => item.id), [items]);
	const itemIdSet = useMemo(() => new Set(itemIds), [itemIds]);
	const resolvedSelectedKey = useMemo(() => {
		if (currentSelectedKey && itemIdSet.has(currentSelectedKey)) {
			return currentSelectedKey;
		}

		return itemIds[0] ?? '';
	}, [currentSelectedKey, itemIdSet, itemIds]);

	const handleSelection = useCallback(
		(key: string) => {
			if (isControlled) {
				onSelectionChange?.(key);
				return;
			}

			setUncontrolledSelectedKey(key);
		},
		[isControlled, onSelectionChange],
	);

	const setMeasureItemRef = useCallback((id: string) => {
		return (element: HTMLButtonElement | null) => {
			if (!element) {
				measureItemRefs.current.delete(id);
				return;
			}

			measureItemRefs.current.set(id, element);
		};
	}, []);

	const recomputeVisibleItems = useCallback(() => {
		if (isVertical) {
			setVisibleIds(items.map((item) => item.id));
			return;
		}

		const ITEM_WIDTH_BUFFER = 8;
		const MORE_BUTTON_GAP = 4;

		const containerWidth = containerRef.current?.clientWidth ?? 0;
		if (containerWidth <= 0) {
			return;
		}

		const moreWidth = moreMeasureRef.current?.offsetWidth ?? 0;
		const itemWidths = items.map((item) => {
			const width = measureItemRefs.current.get(item.id)?.offsetWidth ?? 0;
			return { id: item.id, width: width + ITEM_WIDTH_BUFFER };
		});

		const hasInvalidWidth = itemWidths.some((item) => item.width <= 0);
		if (hasInvalidWidth) {
			return;
		}

		const totalTabsWidth = itemWidths.reduce((sum, item) => sum + item.width, 0);
		if (totalTabsWidth <= containerWidth) {
			setVisibleIds(itemWidths.map((item) => item.id));
			return;
		}

		const availableTabsWidth = Math.max(containerWidth - moreWidth - MORE_BUTTON_GAP, 0);

		let consumedWidth = 0;
		const nextVisibleIds: string[] = [];

		for (const item of itemWidths) {
			if (consumedWidth + item.width <= availableTabsWidth) {
				nextVisibleIds.push(item.id);
				consumedWidth += item.width;
				continue;
			}

			break;
		}

		if (currentSelectedKey && !nextVisibleIds.includes(currentSelectedKey)) {
			const selectedItem = itemWidths.find((item) => item.id === currentSelectedKey);
			if (selectedItem) {
				const beforeSelected = itemWidths.filter((item) => item.id !== currentSelectedKey);
				const adjustedVisibleIds: string[] = [];
				let adjustedConsumed = selectedItem.width;

				for (const item of beforeSelected) {
					if (adjustedConsumed + item.width > availableTabsWidth) {
						break;
					}

					adjustedVisibleIds.push(item.id);
					adjustedConsumed += item.width;
				}

				adjustedVisibleIds.push(currentSelectedKey);
				setVisibleIds(adjustedVisibleIds);
				return;
			}
		}

		setVisibleIds(nextVisibleIds);
	}, [currentSelectedKey, isVertical, items]);

	useEffect(() => {
		const frameId = window.requestAnimationFrame(recomputeVisibleItems);

		if (isVertical) {
			return () => {
				window.cancelAnimationFrame(frameId);
			};
		}

		const observer = new ResizeObserver(() => {
			recomputeVisibleItems();
		});

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		measureItemRefs.current.forEach((element) => observer.observe(element));
		if (moreMeasureRef.current) {
			observer.observe(moreMeasureRef.current);
		}

		return () => {
			window.cancelAnimationFrame(frameId);
			observer.disconnect();
		};
	}, [isVertical, recomputeVisibleItems, items]);

	const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

	const overflowItems = useMemo(() => {
		if (isVertical) {
			return [];
		}

		return items.filter((item) => !visibleIdSet.has(item.id));
	}, [isVertical, items, visibleIdSet]);

	const baseListClassName = isVertical
		? 'flex-col w-full *:h-8 *:w-full *:justify-start *:px-3 *:text-sm *:font-normal *:whitespace-nowrap'
		: 'w-full *:h-8 *:w-fit *:px-3 *:text-sm *:font-normal *:whitespace-nowrap';

	const list = (
		<Tabs.List aria-label={ariaLabel} className={baseListClassName}>
			{items.map((item) => (
				<Tabs.Tab
					key={item.id}
					id={item.id}
					className={`border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${!isVertical && !visibleIdSet.has(item.id) ? 'hidden' : ''}`}
				>
					<div className="flex items-center gap-2 whitespace-nowrap">
						{item.icon}
						<span className="whitespace-nowrap">{item.label}</span>
					</div>
					<Tabs.Indicator className={isVertical ? 'bg-accent left-0' : 'bg-accent'} />
				</Tabs.Tab>
			))}
			{!isVertical && overflowItems.length > 0 && (
				<Tabs.Tab
					id={MORE_TAB_ID}
					className="border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
				>
					<Popover isOpen={overflowItems.length > 0 && isMoreOpen} onOpenChange={setIsMoreOpen}>
						<Popover.Trigger>
							<div className="flex items-center gap-2 whitespace-nowrap">
								<span className="whitespace-nowrap">Mais</span>
								<Icon icon={ArrowDown01Icon} className="icon-sm" />
							</div>
						</Popover.Trigger>
						<Popover.Content placement="bottom end" className="p-1">
							<Popover.Dialog>
								<div className="flex min-w-44 flex-col gap-1">
									{overflowItems.map((item) => (
										<Button
											key={item.id}
											variant="tertiary"
											size="sm"
											className="justify-start"
											onPress={() => {
												handleSelection(item.id);
												setIsMoreOpen(false);
											}}
										>
											<div className="flex items-center gap-2 whitespace-nowrap">
												{item.icon}
												<span>{item.label}</span>
											</div>
										</Button>
									))}
								</div>
							</Popover.Dialog>
						</Popover.Content>
					</Popover>
					<Tabs.Indicator className="hidden" />
				</Tabs.Tab>
			)}
		</Tabs.List>
	);

	const tabsProps = {
		selectedKey: resolvedSelectedKey || undefined,
		onSelectionChange: (key: Key | null) => {
			if (key) {
				if (String(key) === MORE_TAB_ID) {
					setIsMoreOpen(true);
					return;
				}

				handleSelection(String(key));
			}
		},
	};

	return (
		<Tabs className={`${className} **:[[role=tabpanel]]:p-0`} variant="primary" orientation={orientation} {...tabsProps}>
			<Tabs.ListContainer ref={containerRef} className="pb-2">
				{list}
			</Tabs.ListContainer>
			{!isVertical && (
				<div className="pointer-events-none absolute left-0 top-0 -z-10 flex h-0 items-center gap-0 overflow-hidden opacity-0" aria-hidden>
					{items.map((item) => (
						<button
							key={item.id}
							type="button"
							ref={setMeasureItemRef(item.id)}
							className="inline-flex h-8 w-fit items-center gap-2 whitespace-nowrap px-3 text-sm font-normal"
						>
							{item.icon}
							<span>{item.label}</span>
						</button>
					))}
					<button
						type="button"
						ref={moreMeasureRef}
						className="inline-flex h-8 min-w-20 w-fit items-center justify-between gap-2 whitespace-nowrap px-3 text-sm font-normal"
					>
						<span>Mais</span>
						<span className="inline-flex"><Icon icon={ArrowDown01Icon} className="icon-sm" /></span>
					</button>
				</div>
			)}
			{children}
		</Tabs>
	);
}
