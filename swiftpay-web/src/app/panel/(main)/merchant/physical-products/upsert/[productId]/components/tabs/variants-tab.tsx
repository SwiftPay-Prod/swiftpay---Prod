'use client';

import Image from 'next/image';
import { Button, Tooltip } from '@heroui/react';
import { Layers01Icon, AddCircleIcon, Edit02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/utils/currency';
import type { VariantsTabProps } from './types';

export function VariantsTab({
	isEditMode,
	variants,
	pendingVariants,
	onCreateVariant,
	onEditVariant,
	onDeleteVariant,
	onRemovePendingVariant,
	disabled,
}: VariantsTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex justify-end">
				<Button variant="secondary" size="sm" onPress={onCreateVariant}>
					<Icon icon={AddCircleIcon} className="icon-sm" />
					Nova Variante
				</Button>
			</div>

			{isEditMode ? (
				variants.length === 0 ? (
					<p className="text-sm text-muted">Nenhuma variante cadastrada</p>
				) : (
					<div className="flex flex-col gap-2">
						{variants.map((variant) => (
							<div key={variant.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
								<div className="flex items-center gap-3">
									{variant.imageUrl ? (
										<Image
											src={variant.imageUrl}
											alt={variant.name}
											width={40}
											height={40}
											className="rounded-md object-cover"
										/>
									) : (
										<div className="w-10 h-10 bg-surface rounded-md flex items-center justify-center">
											<Icon icon={Layers01Icon} className="icon-sm text-muted" />
										</div>
									)}
									<div>
										<p className="text-sm font-medium">{variant.name}</p>
										{variant.price && <p className="text-xs text-muted">{formatCurrency(variant.price)}</p>}
									</div>
								</div>
								<div className="flex items-center gap-1">
									{!disabled && (
										<>
											<Tooltip>
												<Button isIconOnly variant="tertiary" size="sm" onPress={() => onEditVariant(variant)}>
													<Icon icon={Edit02Icon} className="icon-sm" />
												</Button>
												<Tooltip.Content>Editar variante</Tooltip.Content>
											</Tooltip>
											<Tooltip>
												<Button isIconOnly variant="danger-soft" size="sm" onPress={() => onDeleteVariant(variant.id)}>
													<Icon icon={Delete02Icon} className="icon-sm text-danger" />
												</Button>
												<Tooltip.Content>Excluir variante</Tooltip.Content>
											</Tooltip>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)
			) : pendingVariants.length === 0 ? (
				<p className="text-sm text-muted">Nenhuma variante adicionada</p>
			) : (
				<div className="flex flex-col gap-2">
					{pendingVariants.map((variant) => (
						<div key={variant.tempId} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
							<div className="flex items-center gap-3">
								{variant.imageUrl ? (
									<Image
										src={variant.imageUrl}
										alt={variant.name}
										width={40}
										height={40}
										className="rounded-md object-cover"
									/>
								) : (
									<div className="w-10 h-10 bg-surface rounded-md flex items-center justify-center">
										<Icon icon={Layers01Icon} className="icon-sm text-muted" />
									</div>
								)}
								<div>
									<p className="text-sm font-medium">{variant.name}</p>
									{variant.price && <p className="text-xs text-muted">{formatCurrency(variant.price)}</p>}
								</div>
							</div>
							{!disabled && (
								<Tooltip>
									<Button
										isIconOnly
										variant="danger-soft"
										size="sm"
										onPress={() => onRemovePendingVariant(variant.tempId)}
									>
										<Icon icon={Delete02Icon} className="icon-sm text-danger" />
									</Button>
									<Tooltip.Content>Remover variante</Tooltip.Content>
								</Tooltip>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
