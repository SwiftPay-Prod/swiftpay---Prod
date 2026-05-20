'use client';

import { CouponSearchCombobox } from '@/components/merchant/products/coupon-search-combobox';
import type { CouponsTabProps } from './types';

export function CouponsTab({
	merchantId,
	environment,
	selectedCouponIds,
	selectedCoupons,
	onSelectCoupon,
	onRemoveCoupon,
	disabled,
}: CouponsTabProps) {
	return (
		<div className="flex flex-col gap-4">
			<CouponSearchCombobox
				merchantId={merchantId}
				environment={environment}
				selectedCouponIds={selectedCouponIds}
				selectedCoupons={selectedCoupons}
				onSelect={onSelectCoupon}
				onRemove={onRemoveCoupon}
				isDisabled={disabled}
			/>
		</div>
	);
}
