'use client';

import { useState } from 'react';
import type { CheckoutProduct, ValidatedCoupon, ReservedOrderItemData } from '@/types/checkout';
import type { GroupedProduct } from '@/hooks';
import { Button, Separator } from '@heroui/react';
import { Icon } from '@/components/icon';
import {
	ArrowRight02Icon,
	Loading01Icon,
	ArrowUp01Icon,
	ArrowDown01Icon,
	Ticket02Icon,
	CheckmarkCircle02Icon,
	Cancel01Icon,
	Alert02Icon,
	ArrowReloadHorizontalIcon,
	Clock01Icon,
} from '@hugeicons/core-free-icons';
import type { CalculatedCheckout } from '@/types/checkout';
import { ReservingAlert } from './ReservingAlert';
import { ProductCard } from './ProductCard';

interface OrderSummaryProps {
	primaryColor: string;
	secondaryColor: string | null;
	products: CheckoutProduct[];
	groupedProducts: GroupedProduct[];
	onSelectVariant: (productId: string, variantId: string | null) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	isFormComplete: boolean;
	couponEnabled: boolean;
	appliedCoupon: ValidatedCoupon | null;
	couponCode: string;
	onCouponCodeChange: (code: string) => void;
	onApplyCoupon: () => void;
	onRemoveCoupon: () => void;
	isApplyingCoupon: boolean;
	couponError: string | null;
	discountedProduct: CheckoutProduct | null;
	submitError: string | null;
	calculation: CalculatedCheckout | null;
	isCalculating: boolean;
	reservationError: string | null;
	reservationItems?: ReservedOrderItemData[] | null;
	onResetReservation: () => void;
	isReserving: boolean;
	reservationRemainingSeconds: number;
}

function ValueSkeleton({ width = 'w-16' }: { width?: string }) {
	return <span className={`inline-block ${width} h-4 hero-bg-muted animate-pulse rounded`} />;
}

