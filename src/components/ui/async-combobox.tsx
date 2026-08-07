'use client';

import { ComboBox, ListBox, Input, Label, Spinner, Chip, Button } from '@heroui/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface AsyncComboboxOption {
	key: string;
	label: string;
	description?: string | null;
	endContent?: ReactNode;
}

interface AsyncComboboxProps {
	label: string;
	isRequired?: boolean;
	placeholder: string;
	searchPlaceholder: string;
	searchValue: string;
	selectedValue?: string | null;
	minSearchLength?: number;
	isLoading: boolean;
	options: AsyncComboboxOption[];
	value: string | null;
	emptyMessage?: string;
	isDisabled?: boolean;
	className?: string;
	leadingIcon?: ReactNode;
	optionVariant?: 'card' | 'chip';
	onSearchChange: (value: string) => void;
	onChange: (key: string | null) => void;
}

export function AsyncCombobox({
	label,
	isRequired,
	placeholder,
	searchPlaceholder,
	searchValue,
	selectedValue,
	minSearchLength = 1,
	isLoading,
	options,
	value,
	emptyMessage = 'Nenhum resultado encontrado',
	isDisabled,
	className,
	leadingIcon,
	optionVariant = 'card',
	onSearchChange,
	onChange,
}: AsyncComboboxProps) {
	const skipNextInputChangeRef = useRef(false);
	const emittedSelectionRef = useRef<string | null>(value ?? null);
	const trimmedSearch = searchValue.trim();
	const isSearchReady = trimmedSearch.length >= minSearchLength;
	const hasSelection = !!selectedValue?.trim();
	const inputValue = selectedValue ?? searchValue;

	if (emittedSelectionRef.current !== (value ?? null)) {
		emittedSelectionRef.current = value ?? null;
	}

	function handleClear() {
		if (!value && searchValue === '') return;

		skipNextInputChangeRef.current = true;
		emittedSelectionRef.current = null;

		if (value) {
			onChange(null);
		}

		if (searchValue !== '') {
			onSearchChange('');
		}
	}

	function handleInputChange(inputValue: string) {
		if (skipNextInputChangeRef.current) {
			skipNextInputChangeRef.current = false;
			return;
		}

		if (hasSelection) return;
		if (inputValue === selectedValue) return;
		if (inputValue === searchValue) return;

		onSearchChange(inputValue);
	}

	function handleSelectionChange(key: string | number | null) {
		const normalizedKey = key ? String(key) : null;
		if (normalizedKey === emittedSelectionRef.current) return;

		skipNextInputChangeRef.current = true;
		emittedSelectionRef.current = normalizedKey;
		onChange(normalizedKey);
	}

	function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return;
		if (hasSelection) return;
		if (!isSearchReady) return;
		if (isLoading) return;

		const firstOption = options.at(0);
		if (!firstOption) return;
		if (firstOption.key === emittedSelectionRef.current) return;

		event.preventDefault();
		skipNextInputChangeRef.current = true;
		emittedSelectionRef.current = firstOption.key;
		onChange(firstOption.key);
	}

	return (
		<ComboBox
			className={className ?? 'w-full'}
			inputValue={inputValue}
			onInputChange={handleInputChange}
			selectedKey={value}
			onSelectionChange={handleSelectionChange}
			isDisabled={isDisabled}
			allowsEmptyCollection
		>
			<Label className="mb-1.5 text-sm text-foreground" isRequired={isRequired}>
				{label}
			</Label>
			<ComboBox.InputGroup className="relative">
				{leadingIcon && (
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground">
						{leadingIcon}
					</span>
				)}
				<Input
					variant="secondary"
					placeholder={searchPlaceholder || placeholder}
					className={`${leadingIcon ? 'pl-10 pr-16' : 'pr-16'}`}
					onKeyDown={handleInputKeyDown}
				/>
				{isLoading && !hasSelection && (
					<span className="absolute right-10 top-1/2 -translate-y-1/2">
						<Spinner size="sm" />
					</span>
				)}
				{hasSelection ? (
					<Button
						isIconOnly
						variant="ghost"
						size="sm"
						className="absolute right-2 top-1/2 -translate-y-1/2 size-7 min-w-7"
						onPress={handleClear}
						aria-label="Limpar seleção"
					>
						<Icon icon={Cancel01Icon} className="icon-sm text-muted-foreground" />
					</Button>
				) : (
					<ComboBox.Trigger className="absolute right-3 top-1/2 -translate-y-1/2" />
				)}
			</ComboBox.InputGroup>
			<ComboBox.Popover className="rounded-lg border border-divider p-2 shadow-lg">
				<div className="flex flex-col gap-2">
					{!isSearchReady && !value && (
						<span className="text-xs text-muted-foreground px-2">
							Digite pelo menos {minSearchLength} caractere{minSearchLength > 1 ? 's' : ''}
						</span>
					)}
					{(isSearchReady || value) && (
						<ListBox
							className="max-h-48 overflow-y-auto"
							renderEmptyState={() => (
								<div className="py-3 text-center text-xs text-muted-foreground">{isLoading ? 'Buscando...' : emptyMessage}</div>
							)}
						>
							{options.map((option) => (
								<ListBox.Item
									key={option.key}
									id={option.key}
									textValue={`${option.label}${option.description ? ` ${option.description}` : ''}`}
								>
									{optionVariant === 'chip' ? (
										<div className="flex items-center justify-between gap-3">
											<Chip variant="soft" color="accent" size="sm" className="gap-1">
												{option.label}
											</Chip>
											{option.endContent}
										</div>
									) : (
										<div className="flex items-center justify-between gap-3">
											<div className="flex flex-col">
												<span>{option.label}</span>
												{option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
											</div>
											{option.endContent}
										</div>
									)}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					)}
				</div>
			</ComboBox.Popover>
		</ComboBox>
	);
}
