'use client';

import { TextField, Label } from '@heroui/react';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { formattedCurrencyToCents } from '@/utils/currency';
import type { PriceTabProps } from './types';

export function PriceTab({ priceInCents, setPriceInCents, disabled }: PriceTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<TextField
				variant="secondary"
				isRequired
				isDisabled={disabled}
				className="[&_input]:text-center [&_input]:text-4xl [&_input]:font-semibold [&_input]:tracking-tight"
			>
				<Label>Preço</Label>
				<CurrencyCentsInput
					initialValueInCents={priceInCents ?? undefined}
					onValueChange={(v) => setPriceInCents(formattedCurrencyToCents(v))}
					placeholder="R$ 0,00"
					variant="secondary"
					className="text-center"
					disabled={disabled}
				/>
			</TextField>
		</div>
	);
}
