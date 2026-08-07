'use client';

import { Select, ListBox, Label, Chip } from '@heroui/react';
import type { Key } from '@heroui/react';
import type { ReactNode } from 'react';
import type { ChipColor } from '@/parse/types';

export interface SelectOption {
	id: string;
	label: string;
	description?: string;
	isDisabled?: boolean;
	disabledReason?: string;
	chipColor?: ChipColor;
	icon?: ReactNode;
	chipClassName?: string;
}

interface MultiSelectChipsProps {
	label: string;
	placeholder?: string;
	options: SelectOption[];
	value: Key[];
	onChange: (keys: Key[]) => void;
	className?: string;
	/** Texto para exibir quando itens estão selecionados. Use {count} para o número. */
	selectedText?: string;
}

export function MultiSelectChips({
	label,
	placeholder = 'Selecione...',
	options,
	value,
	onChange,
	className,
	selectedText = '{count} item(ns) selecionado(s)',
}: MultiSelectChipsProps) {
	const selectedOptions = options.filter((opt) => value.includes(opt.id));
	const disabledKeys = options.filter((opt) => opt.isDisabled).map((opt) => opt.id);

	function getSelectedLabel() {
		if (value.length === 0) return placeholder;
		return selectedText.replace('{count}', String(value.length));
	}

	return (
		<div className={className}>
			<Select
				variant="secondary"
				aria-label={label}
				selectionMode="multiple"
				placeholder={placeholder}
				disabledKeys={disabledKeys}
				value={value}
				onChange={(keys) => onChange(keys as Key[])}
			>
				<Label>{label}</Label>
				<Select.Trigger>
					<Select.Value>{getSelectedLabel()}</Select.Value>
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox selectionMode="multiple">
						{options.map((option) => (
							<ListBox.Item key={option.id} id={option.id} textValue={option.label}>
								<div className="flex flex-col gap-0.5">
									{option.chipColor || option.icon || option.chipClassName ? (
										<Chip
											size="sm"
											variant="primary"
											color={option.chipColor}
											className={option.chipClassName}
										>
											{option.icon}
											{option.label}
										</Chip>
									) : (
										<span>{option.label}</span>
									)}
									{(option.description || (option.isDisabled && option.disabledReason)) && (
										<span className="text-xs text-muted">
											{option.description}
											{option.isDisabled && option.disabledReason && ` • ${option.disabledReason}`}
										</span>
									)}
								</div>
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Select.Popover>
			</Select>

			{selectedOptions.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-2">
					{selectedOptions.map((option) => (
						<Chip
							key={option.id}
							variant={option.chipColor || option.icon || option.chipClassName ? 'primary' : 'secondary'}
							size="sm"
							color={option.chipColor}
							className={option.chipClassName}
						>
							{option.icon}
							{option.label}
						</Chip>
					))}
				</div>
			)}
		</div>
	);
}

