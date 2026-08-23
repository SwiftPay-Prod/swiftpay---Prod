'use client';

import type { Key } from '@heroui/react';
import { ComboBox, ListBox, Input, Label, Spinner, Chip } from '@heroui/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { ReactNode } from 'react';

export interface AsyncMultiComboboxOption {
	key: string;
	label: string;
	description?: string | null;
	endContent?: ReactNode;
}

interface AsyncMultiComboboxProps {
	label: string;
	placeholder: string;
	searchPlaceholder?: string;
	searchValue: string;
	minSearchLength?: number;
	isLoading: boolean;
	options: AsyncMultiComboboxOption[];
	selectedKeys: string[];
	emptyMessage?: string;
	helpMessage?: string;
	isDisabled?: boolean;
	className?: string;
	leadingIcon?: ReactNode;
	chipColor?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
	chipIcon?: ReactNode;
	onSearchChange: (value: string) => void;
	onSelect: (key: string) => void;
	onRemove: (key: string) => void;
	renderSelectedLabel?: (option: AsyncMultiComboboxOption) => ReactNode;
}

export function AsyncMultiCombobox({
	label,
	placeholder,
	searchPlaceholder,
	searchValue,
	minSearchLength = 1,
	isLoading,
	options,
	selectedKeys,
	emptyMessage = 'Nenhum resultado encontrado',
	helpMessage,
	isDisabled,
	className,
	leadingIcon,
	chipColor = 'accent',
	chipIcon,
	onSearchChange,
	onSelect,
	onRemove,
	renderSelectedLabel,
}: AsyncMultiComboboxProps) {
	const trimmedSearch = searchValue.trim();
	const isSearchReady = trimmedSearch.length >= minSearchLength;

	const filteredOptions = options.filter((opt) => !selectedKeys.includes(opt.key));
	const allSelected = options.length > 0 && filteredOptions.length === 0;

	function handleSelect(key: string | null) {
		if (key) {
			onSelect(key);
		}
	}

	const selectedOptions = options.filter((opt) => selectedKeys.includes(opt.key));

	return (
		<div className={className ?? 'w-full'}>
			<ComboBox
				className="w-full"
				inputValue={searchValue}
				onInputChange={onSearchChange}
				selectedKey={null}
				onSelectionChange={(key: Key | null) => handleSelect(key as string | null)}
				isDisabled={isDisabled}
				allowsEmptyCollection
				menuTrigger="input"
			>
				<Label>{label}</Label>
				<ComboBox.InputGroup className="relative">
					{leadingIcon && (
						<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted">
							{leadingIcon}
						</span>
					)}
					<Input variant="secondary" placeholder={searchPlaceholder || placeholder} className={leadingIcon ? 'pl-10 pr-16' : 'pr-16'} />
					{isLoading && (
						<span className="absolute right-10 top-1/2 -translate-y-1/2">
							<Spinner size="sm" />
						</span>
					)}
					<ComboBox.Trigger className="absolute right-3 top-1/2 -translate-y-1/2" />
				</ComboBox.InputGroup>
				<ComboBox.Popover className="rounded-lg border border-border bg-surface p-2lg">
					<div className="flex flex-col gap-2">
						{!isSearchReady && (
							<span className="text-xs text-muted px-2">Digite pelo menos {minSearchLength} caractere(s)</span>
						)}
						{isSearchReady && (
							<ListBox
								className="max-h-48 overflow-y-auto"
								renderEmptyState={() => (
									<div className="py-3 text-center text-xs text-muted">
										{allSelected ? 'Todos os itens já foram selecionados' : isLoading ? 'Buscando...' : emptyMessage}
									</div>
								)}
							>
								{filteredOptions.map((option) => (
									<ListBox.Item key={option.key} id={option.key} textValue={option.label}>
										<div className="flex items-center justify-between gap-3">
											<div className="flex flex-col">
												<span>{option.label}</span>
												{option.description && <span className="text-xs text-muted">{option.description}</span>}
											</div>
											{option.endContent}
										</div>
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						)}
					</div>
				</ComboBox.Popover>
			</ComboBox>

			{selectedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-2">
					{selectedOptions.map((option) => (
						<div key={option.key} className="flex items-center gap-1">
							<Chip variant="soft" color={chipColor} size="sm" className="gap-1">
								{chipIcon}
								{renderSelectedLabel ? renderSelectedLabel(option) : option.label}
							</Chip>
							<button
								type="button"
								onClick={() => onRemove(option.key)}
								className="p-0.5 rounded-full hover:bg-danger-soft-hover text-muted hover:text-danger transition-colors"
							>
								<Icon icon={CancelCircleIcon} className="icon-xs" />
							</button>
						</div>
					))}
				</div>
			)}

			{helpMessage && selectedKeys.length === 0 && searchValue.length === 0 && (
				<p className="text-sm text-muted mt-1">{helpMessage}</p>
			)}
		</div>
	);
}

