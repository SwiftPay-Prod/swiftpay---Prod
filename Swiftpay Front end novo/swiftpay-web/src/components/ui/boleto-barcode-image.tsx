'use client';

import JsBarcode from 'jsbarcode';
import Image from 'next/image';

interface BoletoBarcodeImageProps {
	barcode: string | null;
	digitableLine: string | null;
	className?: string;
}

function getBoletoBarcodePayload(barcode: string | null, digitableLine: string | null): string | null {
	const barcodeDigits = (barcode ?? '').replace(/\D/g, '');
	if (barcodeDigits.length === 44) {
		return barcodeDigits;
	}

	const digitableDigits = (digitableLine ?? '').replace(/\D/g, '');
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

function generateBarcodeDataUrl(value: string): string | null {
	if (typeof document === 'undefined') {
		return null;
	}

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

export function BoletoBarcodeImage({ barcode, digitableLine, className }: BoletoBarcodeImageProps) {
	const payload = getBoletoBarcodePayload(barcode, digitableLine);
	const imageUrl = payload ? generateBarcodeDataUrl(payload) : null;

	if (!imageUrl) {
		return (
			<div className={`rounded-lg border border-dashed border-divider bg-content1 p-4 text-center text-xs text-foreground/60 ${className ?? ''}`}>
				Código de barras indisponível
			</div>
		);
	}

	return (
		<div className={`rounded-lg border border-divider bg-white p-4 ${className ?? ''}`}>
			<Image
				src={imageUrl}
				alt="Código de barras do boleto"
				width={640}
				height={80}
				unoptimized
				className="h-20 w-full object-contain"
			/>
		</div>
	);
}
