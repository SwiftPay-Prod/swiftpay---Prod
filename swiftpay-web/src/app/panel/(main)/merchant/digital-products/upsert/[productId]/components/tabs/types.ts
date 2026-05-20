import type { PaymentEnvironment } from '@/types/enums';
import type { MinimalCategoryData, ProductVariantData, CreateVariantRequest } from '@/types/merchant/products';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import type { PendingDigitalItem } from '../digital-items-section';

export interface PendingVariant extends CreateVariantRequest {
	tempId: string;
}

export interface BasicInfoTabProps {
	name: string;
	setName: (value: string) => void;
	description: string;
	setDescription: (value: string) => void;
	externalId: string;
	setExternalId: (value: string) => void;
	isEditMode: boolean;
	disabled?: boolean;
}

export interface PriceTabProps {
	priceInCents: number | null;
	setPriceInCents: (cents: number | null) => void;
	disabled?: boolean;
}

export interface ImagesTabProps {
	merchantId: string;
	imageUrls: string[];
	setImageUrls: (value: string[]) => void;
	disabled?: boolean;
}

export interface CategoriesTabProps {
	merchantId: string;
	environment: PaymentEnvironment;
	categories: MinimalCategoryData[];
	setCategories: (categories: MinimalCategoryData[]) => void;
	selectedCategoryIds: string[];
	onSelectCategory: (category: MinimalCategoryData) => void;
	onRemoveCategory: (categoryId: string) => void;
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
	isEditMode: boolean;
	variants: ProductVariantData[];
	pendingVariants: PendingVariant[];
	isUnlimitedStock: boolean;
	onOpenCreateModal: () => void;
	onEditVariant: (variant: ProductVariantData) => void;
	onDeleteVariant: (variantId: string) => void;
	onRemovePendingVariant: (tempId: string) => void;
	disabled?: boolean;
}

export interface DigitalItemsTabProps {
	merchantId: string;
	productId: string | null;
	variants: ProductVariantData[];
	isEditMode: boolean;
	pendingDigitalItems: PendingDigitalItem[];
	setPendingDigitalItems: (items: PendingDigitalItem[]) => void;
	isUnlimitedStock: boolean;
	onUnlimitedStockChange: (value: boolean) => void;
	disabled?: boolean;
}
