import { cache } from 'react';
import { getPaymentLinkByPaymentId } from '@/actions/paymentLink';
import PaymentLinkView from '@/templates/payment-link-view';
import { PaymentLinkThemeWrapper } from '../components/payment-link-theme-wrapper';
import { ThemeLogo } from '../components/theme-logo';

const getPaymentLinkByPaymentIdCached = cache(getPaymentLinkByPaymentId);

interface PaymentLinkByIdPageContentProps {
	paymentId: string;
}

export async function PaymentLinkByIdPageContent({ paymentId }: PaymentLinkByIdPageContentProps) {
	const { paymentLink, error, errorType } = await getPaymentLinkByPaymentIdCached(paymentId);
	const showSafefyBranding = paymentLink?.showSafefyBranding !== false;

	return (
		<PaymentLinkThemeWrapper themeMode={paymentLink?.themeMode}>
			<div className="flex min-h-dvh flex-col">
				{paymentLink?.environment === 'Sandbox' && (
					<div className="w-full py-2 px-4 text-center text-xs font-semibold hero-alert-warning">
						Ambiente de testes, esta e uma transacao de sandbox e nao envolve dinheiro real
					</div>
				)}

				{showSafefyBranding && (
					<header className="payment-link-main flex items-center justify-center py-6 px-4">
						<ThemeLogo logoUrl={paymentLink?.logoUrl} />
					</header>
				)}

				<main className={`flex flex-1 justify-center px-4 ${showSafefyBranding ? 'items-start pb-12' : 'items-center py-12'}`}>
					{!paymentLink ? (
						<ErrorView errorType={errorType} error={error} />
					) : (
						<PaymentLinkView paymentLink={paymentLink} token={paymentId} disableStatusPolling />
					)}
				</main>
			</div>
		</PaymentLinkThemeWrapper>
	);
}

function ErrorView({ errorType, error }: { errorType: string | null; error: string | null }) {
	const isExpired = errorType === 'expired';
	const isNotFound = errorType === 'not_found';

	return (
		<div className="max-w-md w-full mx-auto">
			<div className="flex flex-col items-center rounded-3xl p-8 text-center hero-card">
				<div
					className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
						isExpired ? 'bg-yellow-900/50 border border-yellow-700' : 'bg-red-900/50 border border-red-700'
					}`}
				>
					{isExpired ? (
						<svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					) : (
						<svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					)}
				</div>
				<h2 className="text-2xl font-bold mb-2 hero-text">
					{isExpired ? 'Pagamento expirado' : isNotFound ? 'Pagamento não encontrado' : 'Algo deu errado'}
				</h2>
				<p className="text-sm hero-text-muted">
					{error ??
						(isExpired
							? 'O prazo para este pagamento foi encerrado.'
							: isNotFound
								? 'Este pagamento nao foi encontrado.'
								: 'Nao foi possivel carregar este pagamento.')}
				</p>
			</div>
		</div>
	);
}
