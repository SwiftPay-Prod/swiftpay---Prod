'use client';

import { use } from 'react';
import type { ProductData } from '@/types/merchant/products';
import type { ApiResponse } from '@/types/common';
import type { PaymentEnvironment } from '@/types/enums';
import { DigitalProductFormContent } from './digital-product-form-content';

type ProductPromise = Promise<ApiResponse<ProductData>>;

export interface DigitalProductFormProps {
	merchantId: string;
	environment: PaymentEnvironment;
	productPromise?: ProductPromise;
}

export function DigitalProductForm({ merchantId, environment, productPromise }: DigitalProductFormProps) {
	const response = productPromise ? use(productPromise) : null;
	const product = response?.data ?? null;
	const formKey = [
		environment,
		product?.id ?? 'new',
		product?.status ?? 'unknown',
		product?.categories?.length ?? 0,
		product?.coupons?.length ?? 0,
		product?.variants?.length ?? 0,
	].join('-');

	return <DigitalProductFormContent key={formKey} merchantId={merchantId} environment={environment} product={product} />;
}
