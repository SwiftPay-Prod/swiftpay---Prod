'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import NextImage from 'next/image';
import { QRCode } from 'react-qrcode-logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPix } from '@fortawesome/free-brands-svg-icons';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { getPaymentLinkSessionStatus, getPaymentLinkStatus, startPaymentLink } from '@/actions/paymentLink';
import type { PaymentLinkData } from '@/types/checkout';
import type { CardBrand, PaymentMethod } from '@/types/enums';
import { formatCardExpiry, formatCardNumber, formatCurrency, generateInstallmentOptions } from '@/utils/formatters';
import { maskPhone } from '@/shared/masks';

type ContentPhase = 'selection' | 'loading' | 'payment';

interface TimeLeft {
	minutes: number;
	seconds: number;
	isExpired: boolean;
}

function useCountdown(expiresAt: string | null): TimeLeft {
	const calculate = useCallback((): TimeLeft => {
		if (!expiresAt) return { minutes: 0, seconds: 0, isExpired: false };
		const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
		const totalSeconds = Math.floor(diff / 1000);
		return {
			minutes: Math.floor(totalSeconds / 60),
			seconds: totalSeconds % 60,
			isExpired: diff <= 0,
		};
	}, [expiresAt]);

	const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculate);

	useEffect(() => {
		if (!expiresAt) return;
		const interval = setInterval(() => setTimeLeft(calculate()), 1000);
		return () => clearInterval(interval);
	}, [expiresAt, calculate]);

	return timeLeft;
}

const TERMINAL_STATUSES = ['Completed', 'Cancelled', 'Expired', 'Failed', 'Refunded', 'PartiallyRefunded'];

function detectCardBrand(number: string): CardBrand {
	const cleanNumber = number.replace(/\D/g, '');
	if (/^4/.test(cleanNumber)) return 'visa';
	if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
	if (/^3[47]/.test(cleanNumber)) return 'amex';
	if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
	if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(cleanNumber)) return 'elo';
	if (/^(606282|3841)/.test(cleanNumber)) return 'hipercard';
	return 'unknown';
}

const CARD_BRAND_LOGOS: Record<CardBrand, string> = {
	visa: 'https://logodownload.org/wp-content/uploads/2016/10/visa-logo-2.png',
	mastercard: 'https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-2.png',
	amex: 'https://logodownload.org/wp-content/uploads/2014/04/amex-american-express-logo-1.png',
	elo: 'https://logodownload.org/wp-content/uploads/2019/06/elo-logo.png',
	hipercard: 'https://logodownload.org/wp-content/uploads/2018/05/hipercard-logo.png',
	discover: 'https://logodownload.org/wp-content/uploads/2016/10/discover-logo-1.png',
	default: '',
	unknown: '',
};

function getPaymentLinkSessionStorageKey(token: string): string {
	return `swiftpay_payment_link_session_${token}`;
}

function readSessionPayment(token: string): PaymentLinkData | null {
	if (typeof window === 'undefined') return null;

	try {
		const raw = window.sessionStorage.getItem(getPaymentLinkSessionStorageKey(token));
		if (!raw) return null;
		return JSON.parse(raw) as PaymentLinkData;
	} catch {
		return null;
	}
}

function writeSessionPayment(token: string, paymentLink: PaymentLinkData): void {
	if (typeof window === 'undefined') return;

	try {
		window.sessionStorage.setItem(getPaymentLinkSessionStorageKey(token), JSON.stringify(paymentLink));
	} catch {
		// ignore session storage write errors
	}
}

function clearSessionPayment(token: string): void {
	if (typeof window === 'undefined') return;

	try {
		window.sessionStorage.removeItem(getPaymentLinkSessionStorageKey(token));
	} catch {
		// ignore session storage remove errors
	}
}

function methodLabel(method: PaymentMethod): string {
	if (method === 'Pix') return 'PIX';
	if (method === 'Boleto') return 'Boleto Bancário';
	return 'Cartão de Crédito';
}

function methodDescription(method: PaymentMethod): string {
	if (method === 'Pix') return 'Pagamento instantâneo via QR Code';
	if (method === 'Boleto') return 'Pague em qualquer banco até o vencimento';
	return 'Pague com cartão em até 12 parcelas';
}

