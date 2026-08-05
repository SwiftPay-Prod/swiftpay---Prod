'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { PaymentMethod, CardBrand, FormErrors } from '../types';
import { Input } from '../components';
import { maskCardNumber, maskExpiry, maskCVC } from '../masks';
import { Icon } from '@/components/icon';
import { CreditCardIcon, Invoice02Icon, QrCodeIcon } from '@hugeicons/core-free-icons';

interface PaymentSectionProps {
	primaryColor: string;
	secondaryColor: string | null;
	paymentMethod: PaymentMethod | null;
	onPaymentMethodChange: (method: PaymentMethod | null) => void;
	cardNumber: string;
	cardName: string;
	cardExpiry: string;
	cardCvc: string;
	installments: string;
	onCardNumberChange: (value: string) => void;
	onCardNameChange: (value: string) => void;
	onCardExpiryChange: (value: string) => void;
	onCardCvcChange: (value: string) => void;
	onInstallmentsChange: (value: string) => void;
	errors: FormErrors;
	productPrice: number;
	pixEnabled: boolean;
	creditCardEnabled: boolean;
	boletoEnabled: boolean;
}

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

export function PaymentSection({
	primaryColor,
	secondaryColor,
	paymentMethod,
	onPaymentMethodChange,
	cardNumber,
	cardName,
	cardExpiry,
	cardCvc,
	installments,
	onCardNumberChange,
	onCardNameChange,
	onCardExpiryChange,
	onCardCvcChange,
	onInstallmentsChange,
	errors,
	productPrice,
	pixEnabled,
	creditCardEnabled,
	boletoEnabled,
}: PaymentSectionProps) {
	const [cardFlipped, setCardFlipped] = useState(false);

	const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
	const cardDisabled = !creditCardEnabled || true;
	const boletoDisabled = !boletoEnabled || true;

	const hasAnyPaymentMethod = pixEnabled || creditCardEnabled || boletoEnabled;
	const enabledMethodCount = [pixEnabled, creditCardEnabled, boletoEnabled].filter(Boolean).length;
	const isSingleMethod = enabledMethodCount === 1;

	const installmentOptions = useMemo(() => {
		const options = [];
		for (let i = 1; i <= 12; i++) {
			const value = productPrice / i;
			const label =
				i === 1
					? `1x de R$ ${(value / 100).toFixed(2).replace('.', ',')} (sem juros)`
					: `${i}x de R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
			options.push({ value: i.toString(), label });
		}
		return options;
	}, [productPrice]);

	const gradientStyle = secondaryColor ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : primaryColor;

	return (
		<div className="hero-card">
			<div className="flex items-center gap-3 mb-6">
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
					style={{ background: gradientStyle }}
				>
					<Icon icon={CreditCardIcon} className="icon-sm" />
				</div>
				<h2 className="text-md font-extrabold italic hero-text">PAGAMENTO</h2>
			</div>

			{!hasAnyPaymentMethod ? (
				<div className="p-4 rounded-xl hero-surface text-center">
					<p className="hero-text-muted">Nenhum método de pagamento disponível no momento.</p>
				</div>
			) : (
				<>
					{!paymentMethod && (
						<div className="p-4 rounded-xl hero-surface text-center mb-4">
							<p className="hero-text-muted text-sm">Selecione uma forma de pagamento acima para continuar.</p>
						</div>
					)}

					{/* Payment Methods — only show the selector when there is more than one method available.
					    With a single method (PIX-only), the selection is redundant: the method is already
					    pre-selected and the content below communicates it. */}
					{!isSingleMethod && (
						<div className="flex gap-2 mb-2">
							{pixEnabled && (
								<button
									type="button"
									onClick={() => onPaymentMethodChange(paymentMethod === 'Pix' ? null : 'Pix')}
									className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
										paymentMethod === 'Pix' ? 'text-white shadow-lg' : 'hero-button-secondary'
									}`}
									style={paymentMethod === 'Pix' ? { background: gradientStyle } : undefined}
								>
									<Icon icon={QrCodeIcon} className="icon-md" />
									PIX
								</button>
							)}
						{creditCardEnabled && (
							<button
								type="button"
								onClick={() => onPaymentMethodChange(paymentMethod === 'CreditCard' ? null : 'CreditCard')}
								disabled={cardDisabled}
								className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
									paymentMethod === 'CreditCard' ? 'text-white shadow-lg' : 'hero-button-secondary'
								}`}
								style={paymentMethod === 'CreditCard' ? { background: gradientStyle } : undefined}
							>
								<Icon icon={CreditCardIcon} className="icon-md" />
								Cartão
							</button>
						)}
						{boletoEnabled && (
							<button
								type="button"
								onClick={() => onPaymentMethodChange(paymentMethod === 'Boleto' ? null : 'Boleto')}
								disabled={boletoDisabled}
								className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
									paymentMethod === 'Boleto' ? 'text-white shadow-lg' : 'hero-button-secondary'
								}`}
								style={paymentMethod === 'Boleto' ? { background: gradientStyle } : undefined}
							>
								<Icon icon={Invoice02Icon} className="icon-md" />
								Boleto
							</button>
						)}
						</div>
					)}
					{errors.paymentMethod && <p className="text-red-500 text-xs mb-4">{errors.paymentMethod}</p>}
				</>
			)}

			{/* PIX Content */}
			{paymentMethod === 'Pix' && (
				<div className="p-4 rounded-xl hero-surface">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
							<Icon icon={QrCodeIcon} className="icon-xl text-gray-900" />
						</div>
						<div>
							<p className="font-medium hero-text">Pagamento instantâneo</p>
							<p className="text-sm hero-text-muted">O QR Code será gerado após confirmar o pedido</p>
						</div>
					</div>
				</div>
			)}

			{/* Credit Card Content */}
			{paymentMethod === 'CreditCard' && (
				<div className="space-y-4">
					{/* Card Preview */}
					<div className="perspective-1000 h-48 mb-4">
						<div
							className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
								cardFlipped ? 'rotate-y-180' : ''
							}`}
							style={{ transformStyle: 'preserve-3d' }}
						>
							{/* Front */}
							<div
								className="absolute inset-0 rounded-2xl p-6 text-white shadow-xl"
								style={{ backfaceVisibility: 'hidden', background: gradientStyle }}
							>
								<div className="flex justify-between items-start mb-8">
									<div className="w-12 h-9 bg-yellow-200/80 rounded" />
									{cardBrand !== 'unknown' && cardBrand !== 'default' && CARD_BRAND_LOGOS[cardBrand] && (
										<Image
											src={CARD_BRAND_LOGOS[cardBrand]}
											alt={cardBrand}
											width={80}
											height={32}
											className="h-8 w-auto object-contain"
											unoptimized
										/>
									)}
								</div>
								<p className="text-xl font-mono tracking-wider mb-4">{cardNumber || '•••• •••• •••• ••••'}</p>
								<div className="flex justify-between">
									<div>
										<p className="text-xs opacity-70">TITULAR</p>
										<p className="font-medium text-sm uppercase">{cardName || 'SEU NOME AQUI'}</p>
									</div>
									<div className="text-right">
										<p className="text-xs opacity-70">VALIDADE</p>
										<p className="font-medium text-sm">{cardExpiry || 'MM/AA'}</p>
									</div>
								</div>
							</div>

							{/* Back */}
							<div
								className="absolute inset-0 rounded-2xl text-white shadow-xl"
								style={{
									backfaceVisibility: 'hidden',
									transform: 'rotateY(180deg)',
									background: gradientStyle,
								}}
							>
								<div className="w-full h-12 bg-gray-900 mt-6" />
								<div className="p-6">
									<div className="flex items-center gap-2">
										<div className="flex-1 h-10 bg-gray-200 rounded flex items-end justify-end px-3 py-2">
											<span className="text-gray-900 font-mono text-sm">{cardCvc || '•••'}</span>
										</div>
										<span className="text-xs opacity-70">CVC</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Card Form */}
					<Input
						label="Número do cartão"
						value={cardNumber}
						onChange={onCardNumberChange}
						placeholder="0000 0000 0000 0000"
						error={errors.cardNumber}
						mask={maskCardNumber}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="cc-number"
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
								/>
							</svg>
						}
					/>

					<Input
						label="Nome no cartão"
						value={cardName}
						onChange={onCardNameChange}
						placeholder="Como está impresso no cartão"
						error={errors.cardName}
						brandColor={primaryColor}
						secondaryColor={secondaryColor}
						autoComplete="cc-name"
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						}
					/>

					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Validade"
							value={cardExpiry}
							onChange={onCardExpiryChange}
							placeholder="MM/AA"
							error={errors.cardExpiry}
							mask={maskExpiry}
							brandColor={primaryColor}
							secondaryColor={secondaryColor}
							autoComplete="cc-exp"
							icon={<Icon icon={CreditCardIcon} className="icon-md" />}
						/>

						<Input
							label="CVC"
							value={cardCvc}
							onChange={(v) => {
								onCardCvcChange(v);
								setCardFlipped(v.length > 0);
							}}
							placeholder="123"
							error={errors.cardCvc}
							mask={maskCVC}
							brandColor={primaryColor}
							secondaryColor={secondaryColor}
							autoComplete="cc-csc"
							icon={<Icon icon={CreditCardIcon} className="icon-md" />}
						/>
					</div>

					{/* Installments */}
					<div>
						<label className="block text-sm font-medium mb-1.5 hero-text-muted">Parcelas</label>
						<select
							value={installments}
							onChange={(e) => onInstallmentsChange(e.target.value)}
							className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all text-sm hero-select"
							style={{ borderColor: 'inherit' }}
							onFocus={(e) => (e.target.style.borderColor = primaryColor)}
							onBlur={(e) => (e.target.style.borderColor = '')}
						>
							{installmentOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
						{errors.installments && <p className="text-red-500 text-xs mt-1">{errors.installments}</p>}
					</div>
				</div>
			)}
		</div>
	);
}
