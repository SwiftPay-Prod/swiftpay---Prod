import JsBarcode from 'jsbarcode';
import type { PaymentLinkData } from '@/types/checkout';

export function getBoletoBarcodePayload(paymentLink: PaymentLinkData): string | null {
	const barcodeDigits = (paymentLink.boleto?.barcode ?? '').replace(/\D/g, '');
	if (barcodeDigits.length === 44) {
		return barcodeDigits;
	}

	const digitableDigits = (paymentLink.boleto?.digitableLine ?? '').replace(/\D/g, '');
	if (digitableDigits.length === 47) {
		const bankAndCurrency = digitableDigits.slice(0, 4);
		const checkDigit = digitableDigits.slice(32, 33);
		const dueFactorAndAmount = digitableDigits.slice(33, 47);
		const freeField = `${digitableDigits.slice(4, 9)}${digitableDigits.slice(10, 20)}${digitableDigits.slice(21, 31)}`;
		const reconstructed = `${bankAndCurrency}${checkDigit}${dueFactorAndAmount}${freeField}`;
		if (reconstructed.length === 44) {
			return reconstructed;
		}
	}

	if (barcodeDigits.length >= 8) {
		return barcodeDigits;
	}

	if (digitableDigits.length >= 8) {
		return digitableDigits;
	}

	return null;
}

export function renderBarcodeOnCanvas(canvas: HTMLCanvasElement, value: string): void {
	const isBankSlipPayload = /^\d{44}$/.test(value);
	JsBarcode(canvas, value, {
		format: isBankSlipPayload ? 'ITF' : 'CODE128',
		lineColor: '#000000',
		width: 1.2,
		height: 62,
		displayValue: false,
		margin: 0,
		background: '#ffffff',
	});
}

export function generateBarcodeDataUrl(value: string): string | null {
	try {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const isBankSlipPayload = /^\d{44}$/.test(value);
		JsBarcode(svg, value, {
			format: isBankSlipPayload ? 'ITF' : 'CODE128',
			lineColor: '#000000',
			width: 1.3,
			height: 78,
			displayValue: false,
			margin: 0,
			background: '#ffffff',
		});
		const svgString = new XMLSerializer().serializeToString(svg);
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
	} catch {
		return null;
	}
}
