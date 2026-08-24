'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import { QRCode } from 'react-qrcode-logo';
import { getPaymentLinkSessionStatus, getPaymentLinkStatus } from '@/actions/paymentLink';
import type { PaymentLinkData } from '@/types/checkout';
import { formatCurrency } from '@/utils/formatters';
import { generateBarcodeDataUrl, getBoletoBarcodePayload, renderBarcodeOnCanvas } from '../utils/boleto-print-utils';
import { PrintableBoletoDocument } from './printable-boleto-document';

const TERMINAL_STATUSES: Array<PaymentLinkData['status']> = [
	'Completed',
	'Cancelled',
	'Expired',
	'Failed',
	'Refunded',
	'PartiallyRefunded',
];

interface PaymentLinkViewTemplateProps {
	paymentLink: PaymentLinkData;
	token: string;
	disableStatusPolling?: boolean;
}

interface ExpirationCountdown {
	expiresLabel: string;
	remainingLabel: string;
	hasDeadline: boolean;
	isExpired: boolean;
}

type DisplayMethod = 'Pix' | 'Boleto';

function normalizeText(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim();
	return normalized ? normalized : null;
}

function formatDateTimeOrNull(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
}

function maskDocument(value: string | null | undefined): string | null {
	const normalized = normalizeText(value);
	if (!normalized) {
		return null;
	}

	if (normalized.includes('*') || normalized.includes('•')) {
		return normalized;
	}

	const digits = normalized.replace(/\D/g, '');
	if (digits.length === 11) {
		return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
	}

	if (digits.length === 14) {
		return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`;
	}

	if (digits.length >= 6) {
		return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
	}

	return normalized;
}

function formatDateTime(value: string | null): string {
	if (!value) {
		return 'Nao informado';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return 'Nao informado';
	}

	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
}

function formatCountdown(totalMs: number): string {
	if (totalMs <= 0) {
		return 'Expirado';
	}

	const totalSeconds = Math.floor(totalMs / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) {
		return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
	}

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function computeExpirationCountdown(expiresAt: string | null, nowMs: number = Date.now()): ExpirationCountdown {
	if (!expiresAt) {
		return {
			expiresLabel: 'Nao informado',
			remainingLabel: '--',
			hasDeadline: false,
			isExpired: false,
		};
	}

	const date = new Date(expiresAt);
	if (Number.isNaN(date.getTime())) {
		return {
			expiresLabel: 'Nao informado',
			remainingLabel: '--',
			hasDeadline: false,
			isExpired: false,
		};
	}

	const diff = date.getTime() - nowMs;
	return {
		expiresLabel: formatDateTime(expiresAt),
		remainingLabel: formatCountdown(diff),
		hasDeadline: true,
		isExpired: diff <= 0,
	};
}

function resolveDisplayMethods(paymentLink: PaymentLinkData): DisplayMethod[] {
	const methods: DisplayMethod[] = [];
	const hasBoletoPixHybrid = Boolean(paymentLink.boleto?.pixCopyAndPaste || paymentLink.boleto?.pixQrCode);
	const hasPixPayload = Boolean(paymentLink.pix?.copyAndPaste || paymentLink.pix?.qrCode || hasBoletoPixHybrid);
	const hasBoletoPayload = Boolean(
		paymentLink.boleto?.digitableLine || paymentLink.boleto?.barcode || paymentLink.boleto
	);

	if (hasPixPayload || (paymentLink.method === 'Pix' && paymentLink.enabledMethods.includes('Pix'))) {
		methods.push('Pix');
	}

	if (hasBoletoPayload || (paymentLink.method === 'Boleto' && paymentLink.enabledMethods.includes('Boleto'))) {
		methods.push('Boleto');
	}

	if (methods.length === 0 && (paymentLink.method === 'Pix' || paymentLink.method === 'Boleto')) {
		methods.push(paymentLink.method);
	}

	return methods;
}

function normalizeQrImageSource(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	if (trimmed.startsWith('data:image') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed;
	}

	return `data:image/png;base64,${trimmed}`;
}

function BoletoBarcode({ value }: { value: string | null }) {
	const canvasRef = useCallback(
		(canvas: HTMLCanvasElement | null) => {
			if (!canvas || !value) {
				return;
			}

			try {
				renderBarcodeOnCanvas(canvas, value);
			} catch {
				canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
			}
		},
		[value]
	);

	if (!value) {
		return (
			<div className="rounded-xl border border-(--hero-border) p-3 text-sm hero-text-muted">
				Codigo de barras nao disponivel.
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-(--hero-border) bg-white p-3">
			<canvas ref={canvasRef} className="w-full h-16" />
		</div>
	);
}

function InfoRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
	return (
		<div className="flex items-start justify-between gap-3 py-2 border-b border-(--hero-border) last:border-b-0 last:pb-0 first:pt-0">
			<p className="text-xs hero-text-muted">{label}</p>
			<p className={`text-xs md:text-sm text-right font-semibold hero-text break-all ${valueClassName ?? ''}`}>
				{value}
			</p>
		</div>
	);
}

function methodLabel(method: PaymentLinkData['method']): string {
	if (method === 'Pix') return 'PIX';
	if (method === 'Boleto') return 'Boleto';
	if (method === 'CreditCard') return 'Cartao';
	return 'Nao definido';
}

function statusLabel(status: PaymentLinkData['status']): string {
	if (status === 'Pending') return 'Pendente';
	if (status === 'Processing') return 'Processando';
	if (status === 'Completed') return 'Concluido';
	if (status === 'Cancelled') return 'Cancelado';
	if (status === 'Expired') return 'Expirado';
	if (status === 'Failed') return 'Falhou';
	if (status === 'Refunded') return 'Reembolsado';
	if (status === 'PartiallyRefunded') return 'Reembolso parcial';
	return status;
}

function statusBadgeClass(status: PaymentLinkData['status']): string {
	if (status === 'Completed') return 'bg-green-500/15 text-green-400 border-green-500/40';
	if (status === 'Pending' || status === 'Processing') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40';
	return 'bg-red-500/15 text-red-400 border-red-500/40';
}

export default function PaymentLinkViewTemplate({
	paymentLink,
	token,
	disableStatusPolling = false,
}: PaymentLinkViewTemplateProps) {
	const [status, setStatus] = useState<PaymentLinkData['status']>(paymentLink.status);
	const [copiedField, setCopiedField] = useState<'pix' | 'boleto' | null>(null);
	const [nowMs, setNowMs] = useState<number>(() => Date.now());
	const [preferredMethod, _setPreferredMethod] = useState<DisplayMethod | null>(null);
	const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);

	const availableMethods = useMemo(() => resolveDisplayMethods(paymentLink), [paymentLink]);
	const displayMethod = useMemo<DisplayMethod | null>(() => {
		if (preferredMethod && availableMethods.includes(preferredMethod)) {
			return preferredMethod;
		}

		if (
			(paymentLink.method === 'Pix' || paymentLink.method === 'Boleto') &&
			availableMethods.includes(paymentLink.method)
		) {
			return paymentLink.method;
		}

		return availableMethods[0] ?? null;
	}, [preferredMethod, availableMethods, paymentLink.method]);

	const expirationCountdown = useMemo<ExpirationCountdown>(() => {
		return computeExpirationCountdown(paymentLink.expiresAt, nowMs);
	}, [paymentLink.expiresAt, nowMs]);

	useEffect(() => {
		if (!paymentLink.expiresAt) {
			return;
		}

		const interval = setInterval(() => {
			setNowMs(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, [paymentLink.expiresAt]);

	const selectedMethod = paymentLink.method ?? displayMethod;
	const hasPaymentData = availableMethods.length > 0;
	const feeAmount = selectedMethod ? (paymentLink.feeAmounts?.[selectedMethod] ?? 0) : 0;
	const effectiveAmount = paymentLink.passFeeToCustomer ? paymentLink.amount + feeAmount : paymentLink.amount;
	const effectiveAmountFormatted = formatCurrency(effectiveAmount);
	const hasBoletoPixFallback = Boolean(paymentLink.boleto?.pixCopyAndPaste || paymentLink.boleto?.pixQrCode);
	const hasPixData = availableMethods.includes('Pix') || hasBoletoPixFallback;
	const hasBoletoData = availableMethods.includes('Boleto');
	const _hasBothMethods = hasPixData && hasBoletoData;
	const boletoBarcodeValue = getBoletoBarcodePayload(paymentLink);
	const boletoRecipientName = normalizeText(paymentLink.boleto?.recipientName);
	const boletoRecipientDocument = maskDocument(paymentLink.boleto?.recipientDocument);
	const boletoDueDate = paymentLink.boleto?.dueDate ?? paymentLink.expiresAt;

	useEffect(() => {
		if (disableStatusPolling) return;
		if (!paymentLink.isPaymentStarted) return;
		if (TERMINAL_STATUSES.includes(status)) return;

		const interval = setInterval(async () => {
			const result =
				paymentLink.isUnlimitedLink && paymentLink.paymentId
					? await getPaymentLinkSessionStatus(token, paymentLink.paymentId)
					: await getPaymentLinkStatus(token);

			if (result.status && result.status !== status) {
				setStatus(result.status as PaymentLinkData['status']);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [
		disableStatusPolling,
		paymentLink.isPaymentStarted,
		paymentLink.isUnlimitedLink,
		paymentLink.paymentId,
		status,
		token,
	]);

	const handleCopy = useCallback(async (value: string, field: 'pix' | 'boleto') => {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			const el = document.createElement('textarea');
			el.value = value;
			const body = document.body;
			if (body) {
				body.appendChild(el);
				el.select();
				document.execCommand('copy');
				el.remove();
			}
		}

		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2500);
	}, []);

	const pixCode = normalizeText(paymentLink.pix?.copyAndPaste ?? paymentLink.boleto?.pixCopyAndPaste ?? null);
	const pixQrCode = normalizeQrImageSource(paymentLink.pix?.qrCode ?? paymentLink.boleto?.pixQrCode ?? null);
	const boletoLine = normalizeText(paymentLink.boleto?.digitableLine ?? paymentLink.boleto?.barcode ?? null);
	const boletoPayerName = normalizeText(paymentLink.boleto?.payerName);
	const boletoPayerDocument = maskDocument(paymentLink.boleto?.payerDocument);

	const printableInvoice = useMemo(() => {
		const lineDigitable = normalizeText(boletoLine);
		const barcodeText = normalizeText((boletoBarcodeValue ?? '').replace(/\s+/g, ' '));
		const instructions = normalizeText(paymentLink.description) ? [paymentLink.description!.trim()] : [];
		const documentNumber = normalizeText(paymentLink.paymentId ?? null) ?? normalizeText(paymentLink.id);
		return {
			lineDigitable,
			amountLabel: effectiveAmountFormatted,
			issueDateLabel: formatDateTimeOrNull(paymentLink.createdAt),
			dueDateLabel: formatDateTimeOrNull(boletoDueDate),
			documentNumber,
			beneficiary: boletoRecipientName,
			beneficiaryDocument: boletoRecipientDocument,
			payerName: boletoPayerName,
			payerDocument: boletoPayerDocument,
			instructions,
			barcodeText,
			barcodeDataUrl: boletoBarcodeValue ? generateBarcodeDataUrl(boletoBarcodeValue) : null,
			logoUrl: paymentLink.showSwiftPayBranding ? '/swiftpay-horizontal-light.png' : null,
		};
	}, [
		boletoBarcodeValue,
		boletoDueDate,
		boletoLine,
		boletoPayerDocument,
		boletoPayerName,
		boletoRecipientDocument,
		boletoRecipientName,
		effectiveAmountFormatted,
		paymentLink.createdAt,
		paymentLink.description,
		paymentLink.id,
		paymentLink.paymentId,
		paymentLink.showSwiftPayBranding,
	]);

	useEffect(() => {
		if (!isPrintingInvoice) {
			return;
		}

		document.body.setAttribute('data-printing-boleto', 'true');

		const handleAfterPrint = () => {
			document.body.removeAttribute('data-printing-boleto');
			setIsPrintingInvoice(false);
		};

		const timer = window.setTimeout(() => {
			window.print();
		}, 80);

		window.addEventListener('afterprint', handleAfterPrint);

		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('afterprint', handleAfterPrint);
			document.body.removeAttribute('data-printing-boleto');
		};
	}, [isPrintingInvoice]);

	const handleDownloadInvoice = useCallback(() => {
		setIsPrintingInvoice(true);
	}, []);

	return (
		<>
			<div className="payment-link-main w-full max-w-xl">
				<div className="rounded-3xl p-6 md:p-7 hero-card flex flex-col gap-6">
					{paymentLink.productName && (
						<div className="flex items-center gap-3">
							{paymentLink.productImageUrl && (
								<NextImage
									src={paymentLink.productImageUrl}
									alt={paymentLink.productName}
									width={56}
									height={56}
									className="rounded-lg object-cover shrink-0"
									unoptimized
								/>
							)}
							<div className="min-w-0 flex-1">
								<p className="text-xs hero-text-muted">Produto</p>
								<p className="text-sm font-semibold hero-text truncate">{paymentLink.productName}</p>
							</div>
						</div>
					)}

					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div>
							<p className="text-xs hero-text-muted">Valor</p>
							<p className="text-2xl font-bold hero-text">{effectiveAmountFormatted}</p>
						</div>
						<div className="flex items-center gap-2">
							<span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusBadgeClass(status)}`}>
								{statusLabel(status)}
							</span>
						</div>
					</div>

					<div className="rounded-xl border border-(--hero-border) px-3 py-2.5 text-xs">
						<InfoRow label="Metodo" value={methodLabel(displayMethod ?? selectedMethod)} />
						<InfoRow label="Criado em" value={formatDateTime(paymentLink.createdAt)} />
						<InfoRow label="Vence em" value={expirationCountdown.expiresLabel} />
						<InfoRow
							label="Contagem"
							value={expirationCountdown.hasDeadline ? expirationCountdown.remainingLabel : '--'}
							valueClassName={expirationCountdown.isExpired ? 'text-red-400' : 'text-amber-300'}
						/>
						{paymentLink.paymentId && (
							<InfoRow label="ID da transacao" value={paymentLink.paymentId} valueClassName="text-[11px] md:text-xs" />
						)}
					</div>

					{/* {hasBothMethods && (
						<div className="rounded-xl border border-(--hero-border) p-1 flex items-center gap-1">
							<button
								type="button"
								onClick={() => setPreferredMethod('Pix')}
								className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${displayMethod === 'Pix' ? 'hero-btn-accent text-white' : 'hero-text hover:bg-white/5'} cursor-pointer`}
							>
								Pagar com PIX
							</button>
							<button
								type="button"
								onClick={() => setPreferredMethod('Boleto')}
								className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${displayMethod === 'Boleto' ? 'hero-btn-accent text-white' : 'hero-text hover:bg-white/5'} cursor-pointer`}
							>
								Ver boleto
							</button>
						</div>
					)} */}

					{displayMethod === 'Pix' && hasPixData && (
						<div className="rounded-2xl border border-(--hero-border) p-4 md:p-5 flex flex-col gap-4">
							<p className="text-sm font-semibold hero-text">QRCode PIX</p>
							{pixCode && (
								<div className="self-center rounded-2xl bg-white p-1">
									<QRCode value={pixCode} size={200} qrStyle="fluid" eyeRadius={8} />
								</div>
							)}
							{!pixCode && pixQrCode && (
								<div className="self-center rounded-2xl bg-white p-2">
									<NextImage
										src={pixQrCode}
										alt="QR Code PIX"
										width={208}
										height={208}
										className="h-52 w-52 object-contain"
										unoptimized
									/>
								</div>
							)}
							<div className="rounded-xl border border-(--hero-border) px-3 py-2.5 text-xs">
								<p className="text-xs md:text-sm text-center font-semibold hero-text break-all">
									{pixCode ?? 'Nao disponivel'}
								</p>
								{paymentLink.boleto?.pixExpiresAt && (
									<InfoRow label="Expira em" value={formatDateTime(paymentLink.boleto.pixExpiresAt)} />
								)}
							</div>
							<button
								type="button"
								onClick={() => pixCode && handleCopy(pixCode, 'pix')}
								disabled={!pixCode}
								className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white hero-btn-accent disabled:opacity-50 cursor-pointer"
							>
								{copiedField === 'pix' ? 'Copiado' : 'Copiar codigo PIX'}
							</button>
						</div>
					)}

					{displayMethod === 'Boleto' && hasBoletoData && (
						<div className="rounded-2xl border border-(--hero-border) p-4 md:p-5 flex flex-col gap-4">
							<p className="text-sm font-semibold hero-text">Dados do boleto</p>
							{(boletoRecipientName || boletoRecipientDocument || boletoPayerName || boletoPayerDocument) && (
								<div className="rounded-xl border border-(--hero-border) px-3 py-2.5 text-xs">
									{boletoRecipientName && <InfoRow label="Destinatario" value={boletoRecipientName} />}
									{boletoRecipientDocument && <InfoRow label="Documento" value={boletoRecipientDocument} />}
									{boletoPayerName && <InfoRow label="Pagador" value={boletoPayerName} />}
									{boletoPayerDocument && <InfoRow label="Doc. pagador" value={boletoPayerDocument} />}
								</div>
							)}
							<BoletoBarcode value={boletoBarcodeValue} />
							<div className="rounded-xl border border-(--hero-border) px-3 py-2.5 text-xs">
								<p className="text-xs md:text-sm text-center font-semibold hero-text break-all">
									{boletoLine ?? 'Nao disponivel'}
								</p>
							</div>
							<button
								type="button"
								onClick={() => boletoLine && handleCopy(boletoLine, 'boleto')}
								disabled={!boletoLine}
								className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white hero-btn-accent disabled:opacity-50 cursor-pointer"
							>
								{copiedField === 'boleto' ? 'Copiado' : 'Copiar linha digitavel'}
							</button>
							<button
								type="button"
								onClick={handleDownloadInvoice}
								className="w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold border border-(--hero-border) hero-text hover:opacity-90 disabled:opacity-50 cursor-pointer"
							>
								Baixar fatura
							</button>
						</div>
					)}

					{!hasPaymentData && (
						<div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300">
							Nenhum dado de PIX ou boleto disponivel para visualizacao neste pagamento.
						</div>
					)}
				</div>
			</div>
			<PrintableBoletoDocument
				isVisible={isPrintingInvoice}
				lineDigitable={printableInvoice.lineDigitable}
				amountLabel={printableInvoice.amountLabel}
				issueDateLabel={printableInvoice.issueDateLabel}
				dueDateLabel={printableInvoice.dueDateLabel}
				documentNumber={printableInvoice.documentNumber}
				beneficiary={printableInvoice.beneficiary}
				beneficiaryDocument={printableInvoice.beneficiaryDocument}
				payerName={printableInvoice.payerName}
				payerDocument={printableInvoice.payerDocument}
				instructions={printableInvoice.instructions}
				barcodeText={printableInvoice.barcodeText}
				barcodeDataUrl={printableInvoice.barcodeDataUrl}
				logoUrl={printableInvoice.logoUrl}
			/>
		</>
	);
}
