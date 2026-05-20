'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CheckoutProduct } from '@/types/checkout';

export interface GroupedProduct {
	productId: string;
	name: string;
	description: string | null;
	type: CheckoutProduct['type'];
	imageUrl: string | null;
	imageUrls: string[] | null;
	quantity: number;
	maxQuantity: number | null;
	displayOrder: number;
	variants: CheckoutProduct[];
	selectedVariantId: string | null;
	selectedVariant: CheckoutProduct;
}

interface UseGroupedProductsResult {
	groupedProducts: GroupedProduct[];
	selectedProducts: CheckoutProduct[];
	selectVariant: (productId: string, variantId: string | null) => void;
	hasMultipleVariants: (productId: string) => boolean;
}

export function useGroupedProducts(products: CheckoutProduct[]): UseGroupedProductsResult {
	const [selectedVariants, setSelectedVariants] = useState<Record<string, string | null>>(() => {
		const initial: Record<string, string | null> = {};
		const grouped = new Map<string, CheckoutProduct[]>();

		for (const product of products) {
			const key = product.productId;
			if (!grouped.has(key)) {
				grouped.set(key, []);
			}
			grouped.get(key)!.push(product);
		}

		for (const [productId, variants] of grouped) {
			initial[productId] = variants[0]?.variantId ?? null;
		}

		return initial;
	});

	const groupedProducts = useMemo<GroupedProduct[]>(() => {
		const grouped = new Map<string, CheckoutProduct[]>();

		for (const product of products) {
			const key = product.productId;
			if (!grouped.has(key)) {
				grouped.set(key, []);
			}
			grouped.get(key)!.push(product);
		}

		const result: GroupedProduct[] = [];

		for (const [productId, variants] of grouped) {
			const firstVariant = variants[0];
			const selectedVariantId = selectedVariants[productId] ?? firstVariant.variantId;
			const selectedVariant = variants.find((v) => v.variantId === selectedVariantId) ?? firstVariant;

			result.push({
				productId,
				name: firstVariant.name,
				description: firstVariant.description,
				type: firstVariant.type,
				imageUrl: selectedVariant.imageUrl ?? firstVariant.imageUrl,
				imageUrls: firstVariant.imageUrls,
				quantity: firstVariant.quantity,
				maxQuantity: firstVariant.maxQuantity,
				displayOrder: firstVariant.displayOrder,
				variants,
				selectedVariantId,
				selectedVariant,
			});
		}

		return result.sort((a, b) => a.displayOrder - b.displayOrder);
	}, [products, selectedVariants]);

	const selectedProducts = useMemo<CheckoutProduct[]>(() => {
		return groupedProducts.map((g) => g.selectedVariant);
	}, [groupedProducts]);

	const selectVariant = useCallback((productId: string, variantId: string | null) => {
		setSelectedVariants((prev) => ({
			...prev,
			[productId]: variantId,
		}));
	}, []);

	const hasMultipleVariants = useCallback(
		(productId: string) => {
			const group = groupedProducts.find((g) => g.productId === productId);
			return group ? group.variants.length > 1 : false;
		},
		[groupedProducts]
	);

	return {
		groupedProducts,
		selectedProducts,
		selectVariant,
		hasMultipleVariants,
	};
}
