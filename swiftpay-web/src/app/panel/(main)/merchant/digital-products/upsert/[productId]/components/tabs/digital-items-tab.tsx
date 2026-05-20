'use client';

import { DigitalItemsSection } from '../digital-items-section';
import type { DigitalItemsTabProps } from './types';

export function DigitalItemsTab({
	merchantId,
	productId,
	variants,
	isEditMode,
	pendingDigitalItems,
	setPendingDigitalItems,
	isUnlimitedStock,
	onUnlimitedStockChange,
	disabled,
}: DigitalItemsTabProps) {
	return (
		<DigitalItemsSection
			merchantId={merchantId}
			productId={productId}
			variants={isEditMode ? variants : []}
			pendingItems={pendingDigitalItems}
			onPendingItemsChange={setPendingDigitalItems}
			isUnlimitedStock={isUnlimitedStock}
			onUnlimitedStockChange={onUnlimitedStockChange}
			disabled={disabled}
		/>
	);
}