export function OrderSummary({
	primaryColor,
	secondaryColor,
	products,
	groupedProducts,
	onSelectVariant,
	onSubmit,
	isSubmitting,
	isFormComplete,
	couponEnabled,
	appliedCoupon,
	couponCode,
	onCouponCodeChange,
	onApplyCoupon,
	onRemoveCoupon,
	isApplyingCoupon,
	couponError,
	discountedProduct,
	submitError,
	calculation,
	isCalculating,
	reservationError,
	reservationItems,
	onResetReservation,
	isReserving,
	reservationRemainingSeconds,
}: OrderSummaryProps) {
	const [isProductsExpanded, setIsProductsExpanded] = useState(true);

	const gradientStyle = secondaryColor
		? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
		: { backgroundColor: primaryColor };

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const showReservationTimer = reservationRemainingSeconds > 0;
	const hasReservationItems = !!reservationItems && reservationItems.length > 0;
	const isDisabled = isSubmitting || !isFormComplete || isCalculating;
	const subtotal = calculation?.subtotal ?? 0;
	const discountAmount = calculation?.discount ?? 0;
	const shippingAmount = calculation?.shipping ?? 0;
	const total = calculation?.total ?? 0;
	const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);

	return (
		<div className="lg:sticky lg:top-24">
			<div className="hero-card">
				{/* Reserving Products */}
				{isReserving && (
					<div className="mb-4">
						<ReservingAlert primaryColor={primaryColor} />
					</div>
				)}

				{/* Reservation Timer */}
				{showReservationTimer && !isReserving && (
					<div className="mb-4">
						<div className="rounded-xl p-3" style={{ backgroundColor: `${primaryColor}15` }}>
							<div className="flex items-center gap-2">
								<Icon icon={Clock01Icon} className="icon-sm" style={{ color: primaryColor }} />
								<p className="text-sm hero-text">
									Produtos reservados por{' '}
									<span className="font-bold" style={{ color: primaryColor }}>
										{formatTime(reservationRemainingSeconds)}
									</span>
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Stock Reservation Error */}
				{reservationError && !isReserving && (
					<div className="mb-4">
						<div className="hero-alert-danger rounded-xl p-3">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<Icon icon={Alert02Icon} className="icon-sm shrink-0" />
									<p className="text-sm">{reservationError}</p>
								</div>
								<button
									type="button"
									onClick={onResetReservation}
									className="shrink-0 flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors cursor-pointer"
								>
									<Icon icon={ArrowReloadHorizontalIcon} className="icon-xs" />
									Tentar
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Products Accordion Header */}
				<button
					type="button"
					onClick={() => setIsProductsExpanded(!isProductsExpanded)}
					className="w-full flex items-center justify-between mb-4 cursor-pointer"
				>
					<div className="flex items-center gap-2">
						<h3 className="hero-text-muted text-xs font-semibold tracking-[.2rem]">RESUMO</h3>
						<span className="hero-bg-muted hero-text-muted text-xs px-2 py-0.5 rounded-full">
							{totalItems} {totalItems === 1 ? 'item' : 'itens'}
						</span>
					</div>
					<Icon icon={isProductsExpanded ? ArrowUp01Icon : ArrowDown01Icon} className="icon-sm hero-text-muted" />
				</button>

				{/* Products List - Accordion Content */}
				<div
					className={`overflow-hidden transition-all duration-300 ease-in-out ${
						isProductsExpanded ? 'max-h-150 opacity-100' : 'max-h-0 opacity-0'
					}`}
				>
					<div className="space-y-4 mb-4">
						{groupedProducts.map((group) => (
							<ProductCard
								key={group.productId}
								group={group}
								primaryColor={primaryColor}
								appliedCoupon={appliedCoupon}
								discountedProduct={discountedProduct}
								discountAmount={discountAmount}
								calculationItems={calculation?.items ?? null}
								reservationItems={reservationItems}
								onSelectVariant={onSelectVariant}
								hasReservation={hasReservationItems}
							/>
						))}
					</div>

					{/* Coupon Section - Inside Accordion */}
					{couponEnabled && (
						<div className="pt-3 mb-4 border-t hero-border">
							{appliedCoupon ? (
								<div className="hero-alert-success rounded-xl p-3">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2 min-w-0">
											<Icon icon={CheckmarkCircle02Icon} className="icon-sm shrink-0" />
											<div className="min-w-0">
												<p className="text-xs font-semibold truncate">{appliedCoupon.code}</p>
												<p className="text-[10px] opacity-80 truncate">
													{appliedCoupon.name}
													{appliedCoupon.scope === 'Product' && discountedProduct && (
														<span className="block mt-0.5">Aplicado em: {discountedProduct.name}</span>
													)}
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={onRemoveCoupon}
											className="shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
										>
											<Icon icon={Cancel01Icon} className="icon-sm" />
										</button>
									</div>
								</div>
							) : (
								<div className="space-y-2">
									<div className="flex gap-2">
										<div className="relative flex-1">
											<Icon
												icon={Ticket02Icon}
												className="icon-sm absolute left-3 top-1/2 -translate-y-1/2 hero-text-muted z-10"
											/>
											<input
												type="text"
												value={couponCode}
												onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
												placeholder="Código do cupom"
												className="hero-input w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl transition-colors"
												style={{ '--hero-focus-color': primaryColor } as React.CSSProperties}
											/>
										</div>
										<Button
											onPress={onApplyCoupon}
											isDisabled={!couponCode.trim() || isApplyingCoupon}
											isPending={isApplyingCoupon}
											style={gradientStyle}
											className="px-4 h-auto py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
										>
											Aplicar
										</Button>
									</div>
									{couponError && <p className="hero-text-danger text-xs truncate">{couponError}</p>}
								</div>
							)}
						</div>
					)}
				</div>

				<Separator className="hero-separator" />
				<div className="pt-4 space-y-2">
					<div className="flex justify-between items-center">
						<span className="hero-text-muted text-[10px] uppercase truncate">
							Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
						</span>
						{isCalculating ? (
							<ValueSkeleton />
						) : (
							<span className="hero-text-muted text-sm shrink-0">
								R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
							</span>
						)}
					</div>

					{shippingAmount > 0 && (
						<div className="flex justify-between items-center">
							<span className="hero-text-muted text-[10px] uppercase truncate">Frete</span>
							{isCalculating ? (
								<ValueSkeleton />
							) : (
								<span className="hero-text-muted text-sm shrink-0">
									R$ {(shippingAmount / 100).toFixed(2).replace('.', ',')}
								</span>
							)}
						</div>
					)}

					{discountAmount > 0 && appliedCoupon && (
						<div className="flex justify-between items-center">
							<span className="hero-text-success text-[10px] uppercase truncate">
								Desconto{' '}
								{appliedCoupon.discountType === 'Percentage'
									? `(${(appliedCoupon.discountPercentage ?? 0) / 100}%)`
									: `(R$ ${((appliedCoupon.discountFixedAmount ?? 0) / 100).toFixed(2).replace('.', ',')})`}
							</span>
							{isCalculating ? (
								<ValueSkeleton />
							) : (
								<span className="hero-text-success text-sm shrink-0">
									- R$ {(discountAmount / 100).toFixed(2).replace('.', ',')}
								</span>
							)}
						</div>
					)}

					<Separator className="hero-separator" />

					<div className="flex justify-between items-center">
						<span className="hero-text-muted text-xs font-semibold uppercase truncate">Total</span>
						{isCalculating ? (
							<span className="inline-block w-28 h-8 hero-bg-muted animate-pulse rounded" />
						) : (
							<span className="hero-text text-3xl font-extrabold italic shrink-0">
								R$ {(total / 100).toFixed(2).replace('.', ',')}
							</span>
						)}
					</div>
				</div>

				{submitError && (
					<div className="hero-alert-danger rounded-xl p-3 mb-4">
						<p className="text-sm">{submitError}</p>
					</div>
				)}

				{/* Submit Button */}
				<button
					type="button"
					onClick={onSubmit}
					disabled={isDisabled}
					style={isDisabled ? undefined : gradientStyle}
					className="hero-btn-submit w-full mt-6 py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg hover:opacity-90 cursor-pointer disabled:cursor-not-allowed"
				>
					{isSubmitting ? (
						<span className="flex items-center justify-center gap-2">
							<Icon icon={Loading01Icon} className="icon-md animate-spin" />
							Processando...
						</span>
					) : (
						<div className="flex items-center justify-center gap-2">
							CONFIRMAR PAGAMENTO
							<Icon icon={ArrowRight02Icon} className="icon-md" />
						</div>
					)}
				</button>

				{/* Security Badge */}
				<p className="hero-text-subtle mt-4 text-[10px] text-center">
					Ao clicar em <b className="uppercase">confirmar pagamento</b>, você concorda com nossos{' '}
					<button type="button" style={{ color: primaryColor }} className="hover:underline">
						Termos de Uso
					</button>{' '}
					e{' '}
					<button type="button" style={{ color: primaryColor }} className="hover:underline">
						Política de Privacidade
					</button>
					.
				</p>
			</div>
		</div>
	);
}
