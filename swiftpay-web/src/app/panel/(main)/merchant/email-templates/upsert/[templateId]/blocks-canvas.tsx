'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@heroui/react';
import { Delete02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { emailBlockTypeParse } from '@/parse/email-block';
import type { EmailBlock } from '@/types/merchant/email-templates';

interface SortableBlockProps {
	block: EmailBlock;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
}

function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate }: SortableBlockProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: block.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const parse = emailBlockTypeParse[block.type];

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`group relative rounded-lg border-2 transition-colors ${
				isSelected ? 'border-accent bg-accent/5' : 'border-transparent bg-content1 hover:border-border'
			}`}
		>
			<div
				{...attributes}
				{...listeners}
				onClick={onSelect}
				className="flex cursor-grab items-center gap-3 p-4 active:cursor-grabbing"
			>
				<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/10 text-muted">
					{parse.icon}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium">{parse.label}</p>
					{block.content && <p className="truncate text-xs text-muted">{block.content}</p>}
				</div>
			</div>

			<div
				className={`absolute right-2 top-2 flex gap-1 transition-opacity ${
					isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
				}`}
			>
				<Button
					isIconOnly
					size="sm"
					variant="ghost"
					onPress={() => onDuplicate()}
				>
					<Icon icon={Copy01Icon} className="icon-xs" />
				</Button>
				<Button
					isIconOnly
					size="sm"
					variant="ghost"
					className="text-danger"
					onPress={() => onDelete()}
				>
					<Icon icon={Delete02Icon} className="icon-xs" />
				</Button>
			</div>
		</div>
	);
}

interface BlocksCanvasProps {
	blocks: EmailBlock[];
	selectedBlockId: string | null;
	onBlockSelect: (blockId: string | null) => void;
	onBlockDelete: (blockId: string) => void;
	onBlockDuplicate: (blockId: string) => void;
}

export function BlocksCanvas({ blocks, selectedBlockId, onBlockSelect, onBlockDelete, onBlockDuplicate }: BlocksCanvasProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'canvas-drop-zone',
	});

	return (
		<div
			ref={setNodeRef}
			className={`flex min-h-96 flex-1 flex-col rounded-lg border-2 border-dashed p-4 transition-colors ${isOver ? 'border-accent bg-accent/5' : 'border-border'}`}
		>
			{blocks.length === 0 ? (
				<div className="flex flex-1 flex-col items-center justify-center text-center">
					<div className="mb-2 text-4xl">📧</div>
					<p className="text-sm font-medium">Arraste blocos aqui</p>
					<p className="text-xs text-muted">Construa seu email arrastando blocos da paleta à esquerda</p>
				</div>
			) : (
				<SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
					<div className="flex flex-col gap-2">
						{blocks.map((block) => (
							<SortableBlock
								key={block.id}
								block={block}
								isSelected={selectedBlockId === block.id}
								onSelect={() => onBlockSelect(block.id)}
								onDelete={() => onBlockDelete(block.id)}
								onDuplicate={() => onBlockDuplicate(block.id)}
							/>
						))}
					</div>
				</SortableContext>
			)}
		</div>
	);
}
