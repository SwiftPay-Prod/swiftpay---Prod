import type { ReactNode } from 'react';

export type ParseColor = 'default' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger';

export type ChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface TParse {
	label: string;
	color: ParseColor;
	description?: string;
	icon?: ReactNode;
}

export function mapParseColorToChipColor(color: ParseColor): ChipColor {
	if (color === 'secondary') return 'default';
	return color as ChipColor;
}

export function parseToSelectOptions<T extends string>(
	parse: Record<T, TParse>,
	allLabel?: string
): { value: T | 'all'; label: string }[] {
	const options: { value: T | 'all'; label: string }[] = [];

	if (allLabel) {
		options.push({ value: 'all', label: allLabel });
	}

	for (const key of Object.keys(parse) as T[]) {
		options.push({ value: key, label: parse[key].label });
	}

	return options;
}

export interface FilterOption<T extends string> {
	value: T;
	label: string;
	triggerLabel?: string;
	color?: ChipColor;
	icon?: ReactNode;
}

export function parseToFilterOptions<T extends string>(
	parse: Record<T, TParse>,
	allLabel?: string
): FilterOption<T | 'all'>[] {
	const options: FilterOption<T | 'all'>[] = [];

	if (allLabel) {
		options.push({ value: 'all', label: allLabel });
	}

	for (const key of Object.keys(parse) as T[]) {
		options.push({
			value: key,
			label: parse[key].label,
			color: mapParseColorToChipColor(parse[key].color),
			icon: parse[key].icon,
		});
	}

	return options;
}
