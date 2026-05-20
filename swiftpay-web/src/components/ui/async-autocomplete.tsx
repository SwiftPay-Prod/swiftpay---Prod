'use client';

import { Autocomplete, ListBox, Label, SearchField, Spinner, Chip } from '@heroui/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

export interface AsyncAutocompleteOption {
	key: string;
	label: string;
	description?: string | null;
	startContent?: ReactNode;
	endContent?: ReactNode;
}

interface AsyncAutocompleteProps {
	label: string;
	placeholder: string;
	searchPlaceholder: string;
	searchValue: string;
	minSearchLength?: number;
	isLoading: boolean;
	options: AsyncAutocompleteOption[];
	value: string | null;
	emptyMessage?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	isInvalid?: boolean;
	className?: string;
	optionVariant?: 'card' | 'chip';
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	closeOnSelect?: boolean;
	onSearchChange: (value: string) => void;
	onChange: (key: string | null) => void;
}

export function AsyncAutocomplete({
	label,
	placeholder,
	searchPlaceholder,
	searchValue,
	minSearchLength = 1,
	isLoading,
	options,
	value,
	emptyMessage = 'Nenhum resultado encontrado',
	isDisabled,
	isRequired,
	isInvalid,
	className,
	optionVariant = 'card',
	isOpen,
	onOpenChange,
	closeOnSelect = true,
	onSearchChange,
	onChange,
}: AsyncAutocompleteProps) {
	const trimmedSearch = searchValue.trim();
	const isSearchReady = trimmedSearch.length >= minSearchLength;
	const [internalIsOpen, setInternalIsOpen] = useState(false);
	const open = isOpen ?? internalIsOpen;
	const setOpen = onOpenChange ?? setInternalIsOpen;

	return (
		<Autocomplete
			className={className}
			placeholder={placeholder}
			selectionMode="single"
			value={value ?? null}
			onChange={(v) => {
				onChange((v as string) || null);
				if (closeOnSelect) setOpen(false);
			}}
			isDisabled={isDisabled}
			isInvalid={isInvalid}
			isOpen={open}
			onOpenChange={setOpen}
			variant="secondary"
		>
			<Label isRequired={isRequired}>{label}</Label>
			<Autocomplete.Trigger className="relative" onClick={() => setOpen(true)}>
				<Autocomplete.Value className="text-foreground" />
				<Autocomplete.ClearButton className="text-muted" />
				<Autocomplete.Indicator className="text-muted" />
			</Autocomplete.Trigger>
			<Autocomplete.Popover className={'w-full max-w-md'}>
				<Autocomplete.Filter inputValue={searchValue} onInputChange={onSearchChange}>
					<SearchField autoFocus variant="secondary">
						<SearchField.Group>
							<SearchField.SearchIcon />

							<SearchField.Input
								placeholder={searchPlaceholder || placeholder}
								onKeyDown={(event) => {
									if (event.key === 'Enter') event.preventDefault();
								}}
							/>
							<SearchField.ClearButton />
							{isLoading && (
								<span className="absolute right-10 top-1/2 -translate-y-1/2">
									<Spinner size="sm" />
								</span>
							)}
						</SearchField.Group>
					</SearchField>
					<ListBox
						variant="default"
						className="overflow-y-auto"
						renderEmptyState={() => (
							<div className="py-3 text-center text-xs text-muted">
								{isLoading ? 'Buscando...' : isSearchReady ? emptyMessage : 'Digite pelo menos 1 letra'}
							</div>
						)}
					>
						{options.map((option) => (
							<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
								{optionVariant === 'chip' ? (
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											{option.startContent}
											<Chip variant="soft" color="accent" size="sm" className="gap-1">
												{option.label}
											</Chip>
										</div>
										{option.endContent}
									</div>
								) : (
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											{option.startContent}
											<div className="flex flex-col">
												<span>{option.label}</span>
												{option.description && <span className="text-xs text-muted">{option.description}</span>}
											</div>
										</div>
										{option.endContent}
									</div>
								)}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Autocomplete.Filter>
			</Autocomplete.Popover>
		</Autocomplete>
	);
}
