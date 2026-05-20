'use client';

import { useSyncExternalStore } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, Button, Chip, ListBox, Tooltip } from '@heroui/react';
import { PencilEdit02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/currency';
import type { CheckoutProductData } from '@/types/merchant/checkouts';

interface CheckoutProductSortableRowProps {
	variant: CheckoutProductData;
	canReorder: boolean;
	onEdit: (variant: CheckoutProductData) => void;
	onDelete: (variant: CheckoutProductData) => void;
}

export function CheckoutProductSortableRow({
	variant,
	canReorder,
	onEdit,
	onDelete,
}: CheckoutProductSortableRowProps) {
	const isClientMounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false
	);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: variant.id,
		disabled: !canReorder,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	const variantLabel = variant.variantName || 'Produto base';

	return (
		<ListBox.Item
			key={variant.id}
			id={variant.id}
			textValue={`${variant.productName} ${variantLabel}`}
			className="bg-transparent data-[hovered=true]:bg-transparent data-[selected=true]:bg-transparent data-[pressed=true]:bg-transparent data-[focused=true]:bg-transparent data-[pressed=true]:scale-100 data-[pressed=true]:transform-none data-[pressed=true]:opacity-100"
		>
			<div
				ref={setNodeRef}
				style={style}
				className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-xl border border-divider bg-content1 p-3"
			>
				<button
					type="button"
					{...(isClientMounted ? attributes : {})}
					{...(isClientMounted ? listeners : {})}
					disabled={!canReorder}
					className={canReorder ? 'cursor-grab rounded-md px-2 py-1 text-muted active:cursor-grabbing' : 'rounded-md px-2 py-1 text-muted/50'}
					aria-label="Reordenar item"
				>
					⋮⋮
				</button>

				<div className="flex min-w-0 items-center gap-3">
					<Avatar size="sm" className="shrink-0 rounded-md">
						{variant.productImageUrl ? (
							<Avatar.Image src={variant.productImageUrl} alt={variant.productName} />
						) : (
							<Avatar.Fallback className="rounded-md">
								{variant.productName.charAt(0).toUpperCase()}
							</Avatar.Fallback>
						)}
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-foreground">{variant.productName}</p>
						<div className="flex flex-wrap items-center gap-2">
							<p className="truncate text-xs font-medium text-foreground/80">{variantLabel}</p>
							<Chip variant="soft" size="sm" color={variant.variantName ? 'accent' : 'default'}>
								{variant.variantName ? 'Variação' : 'Base'}
							</Chip>
							<Chip variant="soft" size="sm" color={variant.isActive ? 'success' : 'warning'}>
								{variant.isActive ? 'Ativo' : 'Inativo'}
							</Chip>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 text-right">
					<p className="min-w-24 text-sm font-semibold text-foreground">
						{formatCurrency(variant.customPrice ?? variant.originalPrice)}
					</p>
					<Chip variant="soft" size="sm" color="default">
						Ordem {variant.displayOrder}
					</Chip>
				</div>

				<div className="flex items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
					<Tooltip>
						<Button isIconOnly variant="tertiary" size="sm" onPress={() => onEdit(variant)}>
							<Icon icon={PencilEdit02Icon} className="icon-sm" />
							<Tooltip.Content arrowBoundaryOffset={12}>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
					<Tooltip>
						<Button isIconOnly variant="tertiary" size="sm" className="text-danger" onPress={() => onDelete(variant)}>
							<Icon icon={Delete02Icon} className="icon-sm" />
							<Tooltip.Content arrowBoundaryOffset={12}>Remover</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			</div>
		</ListBox.Item>
	);
}
