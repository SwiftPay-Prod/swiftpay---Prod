'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

interface AnimatedCurrencyProps {
	value: number | null;
	duration?: number;
	className?: string;
	compact?: boolean;
	prefix?: string;
}

export function AnimatedCurrency({ value, duration = 1000, className, compact = false, prefix }: AnimatedCurrencyProps) {
	const isClient = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false
	);
	const displayValueRef = useRef(0);
	const animationRef = useRef<number | null>(null);
	const hasAnimatedRef = useRef(false);
	const spanRef = useRef<HTMLSpanElement>(null);

	const formatValue = useCallback(
		(val: number) => {
			const formatted = compact
				? new Intl.NumberFormat('pt-BR', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
				  }).format(val / 100)
				: new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL',
				  }).format(val / 100);
			return prefix ? `${prefix} ${formatted}` : formatted;
		},
		[compact, prefix]
	);

	useEffect(() => {
		if (!isClient || !spanRef.current) return;

		if (value === null || value === undefined) {
			displayValueRef.current = 0;
			hasAnimatedRef.current = false;
			spanRef.current.textContent = formatValue(0);
			return;
		}

		if (hasAnimatedRef.current && displayValueRef.current === value) {
			return;
		}

		const startValue = 0;
		const endValue = value;
		const startTime = performance.now();

		function animate(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			const easeOutQuart = 1 - Math.pow(1 - progress, 4);
			const currentValue = startValue + (endValue - startValue) * easeOutQuart;

			displayValueRef.current = currentValue;
			if (spanRef.current) {
				spanRef.current.textContent = formatValue(currentValue);
			}

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				hasAnimatedRef.current = true;
			}
		}

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [value, duration, isClient, compact, formatValue]);

	if (!isClient) {
		return <span className={className} aria-live="polite">-</span>;
	}

	return <span ref={spanRef} className={className} aria-live="polite">{formatValue(0)}</span>;
}

