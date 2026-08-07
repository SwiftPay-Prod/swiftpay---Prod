'use client';

import { Input } from '@heroui/react';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

type BaseInputProps = ComponentProps<typeof Input>;

export interface CurrencyCentsInputRef {
	setValueInCents: (cents: number) => void;
}

interface CurrencyCentsInputProps extends Omit<BaseInputProps, 'value' | 'onChange' | 'defaultValue'> {
	onValueChange: (formattedValue: string) => void;
	initialValueInCents?: number;
}

function digitsToDisplay(digits: string): string {
	if (!digits || parseInt(digits, 10) === 0) return '';
	const padded = digits.padStart(3, '0');
	const intPart = padded.slice(0, -2).replace(/^0+/, '') || '0';
	const decPart = padded.slice(-2);
	const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return `R$ ${withSep},${decPart}`;
}

export const CurrencyCentsInput = forwardRef<CurrencyCentsInputRef, CurrencyCentsInputProps>(
	function CurrencyCentsInputInner({
		onValueChange,
		initialValueInCents,
		placeholder = 'R$ 0,00',
		...props
	}: CurrencyCentsInputProps, ref) {
	const [rawDigits, setRawDigits] = useState(() =>
		initialValueInCents != null ? String(Math.round(initialValueInCents)) : ''
	);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const nextDigits = initialValueInCents != null ? String(Math.round(initialValueInCents)) : '';
		setRawDigits((prev) => (prev === nextDigits ? prev : nextDigits));
	}, [initialValueInCents]);

	useImperativeHandle(ref, () => ({
		setValueInCents(cents: number) {
			const digits = String(Math.round(cents));
			setRawDigits(digits);
			onValueChange(digitsToDisplay(digits));
		},
	}));

	useEffect(() => {
		const input = wrapperRef.current?.querySelector<HTMLInputElement>('input');
		if (!input) return;

		const moveToEnd = () => {
			const len = input.value.length;
			input.setSelectionRange(len, len);
		};

		input.addEventListener('mouseup', moveToEnd);
		input.addEventListener('focus', moveToEnd);

		return () => {
			input.removeEventListener('mouseup', moveToEnd);
			input.removeEventListener('focus', moveToEnd);
		};
	}, []);

	useLayoutEffect(() => {
		const input = wrapperRef.current?.querySelector<HTMLInputElement>('input');
		if (!input) return;
		const len = input.value.length;
		input.setSelectionRange(len, len);
	}, [rawDigits]);

	function update(newDigits: string) {
		setRawDigits(newDigits);
		onValueChange(digitsToDisplay(newDigits));
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		const { selectionStart, selectionEnd } = e.currentTarget;
		const hasSelection = selectionStart !== selectionEnd;

		if (e.key === 'Backspace') {
			e.preventDefault();
			update(hasSelection ? '' : rawDigits.slice(0, -1));
			return;
		}

		if (e.key === 'Delete') {
			e.preventDefault();
			if (hasSelection) update('');
			return;
		}

		if (/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			update(rawDigits + e.key);
			return;
		}

		// Allow Tab, Enter, ArrowKeys, Home, End, Ctrl+A, Ctrl+C, Ctrl+V, etc.
		const isTextControlKey =
			e.key === 'Tab' ||
			e.key === 'Enter' ||
			e.key.startsWith('Arrow') ||
			e.key === 'Home' ||
			e.key === 'End' ||
			e.ctrlKey ||
			e.metaKey;

		if (!isTextControlKey) {
			e.preventDefault();
		}
	}

	function handleChange() {
		// All input is handled via onKeyDown; this prevents React controlled-input warning.
	}

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
		e.preventDefault();
		const digits = e.clipboardData.getData('text').replace(/\D/g, '');
		if (digits) update(rawDigits + digits);
	}

	return (
		<div ref={wrapperRef} className="contents">
			<Input
				value={digitsToDisplay(rawDigits)}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				placeholder={placeholder}
				inputMode="numeric"
				{...props}
			/>
		</div>
	);
});
