'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderClient, reactivateOrderClient } from '@/clients/checkout-api';
import type { GetOrderData, ReservedOrderData } from '@/types/checkout';

interface UseOrderRecoveryOptions {
	checkoutShortId: string;
	enabled?: boolean;
}

interface UseOrderRecoveryResult {
	recoveredOrder: GetOrderData | null;
	reactivatedOrder: ReservedOrderData | null;
	isRecovering: boolean;
	recoveryError: string | null;
	orderId: string | null;
	wasReactivated: boolean;
}

export function useOrderRecovery({
	checkoutShortId,
	enabled = true,
}: UseOrderRecoveryOptions): UseOrderRecoveryResult {
	const searchParams = useSearchParams();
	const [recoveredOrder, setRecoveredOrder] = useState<GetOrderData | null>(null);
	const [reactivatedOrder, setReactivatedOrder] = useState<ReservedOrderData | null>(null);
	const [isRecovering, setIsRecovering] = useState(false);
	const [recoveryError, setRecoveryError] = useState<string | null>(null);
	const [wasReactivated, setWasReactivated] = useState(false);
	
	const hasRecoveredRef = useRef(false);
	const orderId = searchParams.get('orderId');

	const recoverOrder = useCallback(async (orderIdToRecover: string) => {
		if (hasRecoveredRef.current) return;
		
		hasRecoveredRef.current = true;
		setIsRecovering(true);
		setRecoveryError(null);
		setWasReactivated(false);

		try {
			const response = await getOrderClient(checkoutShortId, orderIdToRecover);

			if (response.error) {
				setRecoveryError(response.error.message);
				return;
			}

			if (!response.data) {
				setRecoveryError('Pedido não encontrado.');
				return;
			}

			if (response.data.orderStatus === 'Expired') {
				const reactivateResponse = await reactivateOrderClient(checkoutShortId, orderIdToRecover);

				if (reactivateResponse.error) {
					setRecoveryError(reactivateResponse.error.message);
					return;
				}

				if (reactivateResponse.data) {
					setReactivatedOrder(reactivateResponse.data);
					setWasReactivated(true);
					
					const updatedOrderResponse = await getOrderClient(checkoutShortId, orderIdToRecover);
					if (updatedOrderResponse.data) {
						setRecoveredOrder(updatedOrderResponse.data);
					}
				}
			} else {
				setRecoveredOrder(response.data);
			}
		} catch {
			setRecoveryError('Erro ao recuperar pedido.');
		} finally {
			setIsRecovering(false);
		}
	}, [checkoutShortId]);

	useEffect(() => {
		if (enabled && orderId && !hasRecoveredRef.current && !recoveredOrder) {
			recoverOrder(orderId);
		}
	}, [enabled, orderId, recoveredOrder, recoverOrder]);

	return {
		recoveredOrder,
		reactivatedOrder,
		isRecovering,
		recoveryError,
		orderId,
		wasReactivated,
	};
}
