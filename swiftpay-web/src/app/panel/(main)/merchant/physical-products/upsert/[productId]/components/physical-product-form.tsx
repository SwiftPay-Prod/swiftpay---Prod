'use client';

import { use } from 'react';
import type { ApiResponse } from '@/types/common';
import type { ProductData } from '@/types/merchant/products';
import type { PaymentEnvironment } from '@/types/enums';
import { PhysicalProductFormContent } from './physical-product-form-content';

type ProductPromise = Promise<ApiResponse<ProductData>>;

interface PhysicalProductFormProps {
  merchantId: string;
  environment: PaymentEnvironment;
  product?: ProductData | null;
  productPromise?: ProductPromise | null;
}

export function PhysicalProductForm({
  merchantId,
  environment,
  product,
  productPromise,
}: PhysicalProductFormProps) {
  const response = productPromise ? use(productPromise) : null;
  const resolvedProduct = product ?? response?.data ?? null;
  const formKey = [
    environment,
    resolvedProduct?.id ?? 'new',
    resolvedProduct?.status ?? 'unknown',
    resolvedProduct?.categories?.length ?? 0,
    resolvedProduct?.coupons?.length ?? 0,
    resolvedProduct?.variants?.length ?? 0,
  ].join('-');

  return (
    <PhysicalProductFormContent
      key={formKey}
      merchantId={merchantId}
      environment={environment}
      product={resolvedProduct}
    />
  );
}
