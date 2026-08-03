'use client';

import { useEffect, useState } from 'react';

interface SuccessViewProps {
	primaryColor: string;
	secondaryColor: string | null;
	productName: string;
	customerName: string;
	customerEmail: string;
	orderNumber: string;
	amount: number;
	successMessage: string | null;
	successUrl: string | null;
	onNewPurchase: () => void;
}

const AUTO_REDIRECT_SECONDS = 10;

function isValidUrl(url: string | null): boolean {
	if (!url) return false;
	try {
		const parsed = new URL(url);
		return ['http:', 'https:'].includes(parsed.protocol);
	} catch {
		return false;
	}
}

export function SuccessView({
	primaryColor,
	secondaryColor,
	productName,
	customerName,
	customerEmail,
	orderNumber,
	amount,
	successMessage,
	successUrl,
	onNewPurchase,
}: SuccessViewProps) {
	const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
	const shouldAutoRedirect = isValidUrl(successUrl);

	useEffect(() => {
		if (!shouldAutoRedirect || !successUrl) return;

		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					window.location.href = successUrl;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [shouldAutoRedirect, successUrl]);

	const gradientStyle = secondaryColor
		? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
		: { backgroundColor: primaryColor };

	const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});

	return (
		<div className="max-w-md mx-auto">
			<div className="rounded-2xl p-8 text-center hero-card">
				{/* Success Animation */}
				<div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={gradientStyle}>
					<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
					</svg>
				</div>

				<h2 className="text-2xl font-bold mb-2 hero-text">Pagamento Confirmado!</h2>
				<p className="text-sm mb-6 hero-text-muted">{successMessage || `Obrigado pela sua compra, ${customerName}!`}</p>

				{/* Order Details */}
				<div className="p-4 rounded-xl mb-6 text-left hero-surface">
					<div className="space-y.5">
						<div className="flex justify-between py-2 border-b border-white/10">
							<span className="hero-text-muted">Pedido</span>
							<span className="font-mono hero-text">#{orderNumber}</span>
						</div>
						<div className="flex justify-between py-2 border-b border-white/10">
							<span className="hero-text-muted">Produto</span>
							<span className="hero-text text-right max-w-[60%] truncate">{productName}</span>
						</div>
						<div className="flex justify-between py-2 border-b border-white/10">
							<span className="hero-text-muted">Valor</span>
							<span className="font-semibold hero-text">{formattedAmount}</span>
						</div>
						<div className="flex justify-between py-2">
							<span className="hero-text-muted">Status</span>
							<span className="text-green-500 font-medium flex items-center gap-1">
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								Aprovado
							</span>
						</div>
					</div>
				</div>

				{/* Email Notice */}
				<div className="flex items-center gap-3 p-4 rounded-xl mb-6 hero-alert-info">
					<svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
					<p className="text-sm text-left hero-alert-info-text">
						Um e-mail com os detalhes do pedido foi enviado para <span className="font-medium">{customerEmail}</span>
					</p>
				</div>

				{/* Redirect countdown or new purchase button */}
				{shouldAutoRedirect && countdown > 0 ? (
					<p className="text-xs hero-text-muted mb-4">Redirecionando automaticamente em {countdown}s...</p>
				) : !successUrl ? (
					<button
						type="button"
						onClick={onNewPurchase}
						className="w-full py-3 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 mb-3"
						style={gradientStyle}
					>
						<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						<span className="text-white">Realizar nova compra</span>
					</button>
				) : null}
			</div>
		</div>
	);
}
