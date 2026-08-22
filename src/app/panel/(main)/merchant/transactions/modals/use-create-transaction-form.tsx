'use client';

import { useState, useTransition, useActionState, useDeferredValue, useEffect, use } from 'react';
import { createMerchantPayment, previewPayment } from '@/app/actions/merchant/payments';
import { listMerchantCustomers } from '@/app/actions/merchant/customers';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import type { MinimalCustomer } from '@/types/merchant/customers';
import type { PreviewPaymentData } from '@/types/merchant/payments';
import type { ReadFeesData } from '@/types/merchant/settings';
import type { ApiResponse } from '@/types/common';
import { PaymentMethod } from '@/types/enums';
import { formattedCurrencyToCents } from '@/utils/currency';

export const METADATA_TEMPLATES = {
	utmify: {
		label: 'Utmify',
		value: JSON.stringify(
			{
				src: 'facebook',
				sck: 'REPLACE_WITH_UTMIFY_KEY',
				utm_source: 'facebook',
				utm_campaign: 'campanha_checkout',
				utm_medium: 'cpc',
				utm_content: 'criativo_a',
				utm_term: 'produto_x',
			},
			null,
			2
		),
	},
	otimizey: {
		label: 'Otimizey',
		value: JSON.stringify(
			{
				src: 'google',
				sck: 'REPLACE_WITH_OTIMIZEY_KEY',
				utmSource: 'google',
				utmCampaign: 'campanha_otimizey',
				utmMedium: 'cpc',
				utmContent: 'anuncio_1',
			},
			null,
			2
		),
	},
} as const;

export type MetadataTemplateKey = keyof typeof METADATA_TEMPLATES;

export type FeesPromise = Promise<ApiResponse<ReadFeesData>>;

interface FormState {
	error: string | null;
}

interface UseCreateTransactionFormProps {
	merchantId: string;
	feesPromise: FeesPromise;
	onClose: () => void;
	onSuccess: () => void;
}

