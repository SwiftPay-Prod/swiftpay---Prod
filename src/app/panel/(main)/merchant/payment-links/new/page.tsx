import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { getMerchantFees } from '@/app/actions/merchant/settings';
import { getMerchantPaymentLink } from '@/app/actions/merchant/payment-links';
import { CreatePaymentLinkPage } from './create-payment-link-page';
import { centsToFormattedCurrency } from '@/utils/currency';
import type { BillingFormState, SettingsFormState, VisualFormState, ProductFormState } from './use-create-payment-link-form';

function isoToDatetimeLocal(iso: string): string {
	const date = new Date(iso);
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	return date.toISOString().slice(0, 16);
}

interface Props {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function NewPaymentLinkPage({ searchParams }: Props) {
	const [params, merchant] = await Promise.all([searchParams, getSelectedMerchant()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const feesPromise = getMerchantFees(merchant.id);
	const cloneId = params.cloneId;

	if (!cloneId) {
		return (
			<Suspense>
				<CreatePaymentLinkPage merchantId={merchant.id} feesPromise={feesPromise} />
			</Suspense>
		);
	}

	const response = await getMerchantPaymentLink(merchant.id, cloneId);
	const source = response?.data;

	if (!source) {
		return (
			<Suspense>
				<CreatePaymentLinkPage merchantId={merchant.id} feesPromise={feesPromise} />
			</Suspense>
		);
	}

	const initialBillingValues: Partial<BillingFormState> = {
		amountFormatted: centsToFormattedCurrency(source.amount),
		redirectUrl: source.redirectUrl ?? '',
	};

	const initialProductValues: Partial<ProductFormState> = {
		name: source.productName ?? '',
		description: source.description ?? '',
		imageUrl: source.productImageUrl ?? '',
	};

	const requiredBuyerFields = (source.requiredBuyerFields ?? []).filter(
		(field): field is SettingsFormState['requiredBuyerFields'][number] =>
			field === 'Name' || field === 'Email' || field === 'Phone'
	);

	const initialSettingsValues: Partial<SettingsFormState> = {
		callbackUrl: source.callbackUrl ?? '',
		pixExpirationMinutes: source.pixExpirationMinutes?.toString() ?? '',
		canExpire: source.expiresAt !== null,
		expirationPreset: source.expiresAt ? 'custom' : '1d',
		customExpiresAt: source.expiresAt ? isoToDatetimeLocal(source.expiresAt) : '',
		requiredBuyerFields,
		showFees: source.showFees,
		passFeeToCustomer: source.passFeeToCustomer,
	};

	const initialVisualValues: Partial<VisualFormState> = {
		themeMode: (source.themeMode as 'Light' | 'Dark' | 'Auto') ?? 'Auto',
		logoUrl: source.logoUrl ?? '',
	};

	return (
		<Suspense>
			<CreatePaymentLinkPage
				merchantId={merchant.id}
				feesPromise={feesPromise}
				initialBillingValues={initialBillingValues}
				initialProductValues={initialProductValues}
				initialSettingsValues={initialSettingsValues}
				initialVisualValues={initialVisualValues}
				initialEnabledMethods={source.enabledMethods}
			/>
		</Suspense>
	);
}
