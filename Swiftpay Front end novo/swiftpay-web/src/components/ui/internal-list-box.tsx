'use client';

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListBox } from '@heroui/react';
import type { ReactNode } from 'react';

interface InternalListBoxProps {
	ariaLabel: string;
	sortable?: boolean;
	itemIds?: string[];
	onDragEnd?: (event: DragEndEvent) => void;
	children: ReactNode;
	className?: string;
}

export function InternalListBox({
	ariaLabel,
	sortable = false,
	itemIds,
	onDragEnd,
	children,
	className,
}: InternalListBoxProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	if (!sortable) {
		return (
			<ListBox
				aria-label={ariaLabel}
				selectionMode='none'
				className={`**:data-selected:bg-transparent **:data-hovered:bg-transparent **:data-pressed:bg-transparent ${className ?? ''}`}
			>
				{children}
			</ListBox>
		);
	}

	const effectiveItemIds = itemIds ?? [];
	const effectiveOnDragEnd = onDragEnd ?? (() => {});

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={effectiveOnDragEnd}>
			<ListBox
				aria-label={ariaLabel}
				selectionMode='none'
				className={`**:data-selected:bg-transparent **:data-hovered:bg-transparent **:data-pressed:bg-transparent ${className ?? ''}`}
			>
				<SortableContext items={effectiveItemIds} strategy={verticalListSortingStrategy}>
					{children}
				</SortableContext>
			</ListBox>
		</DndContext>
	);
}