export function useCreateTransactionForm({ merchantId, feesPromise, onClose, onSuccess }: UseCreateTransactionFormProps) {
	const feesResponse = use(feesPromise);
	const fees = feesResponse?.data;

	const pixEnabled = fees?.pixEnabled ?? false;
	const minAmount = fees?.pixMinTransactionAmount ?? 100;
	const maxAmount = fees?.pixMaxTransactionAmount ?? 100000000;
	const hasMaxLimit = maxAmount > 0;

	const [isLoadingPreview, startLoadingPreview] = useTransition();
	const [selectedCustomer, setSelectedCustomer] = useState<MinimalCustomer | null>(null);
	const [amountFormatted, setAmountFormatted] = useState('');
	const [description, setDescription] = useState('');
	const [callbackUrl, setCallbackUrl] = useState('');
	const [fetchedPreview, setFetchedPreview] = useState<PreviewPaymentData | null>(null);
	const [isMetadataEnabled, setIsMetadataEnabled] = useState(false);
	const [metadataInput, setMetadataInput] = useState('');
	const [customerSearch, setCustomerSearch] = useState('');
	const [isCustomerAutocompleteOpen, setIsCustomerAutocompleteOpen] = useState(false);
	const [fetchedCustomerOptions, setFetchedCustomerOptions] = useState<MinimalCustomer[]>([]);
	const [lastCompletedCustomerSearch, setLastCompletedCustomerSearch] = useState<string | null>(null);

	const deferredCustomerSearch = useDeferredValue(customerSearch);
	const deferredAmountFormatted = useDeferredValue(amountFormatted);
	const customerSearchTerm = deferredCustomerSearch.trim();
	const shouldLoadDefaultCustomers = isCustomerAutocompleteOpen && customerSearchTerm.length === 0;
	const shouldRequestCustomers = customerSearchTerm.length >= 1 || shouldLoadDefaultCustomers;

	const isDebouncing = customerSearch.trim().length >= 1 && customerSearch !== deferredCustomerSearch;
	const isFetching = shouldRequestCustomers && customerSearchTerm !== lastCompletedCustomerSearch;
	const isSearchingCustomers = isDebouncing || isFetching;

	const customerOptions = shouldRequestCustomers ? fetchedCustomerOptions : [];

	const amountCents = formattedCurrencyToCents(deferredAmountFormatted) ?? 0;
	const amountForDisplay = formattedCurrencyToCents(amountFormatted) ?? 0;
	const shouldShowPreview = amountCents > 0;
	const preview = shouldShowPreview ? fetchedPreview : null;

	const isBelowMin = amountCents > 0 && amountCents < minAmount;
	const isAboveMax = amountCents > 0 && hasMaxLimit && amountCents > maxAmount;
	const isAmountOutOfRange = isBelowMin || isAboveMax;

	const normalizedMetadata = metadataInput.trim();
	const shouldValidateMetadata = isMetadataEnabled && normalizedMetadata.length > 0;
	let isInvalidMetadataJson = false;

	if (shouldValidateMetadata) {
		try {
			JSON.parse(normalizedMetadata);
		} catch {
			isInvalidMetadataJson = true;
		}
	}

	const isMissingMetadataJson = isMetadataEnabled && normalizedMetadata.length === 0;

	useEffect(() => {
		const term = customerSearchTerm;
		if (!shouldRequestCustomers) return;

		let cancelled = false;
		const pageSize = term.length > 0 ? 20 : 5;

		listMerchantCustomers(merchantId, { search: term || undefined, pageSize }).then((response) => {
			if (!cancelled) {
				setFetchedCustomerOptions(response?.data?.items ?? []);
				setLastCompletedCustomerSearch(term);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [customerSearchTerm, merchantId, shouldRequestCustomers]);

	useEffect(() => {
		if (!shouldShowPreview) return;

		let cancelled = false;

		startLoadingPreview(async () => {
			const previewResponse = await previewPayment(merchantId, {
				amount: amountCents,
				method: PaymentMethod.Pix,
			});
			if (!cancelled) setFetchedPreview(previewResponse?.data ?? null);
		});

		return () => {
			cancelled = true;
		};
	}, [shouldShowPreview, amountCents, merchantId]);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const amount = formattedCurrencyToCents(amountFormatted) ?? 0;
			const resolvedDescription = description || (formData.get('description') as string);

			if (amount <= 0) return { error: 'Informe um valor válido' };
			if (!pixEnabled) return { error: 'PIX não está habilitado para esta organização.' };
			if (isMetadataEnabled && normalizedMetadata.length === 0) {
				return { error: 'Informe o JSON de metadata ou desative a opção de envio' };
			}
			if (isMetadataEnabled && isInvalidMetadataJson) {
				return { error: 'O campo metadata deve conter um JSON válido' };
			}

			const res = await createMerchantPayment(merchantId, {
				method: PaymentMethod.Pix,
				amount,
				description: resolvedDescription?.trim() || undefined,
				customerId: selectedCustomer?.id,
				customerPhone: selectedCustomer?.phone ?? undefined,
				callbackUrl: callbackUrl.trim() || undefined,
				metadata: isMetadataEnabled ? normalizedMetadata : undefined,
			});

			if (res?.error) return { error: res.error.message || 'Erro ao criar transação' };

			toast('Transação criada', {
				description: res?.message || 'A transação foi criada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onSuccess();
			onClose();
			return { error: null };
		},
		{ error: null }
	);

	function handleAmountChange(formattedValue: string) {
		setAmountFormatted(formattedValue);
	}

	function handleCustomerSelect(key: string | number | null) {
		if (!key) {
			setSelectedCustomer(null);
			setCustomerSearch('');
			return;
		}
		const customer = customerOptions.find((c) => c.id === key);
		setSelectedCustomer(customer || null);
		setCustomerSearch(customer?.name ?? '');
		setIsCustomerAutocompleteOpen(false);
	}

	function handleRemoveCustomer() {
		setSelectedCustomer(null);
		setCustomerSearch('');
	}

	function applyMetadataTemplate(template: MetadataTemplateKey) {
		setMetadataInput(METADATA_TEMPLATES[template].value);
		setIsMetadataEnabled(true);
	}

	function setMetadataInputValue(value: unknown) {
		if (typeof value === 'string') {
			setMetadataInput(value);
			return;
		}

		if (
			value &&
			typeof value === 'object' &&
			'target' in value &&
			(value as { target?: unknown }).target &&
			typeof (value as { target: { value?: unknown } }).target.value === 'string'
		) {
			setMetadataInput((value as { target: { value: string } }).target.value);
			return;
		}

		setMetadataInput('');
	}

	const isValid =
		amountForDisplay > 0 &&
		!isAmountOutOfRange &&
		!isMissingMetadataJson &&
		!isInvalidMetadataJson;

	const hasNoPaymentMethods = !pixEnabled;
	return {
		fees: { methodOptions: pixEnabled ? [PaymentMethod.Pix] : [], minAmount, maxAmount, hasMaxLimit, hasNoPaymentMethods },
		form: {
			paymentMethod: PaymentMethod.Pix,
			amountFormatted,
			description,
			callbackUrl,
			isMetadataEnabled,
			metadataInput,
			selectedCustomer,
			customerSearch,
			isCustomerAutocompleteOpen,
		},
		data: {
			preview,
			customerOptions,
			isLoadingPreview,
			amountForDisplay,
		},
		state: {
			error: state.error,
			formAction,
			isPending,
			isSearchingCustomers,
		},
		validation: {
			isAmountOutOfRange,
			isBelowMin,
			isAboveMax,
			isMissingMetadataJson,
			isInvalidMetadataJson,
			isValid,
		},
		handlers: {
			setPaymentMethod: () => {},
			handleAmountChange,
			handleCustomerSelect,
			handleRemoveCustomer,
			setDescription,
			setCallbackUrl,
			setIsMetadataEnabled,
			setMetadataInput: setMetadataInputValue,
			applyMetadataTemplate,
			setCustomerSearch,
			setIsCustomerAutocompleteOpen,
		},
	};
}
