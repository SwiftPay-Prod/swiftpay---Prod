import { patternFormatter } from 'react-number-format';
import type { NumericFormatProps } from 'react-number-format';
import { formatIncompletePhoneNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

// Formatos de máscara para PatternFormat
export const cpfFormat = '###.###.###-##';
export const cnpjFormat = '##.###.###/####-##';
export const cepFormat = '#####-###';
export const phoneFormat = '(##) #####-####';
export const phoneFixedFormat = '(##) ####-####';

export function getDocumentFormat(documentType: string | null | undefined): string {
	switch (documentType) {
		case 'CPF':
			return cpfFormat;
		case 'CNPJ':
			return cnpjFormat;
		default:
			return cpfFormat;
	}
}

export function getPhoneFormat(value: string | null | undefined): string {
	const digits = (value ?? '').replace(/\D/g, '');
	return digits.length < 10 ? phoneFixedFormat : phoneFormat;
}

export function normalizePhoneToE164(
	value: string | null | undefined,
	defaultCountry: CountryCode = 'BR'
): string | null {
	if (!value) return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	const digits = trimmed.replace(/\D/g, '');
	const directCandidate = trimmed.startsWith('+') ? trimmed : digits;
	const parsed = parsePhoneNumberFromString(directCandidate, defaultCountry);

	if (parsed) {
		return parsed.number;
	}

	if (trimmed.startsWith('+')) {
		return `+${digits}`;
	}

	return digits.length > 0 ? `+${digits}` : null;
}

export function formatDocument(
	value: string | null | undefined,
	documentType?: string | null,
	fallback: string = ''
): string {
	if (!value) return fallback;

	const digits = value.replace(/\D/g, '');

	const type = documentType || (digits.length === 11 ? 'CPF' : digits.length === 14 ? 'CNPJ' : undefined);
	const format = getDocumentFormat(type);

	return patternFormatter(digits, { format });
}

export function maskDocument(document: string | null | undefined): string {
	if (!document) return '';

	const numbers = document.replace(/\D/g, '');

	if (numbers.length === 11) {
		return `${numbers.slice(0, 3)}.•••.•••-${numbers.slice(9, 11)}`;
	}

	if (numbers.length === 14) {
		return `${numbers.slice(0, 2)}.•••.•••/••••-${numbers.slice(12, 14)}`;
	}

	return document;
}

// Função para formatar telefone não formatado
export function formatPhone(value: string | null | undefined, fallback: string = ''): string {
	if (!value) return fallback;

	const trimmed = value.trim();
	const digits = trimmed.replace(/\D/g, '');

	if (trimmed.startsWith('+') || digits.length > 11) {
		const candidate = trimmed.startsWith('+') ? trimmed : `+${digits}`;
		const parsed = parsePhoneNumberFromString(candidate);

		if (parsed) {
			return parsed.formatInternational();
		}

		return formatIncompletePhoneNumber(candidate) || candidate;
	}

	const format = getPhoneFormat(digits);

	return patternFormatter(digits, { format });
}

// Função para formatar CEP não formatado
export function formatCep(value: string | null | undefined): string {
	if (!value) return '';

	const digits = value.replace(/\D/g, '');
	return patternFormatter(digits, { format: cepFormat });
}

export function maskPixKey(value: string | null | undefined, type: string | null | undefined): string {
	if (!value) return '';

	const normalizedType = (type ?? '').toLowerCase();

	if (normalizedType === 'cpf' || normalizedType === 'cnpj') {
		return maskDocument(value);
	}

	if (normalizedType === 'phone') {
		const digits = value.replace(/\D/g, '');
		if (digits.length < 8) return value;
		const formattedPhone = formatPhone(digits, value);
		const dynamicMask = digits.length > 10 ? '(\\d{2}) \\d{5}(\\d{4})' : '(\\d{2}) \\d{4}(\\d{4})';
		return formattedPhone.replace(new RegExp(dynamicMask), '($1) •••••$2');
	}

	if (normalizedType === 'email') {
		const [localPart, domainPart] = value.split('@');
		if (!localPart || !domainPart) return value;
		if (localPart.length <= 2) return `${localPart[0] ?? ''}••@${domainPart}`;
		return `${localPart[0]}•••${localPart[localPart.length - 1]}@${domainPart}`;
	}

	if (normalizedType === 'random') {
		if (value.length <= 12) return `${value.slice(0, 4)}••••${value.slice(-4)}`;
		return `${value.slice(0, 8)}••••${value.slice(-4)}`;
	}

	if (value.length <= 8) {
		return `${value.slice(0, 2)}••••${value.slice(-2)}`;
	}

	return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export const currencyFormatProps: Partial<NumericFormatProps> = {
	thousandSeparator: '.',
	decimalSeparator: ',',
	prefix: 'R$ ',
	decimalScale: 2,
	fixedDecimalScale: true,
	allowNegative: false,
	inputMode: 'decimal',
};

export const currencyNumericProps: Partial<NumericFormatProps> = {
	thousandSeparator: '.',
	decimalSeparator: ',',
	prefix: 'R$ ',
	decimalScale: 2,
	fixedDecimalScale: true,
	allowNegative: false,
	inputMode: 'decimal',
};

export const percentageFormatProps: Partial<NumericFormatProps> = {
	thousandSeparator: '.',
	decimalSeparator: ',',
	suffix: '%',
	decimalScale: 2,
	fixedDecimalScale: true,
	allowNegative: false,
	inputMode: 'decimal',
	isAllowed: (values) => {
		const { floatValue } = values;
		return floatValue === undefined || floatValue <= 100;
	},
};

