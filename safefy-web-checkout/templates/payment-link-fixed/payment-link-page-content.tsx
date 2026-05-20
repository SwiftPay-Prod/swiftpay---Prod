import { cache } from 'react';
import { getPaymentLink } from '@/actions/paymentLink';
import { ThemeLogo } from './theme-logo';
import { PaymentLinkThemeWrapper } from './payment-link-theme-wrapper';
import PaymentLinkFixedTemplate from '@/templates/payment-link-fixed';

const getPaymentLinkCached = cache(getPaymentLink);

interface PaymentLinkPageContentProps {
	token: string;
}

export async function PaymentLinkPageContent({ token }: PaymentLinkPageContentProps) {
	const { paymentLink, error, errorType } = await getPaymentLinkCached(token);

	return (
		<PaymentLinkThemeWrapper themeMode={paymentLink?.themeMode}>
			{paymentLink?.environment === 'Sandbox' && (
				<div className="w-full py-2 px-4 text-center text-xs font-semibold hero-alert-warning">
					⚠️ Ambiente de testes — esta é uma transação de sandbox e não envolve dinheiro real
				</div>
			)}

			{paymentLink?.showSafefyBranding !== false && (
				<header className="flex items-center justify-center py-6 px-4">
					<ThemeLogo logoUrl={paymentLink?.logoUrl} />
				</header>
			)}

			<main className="flex items-start justify-center px-4 pb-12">
				{!paymentLink ? (
					<ErrorView errorType={errorType} error={error} />
				) : (
					<PaymentLinkFixedTemplate paymentLink={paymentLink} token={token} />
				)}
			</main>
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
					{isExpired ? 'Link expirado' : isNotFound ? 'Link não encontrado' : 'Algo deu errado'}
				</h2>
				<p className="text-sm hero-text-muted">
					{error ??
						(isExpired
							? 'O prazo para este pagamento foi encerrado.'
							: isNotFound
								? 'Este link de pagamento não existe ou foi removido.'
								: 'Não foi possível carregar este link de pagamento.')}
				</p>
			</div>
		</div>
	);
}
