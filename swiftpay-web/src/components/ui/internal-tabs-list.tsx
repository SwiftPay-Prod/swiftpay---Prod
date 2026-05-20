'use client';

import type { ReactNode } from 'react';
import { ScrollShadow, Tabs } from '@heroui/react';

export interface InternalTabsListItem {
	id: string;
	label: string;
	icon?: ReactNode;
	tabClassName?: string;
	indicatorClassName?: string;
}

interface InternalTabsListProps {
	ariaLabel: string;
	items: InternalTabsListItem[];
	containerClassName?: string;
	listClassName?: string;
	tabClassName?: string;
	indicatorClassName?: string;
	mobileScrollable?: boolean;
}

export function InternalTabsList({
	ariaLabel,
	items,
	containerClassName,
	listClassName = 'bg-surface',
	tabClassName,
	indicatorClassName,
	mobileScrollable = false,
}: InternalTabsListProps) {
	const list = (
		<Tabs.List aria-label={ariaLabel} className={listClassName}>
			{items.map((item) => (
				<Tabs.Tab key={item.id} id={item.id} className={`${tabClassName ?? ''} ${item.tabClassName ?? ''}`.trim()}>
					<div className="flex items-center gap-2">
						{item.icon}
						<span>{item.label}</span>
					</div>
					<Tabs.Indicator className={item.indicatorClassName ?? indicatorClassName} />
				</Tabs.Tab>
			))}
		</Tabs.List>
	);

	return (
		<Tabs.ListContainer className={containerClassName}>
			{mobileScrollable ? (
				<ScrollShadow hideScrollBar className="scrollbar-hide w-full overflow-x-auto">
					{list}
				</ScrollShadow>
			) : (
				list
			)}
		</Tabs.ListContainer>
	);
}