'use client';

import { Chip } from '@heroui/react';
import { mapParseColorToChipColor, providerCategoryParse } from '@/parse';
import { ProviderCategory } from '@/types/enums';

interface ProviderCategoryChipProps {
	category: ProviderCategory | null | undefined;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'tertiary' | 'soft';
	className?: string;
}

export function ProviderCategoryChip({
	category,
	size = 'sm',
	variant = 'soft',
	className,
}: ProviderCategoryChipProps) {
	if (!category) return null;

	const parsed = providerCategoryParse[category];
	if (!parsed) return null;

	return (
		<Chip size={size} variant={variant} color={mapParseColorToChipColor(parsed.color)} className={`gap-1 ${className ?? ''}`.trim()}>
			{parsed.icon}
			{parsed.label}
		</Chip>
	);
}
