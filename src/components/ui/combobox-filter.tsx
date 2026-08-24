'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import { SearchField, Label, ListBox } from '@heroui/react';

interface ComboboxFilterItem {
	value: string;
	label: string;
}

interface ComboboxFilterProps {
	label: string;
	placeholder?: string;
	value: string;
	items: ComboboxFilterItem[];
	onChange: (value: string) => void;
	allLabel?: string;
	allValue?: string;
	className?: string;
	minSearchLength?: number;
}

export function ComboboxFilter({
	label,
	placeholder,
	value,
	items,
	onChange,
	allLabel = 'Todos',
	allValue = 'all',
	className = 'w-full',
	minSearchLength = 1,
}: ComboboxFilterProps) {
	const [inputValue, setInputValue] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const deferredInputValue = useDeferredValue(inputValue);

	const selectedLabel = useMemo(() => {
		if (value === allValue) return '';
		return items.find((item) => item.value === value)?.label ?? '';
	}, [value, allValue, items]);

	const [lastSelectedLabel, setLastSelectedLabel] = useState(selectedLabel);

	if (selectedLabel !== lastSelectedLabel) {
		setLastSelectedLabel(selectedLabel);
		setInputValue(selectedLabel);
	}

	const filteredItems = useMemo(() => {
		if (deferredInputValue.trim().length < minSearchLength) return [];
		const term = deferredInputValue.trim().toLowerCase();
		return items.filter((item) => item.label.toLowerCase().includes(term));
	}, [items, deferredInputValue, minSearchLength]);

	const listItems = useMemo(() => {
		const base = [{ value: allValue, label: allLabel }];
		if (deferredInputValue.trim().length < minSearchLength) return base;
		return [...base, ...filteredItems];
	}, [allValue, allLabel, filteredItems, minSearchLength, deferredInputValue]);

	function handleChange(nextValue: string) {
		setInputValue(nextValue);
		if (!isOpen) setIsOpen(true);
	}

	function handleClear() {
		setInputValue('');
		onChange(allValue);
		setIsOpen(false);
	}

	function handleSelect(valueToSelect: string) {
		const selected = listItems.find((item) => item.value === valueToSelect);
		setInputValue(valueToSelect === allValue ? '' : selected?.label ?? '');
		onChange(valueToSelect);
		setIsOpen(false);
	}

	function handleBlur() {
		setTimeout(() => setIsOpen(false), 120);
	}

	return (
		<div className={`relative ${className}`}>
			<SearchField
				value={inputValue}
				onChange={handleChange}
				onClear={handleClear}
				onFocus={() => setIsOpen(true)}
				onBlur={handleBlur}
				variant="secondary"
			>
				<Label className="mb-1.5 text-sm text-muted">{label}</Label>
				<SearchField.Group>
					<SearchField.SearchIcon />
					<SearchField.Input placeholder={placeholder ?? label} />
					<SearchField.ClearButton />
				</SearchField.Group>
			</SearchField>

			{isOpen && (
				<div className="absolute z-20 mt-2 w-full rounded-xl border border-border  bg-surface">
					<ListBox aria-label={label} onAction={(key) => handleSelect(String(key))}>
						{listItems.map((item) => (
							<ListBox.Item key={item.value} id={item.value} textValue={item.label}>
								{item.label}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
					{filteredItems.length === 0 && deferredInputValue.trim().length >= minSearchLength && (
						<div className="px-3 py-2 text-sm text-muted">Nenhuma categoria encontrada</div>
					)}
					{deferredInputValue.trim().length < minSearchLength && (
						<div className="px-3 py-2 text-sm text-muted">Digite ao menos 1 caractere</div>
					)}
				</div>
			)}
		</div>
	);
}

