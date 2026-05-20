'use client';

import type { Key, ReactNode } from 'react';
import { Label, ScrollShadow, Tag, TagGroup } from '@heroui/react';

export interface InternalTagTabItem {
	id: string;
	label: string;
	icon?: ReactNode;
	textValue?: string;
	className?: string;
}

interface InternalTagTabsProps {
	ariaLabel: string;
	selectedKey: string;
	onSelectionChange: (key: string) => void;
	items: InternalTagTabItem[];
	className?: string;
	listClassName?: string;
	tagClassName?: string;
}

export function InternalTagTabs({
	ariaLabel,
	selectedKey,
	onSelectionChange,
	items,
	className,
	listClassName = 'flex w-max flex-nowrap gap-2',
	tagClassName = 'shrink-0',
}: InternalTagTabsProps) {
	function handleSelectionChange(keys: 'all' | Set<Key>) {
		if (keys === 'all') return;
		const key = Array.from(keys)[0];
		if (key) {
			onSelectionChange(String(key));
		}
	}

	return (
		<TagGroup
			aria-label={ariaLabel}
			selectionMode="single"
			selectedKeys={new Set([selectedKey])}
			onSelectionChange={handleSelectionChange}
			className={className}
			size="lg"
		>
			<Label className="sr-only">{ariaLabel}</Label>
			<ScrollShadow hideScrollBar className="scrollbar-hide w-full overflow-x-auto">
				<TagGroup.List className={listClassName}>
					{items.map((item) => (
						<Tag
							key={item.id}
							id={item.id}
							textValue={item.textValue ?? item.label}
							className={`${tagClassName} ${item.className ?? ''}`.trim()}
						>
							<div className="flex items-center gap-2">
								{item.icon}
								<span>{item.label}</span>
							</div>
						</Tag>
					))}
				</TagGroup.List>
			</ScrollShadow>
		</TagGroup>
	);
}