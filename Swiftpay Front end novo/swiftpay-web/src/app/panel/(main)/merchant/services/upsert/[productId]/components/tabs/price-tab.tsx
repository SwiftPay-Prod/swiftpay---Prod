'use client';

import { TextField, Label } from '@heroui/react';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { formattedCurrencyToCents } from '@/utils/currency';
import type { PriceTabProps } from './types';

export function PriceTab({ price, setPrice, disabled }: PriceTabProps) {
	return (
		<div className="flex flex-col gap-4">
			<TextField
				variant="secondary"
				isRequired
				isDisabled={disabled}
				className="[&_input]:text-center [&_input]:text-4xl [&_input]:font-semibold [&_input]:tracking-tight"
			>
				<Label>Preço</Label>
				<CurrencyCentsInput
					initialValueInCents={price != null ? Math.round(price * 100) : undefined}
					onValueChange={(value) => {
						const cents = formattedCurrencyToCents(value);
						setPrice(cents != null ? cents / 100 : undefined);
					}}
					placeholder="R$ 0,00"
					variant="secondary"
					className="text-center"
					disabled={disabled}
				/>
			</TextField>
		</div>
	);
}
