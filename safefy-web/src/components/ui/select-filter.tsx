'use client';

import type { ReactNode } from 'react';
import { Select, Label, ListBox, Chip } from '@heroui/react';
import type { ChipColor } from '@/parse/types';
import { mapParseColorToChipColor } from '@/parse';

interface SelectFilterOption<T extends string> {
	value: T;
	label: string;
	triggerLabel?: string;
	color?: ChipColor;
	icon?: ReactNode;
	content?: ReactNode;
	triggerContent?: ReactNode;
}

interface SelectFilterProps<T extends string> {
	label: string;
	placeholder?: string;
	value: T;
	options: SelectFilterOption<T>[];
	onChange: (value: T) => void;
	allLabel?: string;
	allValue?: T;
	className?: string;
	showChips?: boolean;
	isDisabled?: boolean;
}

export function SelectFilter<T extends string>({
	label,
	placeholder,
	value,
	options,
	onChange,
	allLabel = 'Todos',
	allValue = 'all' as T,
	className = 'w-full',
	showChips = true,
	isDisabled = false,
}: SelectFilterProps<T>) {
	const selectedOption = options.find((o) => o.value === value);
	const isAll = value === allValue;

	const renderValue = () => {
		if (isAll) {
			return allLabel;
		}

		if (selectedOption?.triggerContent) {
			return selectedOption.triggerContent;
		}

		if (showChips && selectedOption?.color) {
			return (
				<div className="flex items-center gap-2">
					<Chip variant="soft" color={mapParseColorToChipColor(selectedOption.color)} size="sm" className="gap-1">
						{selectedOption.icon}
						{selectedOption.triggerLabel ?? selectedOption.label}
					</Chip>
				</div>
			);
		}

		return selectedOption?.triggerLabel ?? selectedOption?.label ?? allLabel;
	};

	return (
		<div className={className}>
			<Select
				variant="secondary"
				className="w-full"
				placeholder={placeholder ?? label}
				value={value}
				onChange={(key) => onChange((key || allValue) as T)}
				isDisabled={isDisabled}
			>
				<Label className="mb-1.5 text-sm text-muted">{label}</Label>
				<Select.Trigger>
					<Select.Value>{renderValue()}</Select.Value>
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox>
						{options.map((option) => (
							<ListBox.Item key={option.value} id={option.value} textValue={option.label}>
								{option.content ? (
									option.content
								) : showChips && option.color && option.value !== allValue ? (
									<Chip variant="soft" color={mapParseColorToChipColor(option.color)} size="sm" className="gap-1">
										{option.icon}
										{option.label}
									</Chip>
								) : (
									option.label
								)}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Select.Popover>
			</Select>
		</div>
	);
}

