'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { calculateCheckoutClient } from '@/clients/checkout-api';
import type { CheckoutProduct, CalculatedCheckout, CalculateCheckoutItem } from '@/types/checkout';

interface UseCheckoutCalculationProps {
  checkoutShortId: string;
  products: CheckoutProduct[];
  couponCode: string | null;
  zipCode?: string;
  initialCalculation?: CalculatedCheckout | null;
}

interface CheckoutCalculationResult {
  calculation: CalculatedCheckout | null;
  isCalculating: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCheckoutCalculation({
  checkoutShortId,
  products,
  couponCode,
  zipCode,
  initialCalculation,
}: UseCheckoutCalculationProps): CheckoutCalculationResult {
  const [calculatedValues, setCalculatedValues] = useState<CalculatedCheckout | null>(initialCalculation ?? null);
  const [isLoading, setIsLoading] = useState(!initialCalculation);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);
  const isFirstFetch = useRef(!!initialCalculation);

  // Build items array from products
  const items: CalculateCheckoutItem[] = useMemo(() => {
    return products.map((p) => ({
      productId: p.productId,
      variantId: p.variantId,
      quantity: p.quantity,
    }));
  }, [products]);

  // Build request key to detect changes
  const requestKey = useMemo(() => {
    return JSON.stringify({
      items,
      couponCode: couponCode ?? null,
      zipCode: zipCode ?? null,
    });
  }, [items, couponCode, zipCode]);

  // Refetch function
  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  // Fetch calculation when request changes
  useEffect(() => {
    // Skip the first fetch if we have initialCalculation
    if (isFirstFetch.current) {
      isFirstFetch.current = false;
      return;
    }

    const abortController = new AbortController();

    async function fetchCalculation() {
      setIsLoading(true);
      setError(null);

      try {
        const request = JSON.parse(requestKey);
        const response = await calculateCheckoutClient(checkoutShortId, request, abortController.signal);

        if (abortController.signal.aborted) return;

        if (response.error) {
          setError(response.error.message);
          setCalculatedValues(null);
        } else if (response.data) {
          setCalculatedValues(response.data);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setError('Erro ao calcular valores');
          setCalculatedValues(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchCalculation();

    return () => {
      abortController.abort();
    };
  }, [checkoutShortId, requestKey, refetchCounter]);

  // Calculate local subtotal for initial display (before API response)
  const localSubtotal = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * p.quantity, 0);
  }, [products]);

  // Merge with defaults when calculation is null
  const calculation: CalculatedCheckout | null = calculatedValues
    ? calculatedValues
    : isLoading
    ? {
        subtotal: localSubtotal,
        discount: 0,
        shipping: 0,
        total: localSubtotal,
        couponValid: false,
        couponError: null,
        items: products.map((p) => ({
          productId: p.productId,
          variantId: p.variantId,
          productName: p.name,
          variantName: p.variantName ?? null,
          imageUrl: p.imageUrl ?? null,
          quantity: p.quantity,
          unitPrice: p.price,
          totalPrice: p.price * p.quantity,
          stockQuantity: null,
          isInStock: true,
        })),
      }
    : null;

  return {
    calculation,
    isCalculating: isLoading,
    error,
    refetch,
  };
}
