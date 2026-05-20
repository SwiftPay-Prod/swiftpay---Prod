import type { ReactNode } from 'react';
import type { ProductVariantData, MinimalCategoryData, CreateVariantRequest } from '@/types/merchant/products';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import type { PaymentEnvironment } from '@/types/enums';

export interface SectionHeaderProps {
	icon: ReactNode;
	title: string;
	description: string;
	action?: ReactNode;
}

export interface PendingVariant extends CreateVariantRequest {
	tempId: string;
}

export interface BasicInfoTabProps {
	name: string;
	setName: (name: string) => void;
	description: string;
	setDescription: (description: string) => void;
	externalId: string;
	setExternalId: (externalId: string) => void;
	disabled?: boolean;
}

export interface PriceTabProps {
	priceValue: number | undefined;
	setPriceValue: (price: number | undefined) => void;
	disabled?: boolean;
}

export interface StockTabProps {
	isEditMode: boolean;
	isUnlimitedStock: boolean;
	setIsUnlimitedStock: (unlimited: boolean) => void;
	stockQuantity: number | undefined;
	setStockQuantity: (quantity: number | undefined) => void;
	showMainStock: boolean;
	showVariantStock: boolean;
	variants: ProductVariantData[];
	onOpenMainAdjustment: () => void;
	onOpenVariantAdjustment: (variant: ProductVariantData) => void;
	disabled?: boolean;
}

export interface ImagesTabProps {
	merchantId: string;
	imageUrls: string[];
	setImageUrls: (urls: string[]) => void;
	disabled?: boolean;
}

export interface CategoriesTabProps {
	merchantId: string;
	environment: PaymentEnvironment;
	categories: MinimalCategoryData[];
	selectedCategoryIds: string[];
	onSelectCategory: (category: MinimalCategoryData) => void;
	onRemoveCategory: (categoryId: string) => void;
	onCategoryCreated: (category: MinimalCategoryData) => void;
	disabled?: boolean;
}

export interface CouponsTabProps {
	merchantId: string;
	environment: PaymentEnvironment;
	selectedCouponIds: string[];
	selectedCoupons: MinimalCoupon[];
	onSelectCoupon: (coupon: MinimalCoupon) => void;
	onRemoveCoupon: (couponId: string) => void;
	disabled?: boolean;
}

export interface VariantsTabProps {
	merchantId: string;
	isEditMode: boolean;
	isUnlimitedStock: boolean;
	variants: ProductVariantData[];
	pendingVariants: PendingVariant[];
	onCreateVariant: () => void;
	onEditVariant: (variant: ProductVariantData) => void;
	onDeleteVariant: (variantId: string) => void;
	onRemovePendingVariant: (tempId: string) => void;
	disabled?: boolean;
}
