'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchField, Label } from '@heroui/react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchFilterProps {
	label?: string;
	placeholder?: string;
	value?: string;
	defaultValue?: string;
	resetKey?: number;
	onChange: (value: string) => void;
	className?: string;
}

export function SearchFilter({
	label = 'Buscar',
	placeholder = 'Buscar...',
	value,
	defaultValue = '',
	resetKey = 0,
	onChange,
	className = 'flex-1',
}: SearchFilterProps) {
	const isControlled = value !== undefined;
	const [valueState, setValueState] = useState(defaultValue);
	const debouncedValue = useDebounce(valueState);
	const lastReportedValue = useRef(defaultValue);
	const resetTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (resetTimeoutRef.current !== null) {
			window.clearTimeout(resetTimeoutRef.current);
		}
		if (isControlled) return;
		resetTimeoutRef.current = window.setTimeout(() => {
			setValueState(defaultValue);
			lastReportedValue.current = defaultValue;
			resetTimeoutRef.current = null;
		}, 350);
	}, [defaultValue, resetKey, isControlled]);

	useEffect(() => {
		if (isControlled) return;
		if (debouncedValue !== lastReportedValue.current) {
			lastReportedValue.current = debouncedValue;
			onChange(debouncedValue);
		}
	}, [debouncedValue, onChange, isControlled]);

	function handleChange(newValue: string) {
		if (isControlled) {
			onChange(newValue);
			return;
		}
		setValueState(newValue);
	}

	function handleClear() {
		if (isControlled) {
			onChange('');
			return;
		}
		setValueState('');
	}

	const resolvedValue = isControlled ? (value ?? '') : valueState;

	return (
		<SearchField variant="secondary" value={resolvedValue} onChange={handleChange} onClear={handleClear} className={className}>
			{label && <Label className="mb-1.5 text-sm text-muted-foreground">{label}</Label>}
			<SearchField.Group>
				<SearchField.SearchIcon />
				<SearchField.Input placeholder={placeholder} />
				<SearchField.ClearButton />
			</SearchField.Group>
		</SearchField>
	);
}

