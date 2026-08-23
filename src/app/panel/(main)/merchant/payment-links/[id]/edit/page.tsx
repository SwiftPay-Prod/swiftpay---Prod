import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { getMerchantFees } from '@/app/actions/merchant/settings';
import { getMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import { CreatePaymentLinkPage } from '../../new/create-payment-link-page';
import { PaymentStatus } from '@/types/enums';
import { centsToFormattedCurrency } from '@/utils/currency';
import type { SettingsFormState } from '../../new/use-create-payment-link-form';

function isoToDatetimeLocal(iso: string): string {
	const date = new Date(iso);
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	return date.toISOString().slice(0, 16);
}

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ mode?: string }>;
}


export default async function EditPaymentLinkPage({ params, searchParams }: Props) {
	const { id } = await params;
	const query = await searchParams;
	const requestedMode = query.mode === 'view' ? 'view' : 'edit';
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const response = await getMerchantPaymentLink(merchant.id, id);
	const paymentLink = response?.data;
	const canEdit =
		paymentLink?.status === PaymentStatus.Pending && paymentLink.isExpired === false;

	if (!paymentLink) {
		redirect(Routes.panel.merchant.paymentLinks);
	}

	const mode = canEdit && requestedMode === 'edit' ? 'edit' : 'view';

	const feesPromise = getMerchantFees(merchant.id);

	const initialBillingValues = {
		amountFormatted: centsToFormattedCurrency(paymentLink.amount),
		redirectUrl: paymentLink.redirectUrl ?? '',
	};

	const initialProductValues = {
		name: paymentLink.productName ?? '',
		description: paymentLink.description ?? '',
		imageUrl: paymentLink.productImageUrl ?? '',
	};

	const initialVisualValues = {
		themeMode: (paymentLink.themeMode as 'Light' | 'Dark' | 'Auto') ?? 'Auto',
		logoUrl: paymentLink.logoUrl ?? '',
	};

	const requiredBuyerFields = (paymentLink.requiredBuyerFields ?? []).filter(
		(field): field is SettingsFormState['requiredBuyerFields'][number] =>
			field === 'Name' || field === 'Email' || field === 'Phone'
	);

	const initialSettingsValues: Partial<SettingsFormState> = {
		callbackUrl: paymentLink.callbackUrl ?? '',
		pixExpirationMinutes: paymentLink.pixExpirationMinutes?.toString() ?? '',
		canExpire: paymentLink.expiresAt !== null,
		expirationPreset: paymentLink.expiresAt ? 'custom' : '1d',
		customExpiresAt: paymentLink.expiresAt ? isoToDatetimeLocal(paymentLink.expiresAt) : '',
		requiredBuyerFields,
		showFees: paymentLink.showFees,
		passFeeToCustomer: paymentLink.passFeeToCustomer,
	};

	return (
		<Suspense>
			<CreatePaymentLinkPage
				merchantId={merchant.id}
				feesPromise={feesPromise}
				paymentLinkId={id}
				mode={mode}
				canEdit={canEdit}
				linkStatus={paymentLink.status}
				isExpiredLink={paymentLink.isExpired}
				initialBillingValues={initialBillingValues}
				initialSettingsValues={initialSettingsValues}
				initialVisualValues={initialVisualValues}
				initialProductValues={initialProductValues}
				initialEnabledMethods={paymentLink.enabledMethods}
			/>
		</Suspense>
	);
}
