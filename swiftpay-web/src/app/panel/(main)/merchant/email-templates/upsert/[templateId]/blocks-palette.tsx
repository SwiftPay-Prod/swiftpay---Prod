'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Chip, Disclosure, DisclosureGroup } from '@heroui/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { emailBlockTypeOptions } from '@/parse/email-block';
import { EmailBlockType } from '@/types/enums';

interface DraggablePaletteItemProps {
	type: EmailBlockType;
	label: string;
	description: string;
	icon: React.ReactNode;
	isDisabled?: boolean;
}

function DraggablePaletteItem({ type, label, description, icon, isDisabled }: DraggablePaletteItemProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: `palette-${type}`,
		disabled: isDisabled,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`flex items-center gap-3 rounded-lg border border-border bg-content1 p-3 transition-colors ${
				isDisabled
					? 'cursor-not-allowed grayscale'
					: 'cursor-grab hover:border-accent hover:bg-accent/5 active:cursor-grabbing'
			}`}
		>
			<div
				className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
					isDisabled ? 'bg-muted/20 text-muted' : 'bg-accent/10 text-accent'
				}`}
			>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className={`text-sm font-medium ${isDisabled ? 'text-muted' : ''}`}>{label}</p>
				<p className="truncate text-xs text-muted">{description}</p>
			</div>
			{isDisabled && (
				<Chip variant="soft" color="default" size="sm">
					Em breve
				</Chip>
			)}
		</div>
	);
}

export function BlocksPalette() {
	const contentBlocks = emailBlockTypeOptions.filter((b) => b.category === 'content');
	const layoutBlocks = emailBlockTypeOptions.filter((b) => b.category === 'layout');
	const dynamicBlocks = emailBlockTypeOptions.filter((b) => b.category === 'dynamic');
	const comingSoonBlocks = new Set<EmailBlockType>([EmailBlockType.TrackingInfo, EmailBlockType.Columns]);

	const triggerClassName =
		'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-default text-muted-foreground';

	return (
		<div className="flex h-full flex-col gap-2 overflow-auto rounded-lg border border-border bg-surface p-3">
			<DisclosureGroup allowsMultipleExpanded defaultExpandedKeys={['content', 'layout', 'dynamic']}>
				<Disclosure id="content">
					<Disclosure.Heading>
						<Disclosure.Trigger className={triggerClassName}>
							<span>Conteúdo</span>
							<Icon
								icon={ArrowDown01Icon}
								className="icon-xs transition-transform duration-200 group-aria-expanded:-rotate-180"
							/>
						</Disclosure.Trigger>
					</Disclosure.Heading>
					<Disclosure.Content>
						<Disclosure.Body className="flex flex-col gap-2 pt-2">
							{contentBlocks.map((block) => (
								<DraggablePaletteItem
									key={block.value}
									type={block.value}
									label={block.label}
									description={block.description}
									icon={block.icon}
								/>
							))}
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>

				<Disclosure id="layout">
					<Disclosure.Heading>
						<Disclosure.Trigger className={triggerClassName}>
							<span>Layout</span>
							<Icon
								icon={ArrowDown01Icon}
								className="icon-xs transition-transform duration-200 group-aria-expanded:-rotate-180"
							/>
						</Disclosure.Trigger>
					</Disclosure.Heading>
					<Disclosure.Content>
						<Disclosure.Body className="flex flex-col gap-2 pt-2">
							{layoutBlocks.map((block) => (
								<DraggablePaletteItem
									key={block.value}
									type={block.value}
									label={block.label}
									description={block.description}
									icon={block.icon}
									isDisabled={comingSoonBlocks.has(block.value)}
								/>
							))}
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>

				<Disclosure id="dynamic">
					<Disclosure.Heading>
						<Disclosure.Trigger className={triggerClassName}>
							<span>Dinâmico</span>
							<Icon
								icon={ArrowDown01Icon}
								className="icon-xs transition-transform duration-200 group-aria-expanded:-rotate-180"
							/>
						</Disclosure.Trigger>
					</Disclosure.Heading>
					<Disclosure.Content>
						<Disclosure.Body className="flex flex-col gap-2 pt-2">
							{dynamicBlocks.map((block) => (
								<DraggablePaletteItem
									key={block.value}
									type={block.value}
									label={block.label}
									description={block.description}
									icon={block.icon}
									isDisabled={comingSoonBlocks.has(block.value)}
								/>
							))}
						</Disclosure.Body>
					</Disclosure.Content>
				</Disclosure>
			</DisclosureGroup>
		</div>
	);
}
