'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

interface PixResultViewProps {
	primaryColor: string;
	secondaryColor: string | null;
	pixCode: string;
	expiresAt: string;
	orderNumber: string;
	amount: number;
	onBack: () => void;
}

export function PixResultView({
	primaryColor,
	secondaryColor,
	pixCode,
	expiresAt,
	orderNumber,
	amount,
	onBack,
}: PixResultViewProps) {
	const gradientStyle = secondaryColor
		? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
		: { backgroundColor: primaryColor };

	const [copied, setCopied] = useState(false);
	const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 0 });
	const [isExpired, setIsExpired] = useState(false);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

	// Calculate remaining time
	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const expiry = new Date(expiresAt).getTime();
			const difference = expiry - now;

			if (difference <= 0) {
				setIsExpired(true);
				setTimeLeft({ minutes: 0, seconds: 0 });
				return;
			}

			setTimeLeft({
				minutes: Math.floor((difference / 1000 / 60) % 60),
				seconds: Math.floor((difference / 1000) % 60),
			});
		};

		calculateTimeLeft();
		const interval = setInterval(calculateTimeLeft, 1000);
		return () => clearInterval(interval);
	}, [expiresAt]);

	useEffect(() => {
		let isMounted = true;

		if (!pixCode) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- reset QR code when pixCode becomes empty is intentional
			setQrCodeDataUrl(null);
			return;
		}
		QRCode.toDataURL(pixCode, {
			width: 200,
			margin: 2,
			errorCorrectionLevel: 'M',
			color: {
				dark: '#1a1a1a',
				light: '#ffffff',
			},
		})
			.then((dataUrl) => {
				if (isMounted) {
					setQrCodeDataUrl(dataUrl);
				}
			})
			.catch(() => {
				if (isMounted) {
					setQrCodeDataUrl(null);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [pixCode]);

	const handleCopyPix = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(pixCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 3000);
		} catch {
			const textArea = document.createElement('textarea');
			textArea.value = pixCode;
			const body = document.body;
			if (body) {
				body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				textArea.remove();
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 3000);
		}
	}, [pixCode]);

	const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});

	return (
		<div className="max-w-md mx-auto">
			<div className="flex flex-col rounded-2xl p-8 text-center hero-card">
				<div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={gradientStyle}>
					<svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>

				<h2 className="text-2xl font-bold mb-1 hero-text">Pague com PIX</h2>
				<p className="text-sm mb-4 hero-text-muted">Escaneie o QR Code ou copie o código para pagar</p>

				{/* Order Info */}
				<div className="mb-4 p-3 rounded-lg hero-surface">
					<div className="flex justify-between items-center text-sm">
						<span className="hero-text-muted">Pedido #{orderNumber}</span>
						<span className="font-semibold hero-text">{formattedAmount}</span>
					</div>
				</div>

				{/* QR Code generated from Pix copy-and-paste code */}
				<div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-sm mx-auto">
					{qrCodeDataUrl ? (
						// eslint-disable-next-line @next/next/no-img-element -- QR code is base64 data URL generated at runtime; next/image não otimiza data URLs e src é dinâmico
						<img
							src={qrCodeDataUrl}
							alt="QR Code PIX"
							width={200}
							height={200}
							className="block"
						/>
					) : (
						<div className="w-50 h-50 bg-gray-100 flex items-center justify-center rounded-lg">
							<span className="text-gray-400 text-sm">Carregando QR Code...</span>
						</div>
					)}
				</div>

				{/* Timer */}
				<div className="mb-4 px-4 py-2 rounded-lg inline-flex items-center gap-2 hero-surface">
					{isExpired ? (
						<>
							<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span className="text-sm text-red-500 font-medium">Código expirado</span>
						</>
					) : (
						<>
							<svg className="w-4 h-4 hero-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span className="text-sm hero-text-secondary">
								Expira em{' '}
								<span className="font-mono font-bold">
									{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
								</span>
							</span>
						</>
					)}
				</div>

				{/* PIX Code */}
				<div className="mb-4">
					<p className="text-xs mb-2 hero-text-muted">Código PIX Copia e Cola:</p>
					<div className="p-3 rounded-lg text-xs font-mono break-all hero-surface hero-text-secondary select-all">
						{pixCode ? (pixCode.length > 60 ? `${pixCode.slice(0, 60)}...` : pixCode) : 'Carregando...'}
					</div>
				</div>

				{/* Copy Button */}
				<button
					type="button"
					onClick={handleCopyPix}
					disabled={isExpired}
					style={!isExpired ? gradientStyle : undefined}
					className={`w-full py-3 rounded-xl font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
						isExpired ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'
					}`}
				>
					{copied ? (
						<>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
							Código copiado!
						</>
					) : (
						<>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								/>
							</svg>
							Copiar código PIX
						</>
					)}
				</button>

				{/* Back Button */}
				<button
					type="button"
					onClick={onBack}
					className="w-full mt-3 py-3 rounded-xl font-medium transition-colors cursor-pointer hero-button-secondary"
				>
					Voltar
				</button>

				{/* Instructions */}
				<div className="mt-6 text-left">
					<p className="text-xs font-semibold mb-2 hero-text">Como pagar com PIX:</p>
					<ol className="text-xs hero-text-muted space-y-1">
						<li>1. Abra o app do seu banco</li>
						<li>2. Escolha pagar com PIX QR Code ou Copia e Cola</li>
						<li>3. Escaneie ou cole o código acima</li>
						<li>4. Confirme o pagamento</li>
					</ol>
				</div>
			</div>
		</div>
	);
}
