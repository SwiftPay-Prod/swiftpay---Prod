'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { reserveOrderClient } from '@/clients/checkout-api';
import type { ReservedOrderData, CheckoutProduct } from '@/types/checkout';
import { useRouter } from 'next/navigation';

interface UseOrderReservationOptions {
	checkoutShortId: string;
	products: CheckoutProduct[];
	email: string;
	document: string | null;
	requireDocument: boolean;
	couponCode: string | null;
	enabled?: boolean;
	/** Initial reservation data when recovering an existing order */
	initialReservation?: ReservedOrderData | null;
}

interface UseOrderReservationResult {
	reservation: ReservedOrderData | null;
	isReserving: boolean;
	reservationError: string | null;
	isExpired: boolean;
	remainingSeconds: number;
	resetReservation: () => void;
}

function generateSessionId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCpf(cpf: string): boolean {
	const cleaned = cpf.replace(/\D/g, '');
	return cleaned.length === 11;
}

export function useOrderReservation({
	checkoutShortId,
	products,
	email,
	document,
	requireDocument,
	couponCode,
	enabled = true,
	initialReservation = null,
}: UseOrderReservationOptions): UseOrderReservationResult {
  const router = useRouter();
	const [reservation, setReservation] = useState<ReservedOrderData | null>(initialReservation);
	const [isReserving, setIsReserving] = useState(false);
	const [reservationError, setReservationError] = useState<string | null>(null);
	const [isExpired, setIsExpired] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState(0);

	const sessionIdRef = useRef<string>(generateSessionId());
	// Mark as already reserved if we have an initial reservation
	const hasReservedRef = useRef(!!initialReservation);
	const isReservingRef = useRef(false);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Initialize timer for initial reservation
	useEffect(() => {
		if (initialReservation && !isExpired) {
			const expiresAt = new Date(initialReservation.displayExpiresAt).getTime();
			const now = Date.now();
			const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
			// eslint-disable-next-line react-hooks/set-state-in-effect -- initialize timer from initialReservation is intentional sync
			setRemainingSeconds(remaining);

			if (remaining <= 0) {
				setIsExpired(true);
			}
		}
	}, [initialReservation, isExpired]);

	// Use refs for values that change frequently but shouldn't trigger effect reruns
	const emailRef = useRef(email);
	const documentRef = useRef(document);
	const productsRef = useRef(products);
	const couponCodeRef = useRef(couponCode);
	// Update refs when values change (in effect to avoid React Compiler "refs during render" error)
	useEffect(() => {
		emailRef.current = email;
		documentRef.current = document;
		productsRef.current = products;
		couponCodeRef.current = couponCode;
	}, [email, document, products, couponCode]);


	const isFormReady = useMemo(() => {
		if (!enabled) return false;
		if (!isValidEmail(email)) return false;
		if (requireDocument && !isValidCpf(document ?? '')) return false;
		return true;
	}, [enabled, email, document, requireDocument]);

	const createReservation = useCallback(async () => {
		if (hasReservedRef.current || isReservingRef.current) return;

		hasReservedRef.current = true;
		isReservingRef.current = true;
		setIsReserving(true);
		setReservationError(null);

		try {
			const response = await reserveOrderClient(checkoutShortId, {
				sessionId: sessionIdRef.current,
				items: productsRef.current.map((p) => ({
					productId: p.productId,
					variantId: p.variantId,
					quantity: p.quantity,
				})),
				customer: {
					email: emailRef.current.trim(),
					document: requireDocument && documentRef.current ? documentRef.current.replace(/\D/g, '') : null,
				},
				couponCode: couponCodeRef.current?.trim() || null,
			});

			if (response.error) {
				setReservationError(response.error.message);
				// Don't reset hasReservedRef to avoid infinite loop on persistent errors (e.g., out-of-stock)
				// User must manually reset via resetReservation() or refresh the page
				return;
			}

			if (response.data) {
				setReservation(response.data);

				// Update URL with orderId using history API (more reliable than router.replace)
				const params = new URLSearchParams(window.location.search);
				params.set('orderId', response.data.orderId);
				const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.replace(newUrl);
        
				const expiresAt = new Date(response.data.displayExpiresAt).getTime();
				const now = Date.now();
				const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
				setRemainingSeconds(remaining);
			}
		} catch {
			setReservationError('Erro ao reservar produtos. Tente novamente.');
			hasReservedRef.current = false;
		} finally {
			isReservingRef.current = false;
			setIsReserving(false);
		}
	}, [checkoutShortId, requireDocument, router]);

	useEffect(() => {
		if (isFormReady && !hasReservedRef.current && !reservation && !isReservingRef.current) {
			createReservation();
		}
	}, [isFormReady, reservation, createReservation]);

	useEffect(() => {
		if (!reservation || isExpired) return;

		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
		}

		timerIntervalRef.current = setInterval(() => {
			const expiresAt = new Date(reservation.displayExpiresAt).getTime();
			const now = Date.now();
			const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

			setRemainingSeconds(remaining);

			if (remaining <= 0) {
				setIsExpired(true);
				if (timerIntervalRef.current) {
					clearInterval(timerIntervalRef.current);
					timerIntervalRef.current = null;
				}
			}
		}, 1000);

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
		};
	}, [reservation, isExpired]);

	const resetReservation = useCallback(() => {
		setReservation(null);
		setIsExpired(false);
		setRemainingSeconds(0);
		setReservationError(null);
		hasReservedRef.current = false;
		sessionIdRef.current = generateSessionId();

		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
		}
	}, []);

	return {
		reservation,
		isReserving,
		reservationError,
		isExpired,
		remainingSeconds,
		resetReservation,
	};
}