function MethodIcon({ method }: { method: PaymentMethod }) {
	if (method === 'Pix') {
		return <FontAwesomeIcon icon={faPix} style={{ width: 24, height: 24 }} />;
	}
	if (method === 'Boleto') {
		return <FontAwesomeIcon icon={faBarcode} style={{ width: 24, height: 24 }} />;
	}
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
			<line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

function ShieldIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className ?? 'text-white'}
		>
			<path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor" opacity="0.2" />
			<path
				d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
			/>
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function CheckCircleIcon() {
	return (
		<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="10" fill="#494fdf" opacity="0.15" />
			<circle cx="12" cy="12" r="10" stroke="#494fdf" strokeWidth="1.5" />
			<path d="M8 12l3 3 5-5" stroke="#494fdf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function statusText(status: PaymentLinkData['status']): string {
	if (status === 'Completed') return 'Pagamento confirmado com sucesso!';
	if (status === 'Cancelled') return 'Pagamento cancelado.';
	if (status === 'Expired') return 'Pagamento expirado.';
	if (status === 'Failed') return 'Pagamento falhou.';
	if (status === 'Refunded') return 'Pagamento reembolsado.';
	if (status === 'PartiallyRefunded') return 'Pagamento parcialmente reembolsado.';
	return 'Aguardando pagamento.';
}

function statusIcon(status: PaymentLinkData['status']): string {
	if (status === 'Completed') return '✓';
	if (status === 'Cancelled' || status === 'Failed') return '✕';
	if (status === 'Expired') return '⏱';
	if (status === 'Refunded' || status === 'PartiallyRefunded') return '↩';
	return '⏳';
}

function BuyerInfoForm({
	requiredFields,
	buyerName,
	buyerEmail,
	buyerPhone,
	onNameChange,
	onEmailChange,
	onPhoneChange,
}: {
	requiredFields: string[];
	buyerName: string;
	buyerEmail: string;
	buyerPhone: string;
	onNameChange: (v: string) => void;
	onEmailChange: (v: string) => void;
	onPhoneChange: (v: string) => void;
}) {
	const requiresName = requiredFields.includes('Name');
	const requiresEmail = requiredFields.includes('Email');
	const requiresPhone = requiredFields.includes('Phone');

	return (
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-semibold text-white">Seus dados</h3>
			{requiresName && (
				<div>
					<label className="text-xs text-white/60 mb-1 block">
						Nome completo <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						value={buyerName}
						onChange={(e) => onNameChange(e.target.value)}
						placeholder="Digite seu nome"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
				</div>
			)}
			{requiresEmail && (
				<div>
					<label className="text-xs text-white/60 mb-1 block">
						E-mail <span className="text-red-400">*</span>
					</label>
					<input
						type="email"
						value={buyerEmail}
						onChange={(e) => onEmailChange(e.target.value)}
						placeholder="seu@email.com"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
				</div>
			)}
			{requiresPhone && (
				<div>
					<label className="text-xs text-white/60 mb-1 block">
						Telefone <span className="text-red-400">*</span>
					</label>
					<input
						type="tel"
						value={maskPhone(buyerPhone)}
						onChange={(e) => onPhoneChange(maskPhone(e.target.value))}
						placeholder="(00) 00000-0000"
						inputMode="numeric"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
				</div>
			)}
		</div>
	);
}

function CreditCardForm({
	amount,
	cardNumber,
	cardHolderName,
	cardExpiry,
	cardCvv,
	installments,
	onCardNumberChange,
	onCardHolderNameChange,
	onCardExpiryChange,
	onCardCvvChange,
	onInstallmentsChange,
}: {
	amount: number;
	cardNumber: string;
	cardHolderName: string;
	cardExpiry: string;
	cardCvv: string;
	installments: string;
	onCardNumberChange: (v: string) => void;
	onCardHolderNameChange: (v: string) => void;
	onCardExpiryChange: (v: string) => void;
	onCardCvvChange: (v: string) => void;
	onInstallmentsChange: (v: string) => void;
}) {
	const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
	const installmentOptions = useMemo(() => generateInstallmentOptions(amount, 12, 100), [amount]);

	return (
		<div className="flex flex-col gap-3">
			<h3 className="text-sm font-semibold text-white">Dados do cartão</h3>
			<div>
				<label className="text-xs text-white/60 mb-1 block">
					Número do cartão <span className="text-red-400">*</span>
				</label>
				<div className="relative">
					<input
						type="text"
						value={formatCardNumber(cardNumber)}
						onChange={(e) => onCardNumberChange(e.target.value)}
						placeholder="0000 0000 0000 0000"
						inputMode="numeric"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
					{cardBrand !== 'unknown' && cardBrand !== 'default' && CARD_BRAND_LOGOS[cardBrand] && (
						<NextImage
							src={CARD_BRAND_LOGOS[cardBrand]}
							alt={cardBrand}
							width={52}
							height={20}
							className="absolute right-3 top-1/2 h-5 w-auto -translate-y-1/2 object-contain"
							unoptimized
						/>
					)}
				</div>
			</div>

			<div>
				<label className="text-xs text-white/60 mb-1 block">
					Nome impresso no cartão <span className="text-red-400">*</span>
				</label>
				<input
					type="text"
					value={cardHolderName}
					onChange={(e) => onCardHolderNameChange(e.target.value)}
					placeholder="Nome como no cartão"
					className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
				/>
			</div>

			<div className="grid grid-cols-3 gap-2">
				<div className="col-span-1">
					<label className="text-xs text-white/60 mb-1 block">
						Validade <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						value={formatCardExpiry(cardExpiry)}
						onChange={(e) => onCardExpiryChange(e.target.value)}
						placeholder="MM/AA"
						inputMode="numeric"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
				</div>
				<div className="col-span-1">
					<label className="text-xs text-white/60 mb-1 block">
						CVV <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						value={cardCvv.replace(/\D/g, '').slice(0, 4)}
						onChange={(e) => onCardCvvChange(e.target.value)}
						placeholder="000"
						inputMode="numeric"
						className="w-full px-4 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					/>
				</div>
				<div className="col-span-1">
					<label className="text-xs text-white/60 mb-1 block">
						Parcelas <span className="text-red-400">*</span>
					</label>
					<select
						value={installments}
						onChange={(e) => onInstallmentsChange(e.target.value)}
						className="w-full px-3 py-2.5 rounded-[12px] border text-sm bg-[#0a0a0a] border-white/12 text-white placeholder:text-white/40 focus:border-[#494fdf] outline-none transition-colors"
					>
						<option value="">Selecionar</option>
						{installmentOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}

function FeeInfoSection({
	amount,
	enabledMethods,
	feeAmounts,
	passFeeToCustomer,
	selectedMethod,
}: {
	amount: number;
	enabledMethods: PaymentMethod[];
	feeAmounts: Record<string, number>;
	passFeeToCustomer: boolean;
	selectedMethod: PaymentMethod | null;
}) {
	if (passFeeToCustomer) {
		const methodsToShow = selectedMethod ? [selectedMethod] : enabledMethods;
		return (
			<div className="rounded-xl bg-[#16181a] border border-white/12 p-4 flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<ShieldIcon className="text-white" />
					<span className="text-xs font-semibold text-white">Resumo do pagamento</span>
				</div>
				<div className="flex flex-col gap-3">
					{methodsToShow.map((method) => {
						const fee = feeAmounts[method] ?? 0;
						const total = amount + fee;
						return (
							<div key={method} className="flex flex-col gap-1">
								{!selectedMethod && <p className="text-xs font-medium text-white">{methodLabel(method)}</p>}
								<div className="flex justify-between items-center text-xs">
									<span className="text-white/60">Valor base</span>
									<span className="font-mono tabular-nums text-white">{formatCurrency(amount)}</span>
								</div>
								<div className="flex justify-between items-center text-xs">
									<span className="text-white/60">Taxa de processamento</span>
									<span className="font-mono tabular-nums text-white">+ {formatCurrency(fee)}</span>
								</div>
								<div className="flex justify-between items-center text-xs pt-1 border-t border-white/12">
									<span className="font-semibold text-white">Total a pagar</span>
									<span className="font-mono tabular-nums font-bold text-white">{formatCurrency(total)}</span>
								</div>
							</div>
						);
					})}
				</div>
				<p className="text-xs text-white/40">A taxa de processamento está incluída no valor total cobrado.</p>
			</div>
		);
	}

	const methodFeeHints: Partial<Record<PaymentMethod, string>> = {
		Pix: 'Liquidação instantânea',
		Boleto: 'Processamento em até 3 dias úteis',
		CreditCard: 'Parcelamento disponível',
	};

	return (
		<div className="rounded-xl bg-[#16181a] border border-white/12 p-4 flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<ShieldIcon className="text-white" />
				<span className="text-xs font-semibold text-white">Resumo do pagamento</span>
			</div>
			<div className="flex flex-col gap-2">
				{enabledMethods.map((method) => {
					const fee = feeAmounts[method] ?? 0;
					return (
						<div key={method} className="flex flex-col gap-0.5">
							<div className="flex justify-between items-center text-xs">
								<span className="text-white/60">{methodFeeHints[method] ?? method}</span>
								<span className="font-semibold text-white">{formatCurrency(amount)}</span>
							</div>
							{fee > 0 && (
								<div className="flex justify-between items-center text-xs">
									<span className="text-white/40">Taxa inclusa</span>
									<span className="text-white/40">{formatCurrency(fee)}</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
			<div className="pt-1 border-t border-white/12 flex justify-between items-center">
				<span className="text-xs font-semibold text-white">Total a pagar</span>
				<span className="font-mono tabular-nums font-bold text-white">{formatCurrency(amount)}</span>
			</div>
			<p className="text-xs text-white/40">As taxas de processamento estão inclusas no valor total.</p>
		</div>
	);
}

function PixView({
	paymentLink,
	formattedAmount,
	countdown,
	copied,
	onCopy,
	onGenerateNewTransaction,
	onBackToStart,
	isGeneratingNewTransaction,
}: {
	paymentLink: PaymentLinkData;
	formattedAmount: string;
	countdown: TimeLeft;
	copied: boolean;
	onCopy: (text: string) => void;
	onGenerateNewTransaction: () => void;
	onBackToStart: () => void;
	isGeneratingNewTransaction: boolean;
}) {
	const pixCode = paymentLink.pix?.copyAndPaste ?? '';
	const amountLabel = paymentLink.description?.trim() || 'Valor a pagar';

	return (
		<div className="flex flex-col items-center">
			<div className="w-full mb-4 px-4 py-3 rounded-xl bg-[#16181a] border border-white/12 flex justify-between items-center">
				<span className="text-sm text-white/60">{amountLabel}</span>
				<span className="font-mono tabular-nums font-bold text-lg text-white">{formattedAmount}</span>
			</div>

			<div className="bg-white p-4 rounded-[16px] mb-4 shadow-sm">
				{pixCode ? (
					<QRCode
						value={pixCode}
						size={200}
						qrStyle="fluid"
						eyeRadius={8}
						fgColor="#1a1a1a"
						bgColor="#ffffff"
						quietZone={8}
					/>
				) : (
					<div className="w-50 h-50 bg-gray-100 flex items-center justify-center rounded-xl">
						<span className="text-gray-400 text-sm">Indisponível</span>
					</div>
				)}
			</div>

			{(countdown.isExpired || paymentLink.pix?.expiresAt) && (
				<div className="mb-4 px-4 py-2 rounded-xl inline-flex items-center gap-2 bg-[#16181a] border border-white/12">
					{countdown.isExpired ? (
						<span className="text-sm text-red-400 font-medium">Código expirado</span>
					) : (
						<span className="text-sm text-white/60">
							Expira em{' '}
							<span className="font-mono font-bold">
								{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
							</span>
						</span>
					)}
				</div>
			)}

			{pixCode && (
				<div className="w-full mb-4">
					<p className="text-xs mb-2 text-white/60">Código PIX Copia e Cola:</p>
					<div className="p-3 rounded-xl text-xs font-mono break-all bg-[#0a0a0a] border border-white/8 text-white/70 select-all cursor-text">
						{pixCode.length > 80 ? `${pixCode.slice(0, 80)}...` : pixCode}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => onCopy(pixCode)}
				disabled={countdown.isExpired || !pixCode}
				className={`w-full py-3 rounded-[12px] font-semibold text-white transition-all flex items-center justify-center gap-2 ${
					countdown.isExpired || !pixCode ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-[#494fdf] hover:bg-[#4f55f1] text-white cursor-pointer'
				}`}
			>
				{copied ? (
					<>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
							<path
								d="M5 13l4 4L19 7"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						Código copiado!
					</>
				) : (
					<>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
							<rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
							<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
						</svg>
						Copiar código PIX
					</>
				)}
			</button>

			{countdown.isExpired && (
				<div className="w-full mt-3 flex flex-col gap-2">
					<button
						type="button"
						onClick={onGenerateNewTransaction}
						disabled={isGeneratingNewTransaction}
						className={`w-full py-3 rounded-[12px] font-semibold text-white transition-all ${
							isGeneratingNewTransaction
								? 'bg-white/10 text-white/40 cursor-not-allowed'
								: 'bg-[#494fdf] hover:bg-[#4f55f1] text-white cursor-pointer'
						}`}
					>
						{isGeneratingNewTransaction ? 'Gerando nova transação...' : 'Gerar nova transação'}
					</button>
					<button
						type="button"
						onClick={onBackToStart}
						className="w-full py-3 rounded-[12px] font-medium text-center transition-colors cursor-pointer bg-white/10 hover:bg-white/[0.15] text-white border border-white/12"
					>
						Voltar ao início
					</button>
				</div>
			)}
		</div>
	);
}

function BoletoView({
	paymentLink,
	formattedAmount,
	copied,
	onCopy,
}: {
	paymentLink: PaymentLinkData;
	formattedAmount: string;
	copied: boolean;
	onCopy: (text: string) => void;
}) {
	const boleto = paymentLink.boleto;
	const digitableLine = boleto?.digitableLine ?? '';
	const amountLabel = paymentLink.description?.trim() || 'Valor a pagar';
	const dueDate = boleto?.dueDate
		? new Date(boleto.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
		: null;

	return (
		<div className="flex flex-col">
			<div className="w-full mb-4 px-4 py-3 rounded-xl bg-[#16181a] border border-white/12 flex justify-between items-center">
				<span className="text-sm text-white/60">{amountLabel}</span>
				<span className="font-mono tabular-nums font-bold text-lg text-white">{formattedAmount}</span>
			</div>

			{dueDate && (
				<div className="mb-4 px-4 py-2 rounded-xl inline-flex items-center gap-2 bg-[#16181a] border border-white/12">
					<span className="text-sm text-white/60">
						Vencimento: <span className="font-semibold">{dueDate}</span>
					</span>
				</div>
			)}

			{digitableLine && (
				<div className="mb-4">
					<p className="text-xs mb-2 text-white/60">Linha digitável:</p>
					<div className="p-3 rounded-xl text-xs font-mono break-all bg-[#0a0a0a] border border-white/8 text-white/70 select-all cursor-text">
						{digitableLine}
					</div>
				</div>
			)}

			{digitableLine && (
				<button
					type="button"
					onClick={() => onCopy(digitableLine)}
					className="w-full py-3 mb-3 rounded-[12px] font-semibold text-white transition-all cursor-pointer bg-[#494fdf] hover:bg-[#4f55f1] text-white"
				>
					{copied ? 'Código copiado!' : 'Copiar código do boleto'}
				</button>
			)}

			{boleto?.pdfUrl && (
				<a
					href={boleto.pdfUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="w-full py-3 rounded-[12px] font-medium text-center transition-colors cursor-pointer bg-white/10 hover:bg-white/[0.15] text-white border border-white/12"
				>
					Baixar boleto PDF
				</a>
			)}
		</div>
	);
}

function CompletedView({
	formattedAmount,
	description,
	redirectUrl,
}: {
	formattedAmount: string;
	description: string | null;
	redirectUrl: string | null;
}) {
	useEffect(() => {
		if (!redirectUrl) return;
		const timeout = setTimeout(() => {
			window.location.href = redirectUrl;
		}, 5000);
		return () => clearTimeout(timeout);
	}, [redirectUrl]);

	return (
		<div className="flex flex-col items-center text-center py-4">
			<CheckCircleIcon />
			<h3 className="mt-4 text-xl font-bold text-white">Pagamento confirmado!</h3>
			<p className="mt-2 text-sm text-white/60">
				Seu pagamento de <span className="font-semibold text-white">{formattedAmount}</span>
				{description ? (
					<>
						{' '}
						para <span className="font-semibold text-white">{description}</span>
					</>
				) : null}{' '}
				foi confirmado com sucesso.
			</p>
			{redirectUrl && (
				<>
					<p className="mt-4 text-xs text-white/40">Você será redirecionado automaticamente em instantes...</p>
					<a
						href={redirectUrl}
						className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 bg-[#494fdf] hover:bg-[#4f55f1] text-white"
					>
						Continuar
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<path
								d="M5 12h14M12 5l7 7-7 7"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</a>
				</>
			)}
		</div>
	);
}

interface PaymentLinkClientProps {
	paymentLink: PaymentLinkData;
	token: string;
}

function ProductHeader({ productName, productImageUrl, description }: {
	productName: string | null;
	productImageUrl: string | null;
	description?: string | null;
}) {
	if (!productName) return null;
	return (
		<div className="px-6 pt-6 pb-0 flex items-center gap-3">
			{productImageUrl && (
				<NextImage
					src={productImageUrl}
					alt={productName}
					width={48}
					height={48}
					unoptimized
					className="rounded-lg object-cover shrink-0"
				/>
			)}
			<div className="flex flex-col min-w-0 flex-1">
				<span className="text-xs text-white/60">Produto</span>
				<span className="text-sm font-semibold text-white truncate">{productName}</span>
				{description && <span className="text-xs text-white/40 mt-0.5 truncate">{description}</span>}
			</div>
		</div>
	);
}

export function PaymentLinkClient({ paymentLink, token }: PaymentLinkClientProps) {
	const [currentPaymentLink, setCurrentPaymentLink] = useState<PaymentLinkData>(() => {
		if (!paymentLink.isUnlimitedLink) {
			return paymentLink;
		}

		return readSessionPayment(token) ?? paymentLink;
	});
	const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(() => {
		if (currentPaymentLink.isPaymentStarted && currentPaymentLink.method) {
			return currentPaymentLink.method;
		}
		return currentPaymentLink.enabledMethods[0] ?? null;
	});
	const [status, setStatus] = useState(currentPaymentLink.status);
	const [copied, setCopied] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const [isGeneratingNewTransaction, setIsGeneratingNewTransaction] = useState(false);
	const [contentPhase, setContentPhase] = useState<ContentPhase>(
		currentPaymentLink.isPaymentStarted ? 'payment' : 'selection'
	);

	const [buyerName, setBuyerName] = useState('');
	const [buyerEmail, setBuyerEmail] = useState('');
	const [buyerPhone, setBuyerPhone] = useState('');
	const [cardNumber, setCardNumber] = useState('');
	const [cardHolderName, setCardHolderName] = useState('');
	const [cardExpiry, setCardExpiry] = useState('');
	const [cardCvv, setCardCvv] = useState('');
	const [installments, setInstallments] = useState('');

	const pixExpiresAt = currentPaymentLink.method === 'Pix' ? (currentPaymentLink.pix?.expiresAt ?? null) : null;
	const countdown = useCountdown(pixExpiresAt);

	const requiredFields = useMemo(
		() => currentPaymentLink.requiredBuyerFields ?? [],
		[currentPaymentLink.requiredBuyerFields]
	);
	const hasRequiredFields = requiredFields.length > 0;
	const formattedAmount = formatCurrency(currentPaymentLink.amount);
	const effectiveAmount =
		currentPaymentLink.passFeeToCustomer && selectedMethod
			? currentPaymentLink.amount + ((currentPaymentLink.feeAmounts ?? {})[selectedMethod] ?? 0)
			: currentPaymentLink.amount;
	const effectiveFormattedAmount =
		currentPaymentLink.passFeeToCustomer && selectedMethod ? formatCurrency(effectiveAmount) : formattedAmount;
	const isTerminalStatus = TERMINAL_STATUSES.includes(status);
	const isUnlimitedLink = currentPaymentLink.isUnlimitedLink;

	useEffect(() => {
		if (!currentPaymentLink.isPaymentStarted) return;
		if (TERMINAL_STATUSES.includes(status)) return;

		const interval = setInterval(async () => {
			const result = currentPaymentLink.isUnlimitedLink && currentPaymentLink.paymentId
				? await getPaymentLinkSessionStatus(token, currentPaymentLink.paymentId)
				: await getPaymentLinkStatus(token);

			if (result.status && result.status !== status) {
				setStatus(result.status as PaymentLinkData['status']);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [token, status, currentPaymentLink.isPaymentStarted, currentPaymentLink.isUnlimitedLink, currentPaymentLink.paymentId]);

	useEffect(() => {
		if (!currentPaymentLink.isUnlimitedLink) {
			return;
		}

		if (currentPaymentLink.isPaymentStarted) {
			writeSessionPayment(token, currentPaymentLink);
			return;
		}

		clearSessionPayment(token);
	}, [token, currentPaymentLink]);

	const handleCopy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const el = document.createElement('textarea');
			el.value = text;
			const body = document.body;
			if (body) {
				body.appendChild(el);
				el.select();
				document.execCommand('copy');
				el.remove();
			}
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 3000);
	}, []);

	const validateBuyerFields = useCallback((): string | null => {
		if (requiredFields.includes('Name') && !buyerName.trim()) {
			return 'Preencha o campo Nome.';
		}
		if (requiredFields.includes('Email') && !buyerEmail.trim()) {
			return 'Preencha o campo E-mail.';
		}
		if (
			requiredFields.includes('Email') &&
			buyerEmail.trim() &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())
		) {
			return 'Informe um e-mail válido.';
		}
		if (requiredFields.includes('Phone') && !buyerPhone.trim()) {
			return 'Preencha o campo Telefone.';
		}
		return null;
	}, [requiredFields, buyerName, buyerEmail, buyerPhone]);

	const validateCreditCardFields = useCallback((): string | null => {
		const numberDigits = cardNumber.replace(/\D/g, '');
		const cvvDigits = cardCvv.replace(/\D/g, '');

		if (!numberDigits || numberDigits.length < 13) {
			return 'Informe um número de cartão válido.';
		}

		if (!cardHolderName.trim()) {
			return 'Informe o nome impresso no cartão.';
		}

		if (!/^\d{2}\/\d{2}$/.test(formatCardExpiry(cardExpiry))) {
			return 'Informe a validade no formato MM/AA.';
		}

		const [monthText, yearText] = formatCardExpiry(cardExpiry).split('/');
		const month = Number(monthText);
		const year = Number(yearText);

		if (!month || month < 1 || month > 12) {
			return 'Informe um mês de validade válido.';
		}

		const now = new Date();
		const fullYear = 2000 + year;
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();
		if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
			return 'Cartão vencido. Informe uma validade futura.';
		}

		if (!cvvDigits || cvvDigits.length < 3 || cvvDigits.length > 4) {
			return 'Informe um CVV válido.';
		}

		if (!installments || Number(installments) < 1 || Number(installments) > 12) {
			return 'Selecione a quantidade de parcelas.';
		}

		return null;
	}, [cardNumber, cardHolderName, cardExpiry, cardCvv, installments]);

	const handleStartPayment = useCallback(async () => {
		if (!selectedMethod) {
			setStartError('Selecione um método para continuar.');
			return;
		}

		if (!currentPaymentLink.enabledMethods.includes(selectedMethod)) {
			setStartError('Este método não está disponível para este link.');
			return;
		}

		if (currentPaymentLink.isPaymentStarted && !(isUnlimitedLink && isTerminalStatus)) return;

		const validationError = validateBuyerFields();
		if (validationError) {
			setStartError(validationError);
			return;
		}

		if (selectedMethod === 'CreditCard') {
			const cardValidationError = validateCreditCardFields();
			if (cardValidationError) {
				setStartError(cardValidationError);
				return;
			}
		}

		setStartError(null);
		setContentPhase('loading');

		const result = await startPaymentLink(token, {
			method: selectedMethod,
			buyerName: buyerName.trim() || undefined,
			buyerEmail: buyerEmail.trim() || undefined,
			buyerPhone: buyerPhone ? buyerPhone.replace(/\D/g, '') || undefined : undefined,
			cardNumber: selectedMethod === 'CreditCard' ? cardNumber.replace(/\D/g, '') : undefined,
			cardHolderName: selectedMethod === 'CreditCard' ? cardHolderName.trim() : undefined,
			cardExpirationMonth: selectedMethod === 'CreditCard' ? Number(formatCardExpiry(cardExpiry).split('/')[0]) : undefined,
			cardExpirationYear: selectedMethod === 'CreditCard' ? Number(formatCardExpiry(cardExpiry).split('/')[1]) : undefined,
			installments: selectedMethod === 'CreditCard' ? Number(installments) : undefined,
			cardCvv: selectedMethod === 'CreditCard' ? cardCvv.replace(/\D/g, '') : undefined,
		});

		if (result.error || !result.paymentLink) {
			setStartError(result.error ?? 'Não foi possível iniciar o pagamento.');
			setContentPhase('selection');
			return;
		}

		setCurrentPaymentLink(result.paymentLink);
		setStatus(result.paymentLink.status);
		setTimeout(() => setContentPhase('payment'), 50);
	}, [
		selectedMethod,
		token,
		currentPaymentLink.enabledMethods,
		currentPaymentLink.isPaymentStarted,
		isUnlimitedLink,
		isTerminalStatus,
		validateBuyerFields,
		validateCreditCardFields,
		buyerName,
		buyerEmail,
		buyerPhone,
		cardNumber,
		cardHolderName,
		cardExpiry,
		cardCvv,
		installments,
	]);

	const handleNewCharge = useCallback(() => {
		setStartError(null);
		setCopied(false);
		setStatus('Pending');
		setIsGeneratingNewTransaction(false);
		setCardNumber('');
		setCardHolderName('');
		setCardExpiry('');
		setCardCvv('');
		setInstallments('');
		clearSessionPayment(token);
		setContentPhase('selection');
		setSelectedMethod((prev) => prev ?? currentPaymentLink.enabledMethods[0] ?? null);
		setCurrentPaymentLink((prev) => ({
			...prev,
			paymentId: null,
			method: null,
			status: 'Pending',
			expiresAt: null,
			completedAt: null,
			isPaymentStarted: false,
			pix: null,
			boleto: null,
		}));
	}, [currentPaymentLink.enabledMethods, token]);

	const handleGenerateNewTransaction = useCallback(async () => {
		if (isGeneratingNewTransaction || currentPaymentLink.method !== 'Pix') {
			return;
		}

		setStartError(null);
		setCopied(false);
		setIsGeneratingNewTransaction(true);

		const result = await startPaymentLink(token, {
			method: 'Pix',
			buyerName: buyerName.trim() || undefined,
			buyerEmail: buyerEmail.trim() || undefined,
			buyerPhone: buyerPhone ? buyerPhone.replace(/\D/g, '') || undefined : undefined,
		});

		if (result.error || !result.paymentLink) {
			setStartError(result.error ?? 'Não foi possível gerar uma nova transação.');
			setIsGeneratingNewTransaction(false);
			return;
		}

		setCurrentPaymentLink(result.paymentLink);
		setStatus(result.paymentLink.status);
		setContentPhase('payment');
		setIsGeneratingNewTransaction(false);
	}, [
		isGeneratingNewTransaction,
		currentPaymentLink.method,
		token,
		buyerName,
		buyerEmail,
		buyerPhone,
	]);

	const canSubmitPayment =
		!!selectedMethod &&
		currentPaymentLink.enabledMethods.includes(selectedMethod) &&
		contentPhase === 'selection' &&
		!currentPaymentLink.isPaymentStarted &&
		!isTerminalStatus;

	if (status === 'Completed' && !isUnlimitedLink) {
		return (
			<>
				<div className="max-w-lg w-full mx-auto">
					<div className="bg-[#16181a] border border-white/12 rounded-[20px] p-8">
						<CompletedView
							formattedAmount={formattedAmount}
							description={currentPaymentLink.description}
							redirectUrl={currentPaymentLink.redirectUrl}
						/>
					</div>
				</div>
			</>
		);
	}

	if (isTerminalStatus && !isUnlimitedLink) {
		return (
			<>
				<div className="max-w-lg w-full mx-auto">
					<div className="bg-[#16181a] border border-white/12 rounded-[20px] p-8 text-center">
						<div className="text-4xl mb-4">{statusIcon(status)}</div>
						<h3 className="text-xl font-bold text-white">{statusText(status)}</h3>
						<p className="mt-2 text-sm text-white/60">
							O valor de <span className="font-semibold">{formattedAmount}</span>
							{currentPaymentLink.description ? (
								<>
									{' '}
									para <span className="font-semibold">{currentPaymentLink.description}</span>
								</>
							) : null}
							.
						</p>
					</div>
				</div>
			</>
		);
	}

	if (isTerminalStatus && isUnlimitedLink) {
		return (
			<>
				<div className="max-w-lg w-full mx-auto">
					<div className="bg-[#16181a] border border-white/12 rounded-[20px] p-8 text-center">
						<div className="text-4xl mb-4">{statusIcon(status)}</div>
						<h3 className="text-xl font-bold text-white">{statusText(status)}</h3>
						<p className="mt-2 text-sm text-white/60">
							Esta cobrança foi finalizada. Você pode gerar uma nova cobrança neste mesmo link.
						</p>
						<button
							type="button"
							onClick={handleNewCharge}
							className="mt-5 w-full py-3 rounded-[12px] font-semibold text-white transition-all cursor-pointer bg-[#494fdf] hover:bg-[#4f55f1] text-white"
						>
							Gerar nova cobrança
						</button>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="max-w-lg w-full mx-auto">
				<div className="bg-[#16181a] border border-white/12 rounded-[20px] overflow-hidden">
					<ProductHeader
						productName={currentPaymentLink.productName}
						productImageUrl={currentPaymentLink.productImageUrl}
						description={currentPaymentLink.description}
					/>
					{/* Selection phase */}
					<div
						className={`transition-all duration-400 ease-in-out ${
							contentPhase === 'selection' ? 'opacity-100' : 'opacity-0 hidden'
						}`}
					>
						<div className="p-6 flex flex-col gap-5">
							<div>
								<h2 className="text-xl font-bold text-white">Pagamento</h2>
								<p className="mt-1 text-sm text-white/60">Selecione a forma de pagamento para continuar.</p>
							</div>

							{/* Amount bar */}
							<div className="px-4 py-3 rounded-xl bg-[#16181a] border border-white/12 flex justify-between items-center">
								<span className="text-xs text-white/40">Valor a pagar</span>
								<span className="font-mono tabular-nums font-bold text-xl text-white">{effectiveFormattedAmount}</span>
							</div>

							{/* Fee Info */}
							{currentPaymentLink.showFees && (
								<FeeInfoSection
									amount={currentPaymentLink.amount}
									enabledMethods={currentPaymentLink.enabledMethods}
									feeAmounts={currentPaymentLink.feeAmounts ?? {}}
									passFeeToCustomer={currentPaymentLink.passFeeToCustomer}
									selectedMethod={selectedMethod}
								/>
							)}

							{/* Method Selection */}
							<div className="flex flex-col gap-2">
								<h3 className="text-sm font-semibold text-white">Forma de pagamento</h3>
								{currentPaymentLink.enabledMethods.map((method) => {
									const isSelected = selectedMethod === method;
									return (
										<button
											key={method}
											type="button"
											onClick={() => setSelectedMethod(method)}
											className={`w-full rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
												isSelected
													? 'border-[#494fdf] bg-[#494fdf]/10'
													: 'border-white/12 hover:border-white/8'
											}`}
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
														isSelected ? 'bg-[#494fdf] text-white' : 'bg-[#16181a] border border-white/12 text-white/60'
													}`}
												>
													<MethodIcon method={method} />
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-semibold text-sm text-white">{methodLabel(method)}</p>
													<p className="text-xs text-white/60">{methodDescription(method)}</p>
												</div>
												<div
													className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
														isSelected ? 'border-[#494fdf]' : 'border-white/8'
													}`}
												>
													{isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#494fdf]" />}
												</div>
											</div>
										</button>
									);
								})}
							</div>

							{/* Buyer Info Form */}
							{hasRequiredFields && (
								<BuyerInfoForm
									requiredFields={requiredFields}
									buyerName={buyerName}
									buyerEmail={buyerEmail}
									buyerPhone={buyerPhone}
									onNameChange={setBuyerName}
									onEmailChange={setBuyerEmail}
									onPhoneChange={setBuyerPhone}
								/>
							)}

							{selectedMethod === 'CreditCard' && (
								<CreditCardForm
									amount={currentPaymentLink.amount}
									cardNumber={cardNumber}
									cardHolderName={cardHolderName}
									cardExpiry={cardExpiry}
									cardCvv={cardCvv}
									installments={installments}
									onCardNumberChange={setCardNumber}
									onCardHolderNameChange={setCardHolderName}
									onCardExpiryChange={setCardExpiry}
									onCardCvvChange={setCardCvv}
									onInstallmentsChange={setInstallments}
								/>
							)}

							{startError && <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{startError}</div>}

							<button
								type="button"
								onClick={handleStartPayment}
								disabled={!canSubmitPayment}
								className={`w-full py-3.5 rounded-[12px] font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 ${
									canSubmitPayment ? 'bg-[#494fdf] hover:bg-[#4f55f1] text-white cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'
								}`}
							>
								<ShieldIcon className="text-white" />
								Pagar <span className="font-mono tabular-nums">{effectiveFormattedAmount}</span>
							</button>
						</div>
					</div>

					{/* Loading phase */}
					<div
						className={`transition-all duration-400 ease-in-out ${
							contentPhase === 'loading' ? 'opacity-100' : 'opacity-0 hidden'
						}`}
					>
						<div className="p-10 flex flex-col items-center gap-4 min-h-60 justify-center">
							<div className="w-10 h-10 border-[3px] border-white/15 border-t-[#494fdf] rounded-full animate-spin" />
							<p className="text-sm text-white/60">Gerando cobrança, aguarde...</p>
							<p className="text-xs text-white/40">
								{formattedAmount} via {selectedMethod ? methodLabel(selectedMethod) : ''}
							</p>
						</div>
					</div>

					{/* Payment result phase */}
					<div
						className={`transition-all duration-500 ease-in-out ${
							contentPhase === 'payment' ? 'opacity-100' : 'opacity-0 hidden'
						}`}
					>
						<div className="p-6 flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#494fdf] text-white">
									<MethodIcon method={currentPaymentLink.method ?? 'Pix'} />
								</div>
								<div className="flex flex-col">
									<h3 className="text-lg font-bold text-white">
										{currentPaymentLink.method ? methodLabel(currentPaymentLink.method) : 'Cobrança gerada'}
									</h3>
									<p className="text-sm text-white/60">{statusText(status)}</p>
								</div>
							</div>

							{currentPaymentLink.method === 'Pix' && (
								<PixView
									paymentLink={currentPaymentLink}
									formattedAmount={formattedAmount}
									countdown={countdown}
									copied={copied}
									onCopy={handleCopy}
									onGenerateNewTransaction={handleGenerateNewTransaction}
									onBackToStart={handleNewCharge}
									isGeneratingNewTransaction={isGeneratingNewTransaction}
								/>
							)}

							{currentPaymentLink.method === 'Boleto' && (
								<BoletoView
									paymentLink={currentPaymentLink}
									formattedAmount={formattedAmount}
									copied={copied}
									onCopy={handleCopy}
								/>
							)}

							{currentPaymentLink.method === 'CreditCard' && (
								<div className="rounded-xl bg-[#16181a] border border-white/12 p-4 text-sm">
									<p className="font-semibold text-white">Pagamento com cartão iniciado</p>
									<p className="mt-1 text-white/60">
										Seu pagamento está em processamento e o status será atualizado automaticamente nesta tela.
									</p>
									<div className="mt-3 flex items-center justify-between text-xs">
										<span className="text-white/40">Valor</span>
										<span className="font-mono tabular-nums font-semibold text-white">{formattedAmount}</span>
									</div>
								</div>
							)}

							{startError && <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{startError}</div>}

						</div>
					</div>
				</div>
				{currentPaymentLink.showSwiftPayBranding && (
					<div className="mt-4 flex flex-col items-center gap-2 pb-4">
						<p className="text-xs text-white/40">Pagamento processado com segurança pela SwiftPay Pay</p>
						<div className="flex items-center justify-center gap-4">
							<div className="flex items-center gap-1.5 text-white/40">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
									<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
									<path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
								</svg>
								<span className="text-xs">SSL</span>
							</div>
							<div className="flex items-center gap-1.5 text-white/40">
								<ShieldIcon className="text-white/40" />
								<span className="text-xs">Seguro</span>
							</div>
							<div className="flex items-center gap-1.5 text-white/40">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								<span className="text-xs">Protegido</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
