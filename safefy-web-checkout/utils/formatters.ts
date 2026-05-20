/**
 * Format currency in BRL
 */
export function formatCurrency(valueInCents: number): string {
	return (valueInCents / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

/**
 * Format CPF (000.000.000-00)
 */
export function formatCPF(value: string): string {
	const numbers = value.replace(/\D/g, '').slice(0, 11);
	return numbers
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Format Phone ((00) 00000-0000)
 */
export function formatPhone(value: string): string {
	const numbers = value.replace(/\D/g, '').slice(0, 11);
	return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Format CEP (00000-000)
 */
export function formatCEP(value: string): string {
	const numbers = value.replace(/\D/g, '').slice(0, 8);
	return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/**
 * Format Card Number (0000 0000 0000 0000)
 */
export function formatCardNumber(value: string): string {
	const numbers = value.replace(/\D/g, '').slice(0, 16);
	return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/**
 * Format Card Expiry (MM/YY)
 */
export function formatCardExpiry(value: string): string {
	const numbers = value.replace(/\D/g, '').slice(0, 4);
	return numbers.replace(/(\d{2})(\d{1,2})$/, '$1/$2');
}

/**
 * Installments Generator
 * Generate installment options for credit card
 */
export function generateInstallmentOptions(
	totalAmount: number,
	maxInstallments: number = 12,
	minInstallmentValue: number = 500
): Array<{ value: string; label: string; amount: number }> {
	const options: Array<{ value: string; label: string; amount: number }> = [];

	for (let i = 1; i <= maxInstallments; i++) {
		const installmentValue = totalAmount / i;

		if (installmentValue < minInstallmentValue && i > 1) {
			break;
		}

		const formattedValue = formatCurrency(installmentValue);

		options.push({
			value: String(i),
			label: i === 1 ? `À vista ${formattedValue}` : `${i}x de ${formattedValue} sem juros`,
			amount: installmentValue,
		});
	}

	return options;
}
