'use client';

import { TextField, Label, Input } from '@heroui/react';
import { NumericFormat } from 'react-number-format';
import { currencyNumericProps } from '@/utils/input-masks';
import type { PriceTabProps } from './types';

export function PriceTab({ priceValue, setPriceValue, disabled }: PriceTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<TextField
				isRequired
				isDisabled={disabled}
				variant="secondary"
				className="[&_input]:text-center [&_input]:text-4xl [&_input]:font-semibold [&_input]:tracking-tight"
			>
				<Label>Preço</Label>
				<NumericFormat
					{...currencyNumericProps}
					customInput={Input}
					variant="secondary"
					placeholder="R$ 0,00"
					value={priceValue}
					onValueChange={(values) => setPriceValue(values.floatValue)}
					disabled={disabled}
				/>
			</TextField>
		</div>
	);
}
