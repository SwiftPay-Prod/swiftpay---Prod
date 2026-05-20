export function formatCurrency(valueInCents: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(valueInCents / 100);
}

export function formatCurrencyCompact(valueInCents: number): string {
	const value = valueInCents / 100;
	const abs = Math.abs(value);
	const sign = value < 0 ? '-' : '';

	if (abs >= 1_000_000_000) {
		return `${sign}R$ ${(abs / 1_000_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}B`;
	}
	if (abs >= 1_000_000) {
		return `${sign}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`;
	}
	if (abs >= 1_000) {
		return `${sign}R$ ${(abs / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`;
	}
	return `${sign}R$ ${abs.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function centsToFormattedCurrency(cents: number | null | undefined): string {
	if (cents == null) return '';
	return (cents / 100).toFixed(2).replace('.', ',');
}

export function formattedCurrencyToCents(formatted: string): number | null {
    if (!formatted) return null;
    const cleanValue = formatted.replace(/[^\d.,]/g, '');
    const normalized = cleanValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(normalized);
    if (isNaN(value)) return null;
    return Math.round(value * 100);
}

export function basisPointsToPercentage(basisPoints: number | null | undefined): string {
	if (basisPoints == null) return '';
	return (basisPoints / 100).toFixed(2).replace('.', ',');
}

export function percentageToBasisPoints(percentage: string): number | null {
	if (!percentage) return null;
	const normalized = percentage.replace(',', '.');
	const value = parseFloat(normalized);
	if (isNaN(value)) return null;
	return Math.round(value * 100);
}

export type FeeChargeMode = 'FixedOnly' | 'PercentageOnly' | 'FixedAndPercentage';

export type CouponDiscountType = 'Percentage' | 'FixedAmount';

export interface FormatDiscountInput {
	discountType: CouponDiscountType;
	discountPercentage?: number | null;
	discountFixedAmount?: number | null;
}

export function formatDiscount(input: FormatDiscountInput): string {
	if (input.discountType === 'Percentage' && input.discountPercentage != null) {
		return `${basisPointsToPercentage(input.discountPercentage)}%`;
	}
	if (input.discountType === 'FixedAmount' && input.discountFixedAmount != null) {
		return formatCurrency(input.discountFixedAmount);
	}
	return '-';
}

export function formatFeeRate(
	mode: FeeChargeMode | null | undefined,
	fixedCents: number | null | undefined,
	percentageBps: number | null | undefined
): string {
	if (!mode) return 'Padrão';

	const fixedPart = fixedCents ? formatCurrency(fixedCents) : null;
	const percentPart = percentageBps ? `${(percentageBps / 100).toFixed(2).replace('.', ',')}%` : null;

	switch (mode) {
		case 'FixedOnly':
			return fixedPart ?? 'R$ 0,00';
		case 'PercentageOnly':
			return percentPart ?? '0,00%';
		case 'FixedAndPercentage':
			if (fixedPart && percentPart) {
				return `${fixedPart} + ${percentPart}`;
			}
			return fixedPart ?? percentPart ?? 'R$ 0,00';
		default:
			return 'Padrão';
	}
}

export interface BalanceDisplay {
	formatted: string;
	colorClass: string;
	sign: string;
}

export function getBalanceDisplay(valueInCents: number | null | undefined): BalanceDisplay {
	if (valueInCents == null || isNaN(valueInCents)) {
		return {
			formatted: 'R$ 0,00',
			colorClass: 'text-muted',
			sign: '',
		};
	}

	if (valueInCents === 0) {
		return {
			formatted: 'R$ 0,00',
			colorClass: 'text-muted',
			sign: '',
		};
	}

	const isPositive = valueInCents > 0;

	return {
		formatted: formatCurrency(Math.abs(valueInCents)),
		colorClass: isPositive ? 'text-success' : 'text-danger',
		sign: isPositive ? '+' : '-',
	};
}

