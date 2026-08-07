import type { Paginated, PaginationParams } from '../common';
import type { DigitalItemStatus, DigitalItemType, PaymentEnvironment } from '../enums';

export interface MinimalDigitalItem {
	id: string;
	productId: string;
	variantId: string | null;
	variantName: string | null;
	type: DigitalItemType;
	content: string;
	contentPreview: string;
	label: string | null;
	status: DigitalItemStatus;
	deliveredAt: string | null;
	deliveredToOrderId: string | null;
	deliveredToOrderNumber: string | null;
	createdAt: string;
}

export interface ReadListDigitalItemsData {
	items: Paginated<MinimalDigitalItem>;
	stats: DigitalItemStats;
}

export interface DigitalItemData extends MinimalDigitalItem {
	product: {
		id: string;
		name: string;
	} | null;
	variant: {
		id: string;
		name: string;
	} | null;
	deliveryInfo: {
		orderId: string;
		orderNumber: string;
		customerName: string | null;
		customerEmail: string | null;
		deliveredAt: string;
	} | null;
}

export interface DigitalItemStats {
	totalItems: number;
	availableItems: number;
	reservedItems: number;
	deliveredItems: number;
	disabledItems: number;
	variantIdsWithItems: string[];
}

export interface ReadListDigitalItemsRequest extends PaginationParams {
	merchantId: string;
	productId: string;
	variantId?: string | null;
	status?: DigitalItemStatus | null;
	type?: DigitalItemType | null;
	environment?: PaymentEnvironment | null;
}

export interface CreateDigitalItemRequest {
	merchantId: string;
	productId: string;
	variantId?: string | null;
	type: DigitalItemType;
	content: string;
	label?: string | null;
}

export interface CreateBulkDigitalItemsRequest {
	merchantId: string;
	productId: string;
	variantId?: string | null;
	type: DigitalItemType;
	label?: string | null;
	contents: string[];
}

export interface CreateBulkDigitalItemsResponse {
	createdCount: number;
	duplicateCount: number;
}

export interface UpdateDigitalItemRequest {
	merchantId: string;
	productId: string;
	itemId: string;
	type?: DigitalItemType | null;
	content?: string | null;
	label?: string | null;
	status?: DigitalItemStatus | null;
}

export interface DeleteDigitalItemRequest {
	merchantId: string;
	productId: string;
	itemId: string;
}

