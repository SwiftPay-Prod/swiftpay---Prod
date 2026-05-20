'use client';

import Image from 'next/image';
import type { CheckoutProduct, ValidatedCoupon, CalculatedCheckoutItemInfo, ReservedOrderItemData } from '@/types/checkout';
import { Select, ListBox, Chip } from '@heroui/react';
import { Icon } from '@/components/icon';
import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { productTypeParse } from '../parse';
import { mapParseColorToChipColor } from '@/parse/types';
import type { GroupedProduct } from '@/hooks';

interface ProductCardProps {
	group: GroupedProduct;
	primaryColor: string;
	appliedCoupon: ValidatedCoupon | null;
	discountedProduct: CheckoutProduct | null;
	discountAmount: number;
	calculationItems: CalculatedCheckoutItemInfo[] | null;
	reservationItems?: ReservedOrderItemData[] | null;
	onSelectVariant: (productId: string, variantId: string | null) => void;
	variant?: 'default' | 'compact';
	hasReservation?: boolean;
}

export function ProductCard({
	group,
	primaryColor,
	appliedCoupon,
	discountedProduct,
	discountAmount,
	calculationItems,
	reservationItems,
	onSelectVariant,
	variant = 'default',
	hasReservation = false,
}: ProductCardProps) {
	const product = group.selectedVariant;
	const itemTotal = product.price * product.quantity;
	const productTypeInfo = product.type ? productTypeParse[product.type] : null;
	const isDiscountedProductItem =
		appliedCoupon?.scope === 'Product' &&
		discountedProduct?.productId === product.productId &&
		discountedProduct?.variantId === product.variantId;
	const discountedTotal = isDiscountedProductItem ? itemTotal - discountAmount : itemTotal;
	const hasMultipleVariants = group.variants.length > 1;

	const reservationStockInfo = reservationItems?.find(
		(item) => item.productId === product.productId && item.variantId === product.variantId
	);
	const isOutOfStock = hasReservation
		? reservationStockInfo ? !reservationStockInfo.isInStock : false
		: false;

	const isCompact = variant === 'compact';
	const imageSize = isCompact ? 48 : 64;
	const imageSizeClass = isCompact ? 'w-12 h-12' : 'w-16 h-16';
	const iconSize = isCompact ? 'icon-md' : 'icon-lg';

	if (isCompact) {
		return (
			<div className={`flex gap-3 p-2 rounded-lg ${isOutOfStock ? 'bg-danger-soft' : ''}`}>
				{product.imageUrl ? (
					<Image
						src={product.imageUrl}
						alt={product.name}
						width={imageSize}
						height={imageSize}
						className={`${imageSizeClass} object-cover rounded-lg shrink-0`}
						unoptimized
					/>
				) : (
					<div className={`hero-surface ${imageSizeClass} rounded-lg shrink-0 flex items-center justify-center`}>
						<Icon icon={ImageNotFound01Icon} className={`${iconSize} hero-text-subtle`} />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<p className="hero-text font-medium text-sm truncate">{product.name}</p>

					{hasMultipleVariants ? (
						<Select
							aria-label="Selecionar variante"
							value={group.selectedVariantId ?? product.variantId ?? null}
							onChange={(key) => {
								onSelectVariant(group.productId, key ? String(key) : null);
							}}
							className="w-full"
						>
							<Select.Trigger className="h-7 text-xs hero-bg-surface hero-border rounded-lg">
								<Select.Value />
								<Select.Indicator className="hero-text-muted" />
							</Select.Trigger>
							<Select.Popover className="hero-bg-surface hero-border rounded-xl min-w-48">
								<ListBox aria-label="Variantes">
									{group.variants.map((v) => {
										const variantReservationStockInfo = reservationItems?.find(
											(item) => item.productId === group.productId && item.variantId === v.variantId
										);
										const variantOutOfStock = hasReservation
											? variantReservationStockInfo ? !variantReservationStockInfo.isInStock : false
											: false;

										return (
											<ListBox.Item
												key={v.variantId ?? 'default'}
												id={v.variantId ?? 'default'}
												textValue={`${v.variantName ?? 'Padrão'} - R$ ${(v.price / 100).toFixed(2).replace('.', ',')}`}
												className={`hero-text text-xs ${variantOutOfStock ? 'opacity-50' : ''}`}
											>
												<div className="flex items-center justify-between gap-2 flex-1">
													<span className={`hero-text truncate ${variantOutOfStock ? 'line-through' : ''}`}>
														{v.variantName ?? 'Padrão'}
													</span>
													<div className="flex items-center gap-1">
														{variantOutOfStock && (
															<span className="text-[9px] text-danger font-medium">Indisponível</span>
														)}
														<span className={`hero-text-muted shrink-0 ${variantOutOfStock ? 'line-through' : ''}`}>
															R$ {(v.price / 100).toFixed(2).replace('.', ',')}
														</span>
													</div>
												</div>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										);
									})}
								</ListBox>
							</Select.Popover>
						</Select>
					) : (
						product.variantName && <span className="hero-text-muted text-xs">{product.variantName}</span>
					)}

					<div className="flex items-center justify-between mt-1">
						<span className={`hero-text-muted text-xs ${isOutOfStock ? 'line-through' : ''}`}>
							R$ {(product.price / 100).toFixed(2).replace('.', ',')} × {product.quantity}
						</span>
						<div className="flex items-center gap-1.5">
							{isOutOfStock ? (
								<>
									<span className="hero-text-muted text-xs line-through">
										R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}
									</span>
									<Chip variant="primary" size="sm" color="danger">
										Sem estoque
									</Chip>
								</>
							) : isDiscountedProductItem ? (
								<>
									<span className="hero-text-muted text-xs line-through">
										R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}
									</span>
									<span className="hero-text-success text-sm font-semibold">
										R$ {(discountedTotal / 100).toFixed(2).replace('.', ',')}
									</span>
								</>
							) : (
								<span className="hero-text text-sm font-semibold">
									R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}
								</span>
							)}
							{!isOutOfStock && productTypeInfo && (
								<Chip
									variant="primary"
									size="sm"
									color={mapParseColorToChipColor(productTypeParse[product.type].color)}
								>
									{productTypeInfo.icon}
									{productTypeInfo.label}
								</Chip>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`flex gap-3 p-2 rounded-lg ${isOutOfStock ? 'bg-danger-soft' : ''}`}>
			{product.imageUrl ? (
				<Image
					src={product.imageUrl}
					alt={product.name}
					width={imageSize}
					height={imageSize}
					className={`${imageSizeClass} object-cover rounded-lg shrink-0`}
					unoptimized
				/>
			) : (
				<div className={`hero-surface ${imageSizeClass} rounded-lg shrink-0 flex items-center justify-center`}>
					<Icon icon={ImageNotFound01Icon} className={`${iconSize} hero-text-subtle`} />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="hero-text font-medium text-sm truncate">{group.name}</p>
					{isOutOfStock && (
						<Chip variant="primary" size="sm" color="danger">
							Sem estoque
						</Chip>
					)}
				</div>

				{hasMultipleVariants ? (
					<Select
						aria-label="Selecionar variante"
						value={group.selectedVariantId ?? product.variantId ?? null}
						onChange={(key) => {
							if (key) {
								onSelectVariant(group.productId, String(key));
							}
						}}
						className="mt-1 w-full"
					>
						<Select.Trigger
							className="hero-input h-8 text-xs border rounded-lg"
							style={{ '--hero-focus-color': primaryColor } as React.CSSProperties}
						>
							<Select.Value />
							<Select.Indicator className="hero-text-muted" />
						</Select.Trigger>
						<Select.Popover className="hero-surface border hero-border rounded-lg shadow-lg min-w-48">
							<ListBox>
								{group.variants.map((v) => {
									const variantReservationStockInfo = reservationItems?.find(
										(item) => item.productId === group.productId && item.variantId === v.variantId
									);
									const variantOutOfStock = hasReservation
										? variantReservationStockInfo ? !variantReservationStockInfo.isInStock : false
										: false;

									return (
										<ListBox.Item
											key={v.variantId ?? 'default'}
											id={v.variantId ?? 'default'}
											textValue={`${v.variantName ?? 'Padrão'} - R$ ${(v.price / 100).toFixed(2).replace('.', ',')}`}
											className={`hero-text text-xs ${variantOutOfStock ? 'opacity-50' : ''}`}
										>
											<div className="flex items-center justify-between gap-2 flex-1">
												<span className={`hero-text truncate ${variantOutOfStock ? 'line-through' : ''}`}>
													{v.variantName ?? 'Padrão'}
												</span>
												<div className="flex items-center gap-1">
													{variantOutOfStock && (
														<span className="text-[9px] text-danger font-medium">Indisponível</span>
													)}
													<span className={`hero-text-muted shrink-0 ${variantOutOfStock ? 'line-through' : ''}`}>
														R$ {(v.price / 100).toFixed(2).replace('.', ',')}
													</span>
												</div>
											</div>
											<ListBox.ItemIndicator />
										</ListBox.Item>
									);
								})}
							</ListBox>
						</Select.Popover>
					</Select>
				) : (
					product.variantName && <span className="hero-text-muted text-xs">{product.variantName}</span>
				)}

				<div className="hero-text-muted flex items-center gap-2 text-xs mt-1">
					<span className={isOutOfStock ? 'line-through' : ''}>
						R$ {(product.price / 100).toFixed(2).replace('.', ',')} × {product.quantity}
					</span>
				</div>
				<div className="flex items-center gap-2">
					{isOutOfStock ? (
						<p className="hero-text-muted text-sm font-semibold line-through">
							R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}
						</p>
					) : isDiscountedProductItem ? (
						<>
							<p className="hero-text-muted text-xs line-through">
								R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}
							</p>
							<p className="hero-text-success text-sm font-semibold">
								R$ {(discountedTotal / 100).toFixed(2).replace('.', ',')}
							</p>
						</>
					) : (
						<p className="hero-text text-sm font-semibold">R$ {(itemTotal / 100).toFixed(2).replace('.', ',')}</p>
					)}
					{!isOutOfStock && productTypeInfo && (
						<Chip variant="primary" size="sm" color={mapParseColorToChipColor(productTypeParse[product.type].color)}>
							{productTypeInfo.icon}
							{productTypeInfo.label}
						</Chip>
					)}
				</div>
			</div>
		</div>
	);
}
