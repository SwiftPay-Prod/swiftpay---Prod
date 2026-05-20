'use client';

import { useState, useTransition, useActionState, useDeferredValue, useEffect, use } from 'react';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
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
				sck: 'ck_abc123',
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
				sck: 'ck_otimizey_123',
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
	function getMinBoletoDate() {
		return today(getLocalTimeZone()).add({ days: 2 });
	}

	const feesResponse = use(feesPromise);
	const fees = feesResponse?.data;

	const methodOptions = (() => {
		const options: PaymentMethod[] = [];
		if (fees?.pixEnabled) options.push(PaymentMethod.Pix);
		if (fees?.boletoEnabled) options.push(PaymentMethod.Boleto);
		if (fees?.creditCardEnabled) options.push(PaymentMethod.CreditCard);
		return options;
	})();

	const defaultMethod = methodOptions[0] ?? PaymentMethod.Pix;

	const [isLoadingPreview, startLoadingPreview] = useTransition();
	const [selectedCustomer, setSelectedCustomer] = useState<MinimalCustomer | null>(null);
	const [amountFormatted, setAmountFormatted] = useState('');
	const [description, setDescription] = useState('');
	const [callbackUrl, setCallbackUrl] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);
	const [cardNumber, setCardNumber] = useState('');
	const [cardHolderName, setCardHolderName] = useState('');
	const [cardExpirationMonth, setCardExpirationMonth] = useState('');
	const [cardExpirationYear, setCardExpirationYear] = useState('');
	const [installments, setInstallments] = useState('1');
	const [cardCvv, setCardCvv] = useState('');
	const [boletoDueDate, setBoletoDueDate] = useState('');
	const [boletoInstructions, setBoletoInstructions] = useState('');
	const [fetchedPreview, setFetchedPreview] = useState<PreviewPaymentData | null>(null);
	const [isMetadataEnabled, setIsMetadataEnabled] = useState(false);
	const [metadataInput, setMetadataInput] = useState('');
	const [customerSearch, setCustomerSearch] = useState('');
	const [isCustomerAutocompleteOpen, setIsCustomerAutocompleteOpen] = useState(false);
	const [fetchedCustomerOptions, setFetchedCustomerOptions] = useState<MinimalCustomer[]>([]);
	const [lastCompletedCustomerSearch, setLastCompletedCustomerSearch] = useState<string | null>(null);

	const minAmount = paymentMethod === PaymentMethod.Boleto
		? (fees?.boletoMinTransactionAmount ?? 500)
		: (fees?.pixMinTransactionAmount ?? 100);
	const maxAmount = paymentMethod === PaymentMethod.Boleto
		? (fees?.boletoMaxTransactionAmount ?? 100000000)
		: (fees?.pixMaxTransactionAmount ?? 100000000);
	const hasMaxLimit = maxAmount > 0;

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

	const isBoleto = paymentMethod === PaymentMethod.Boleto;
	const isCreditCard = paymentMethod === PaymentMethod.CreditCard;
	const cardDigits = cardNumber.replace(/\D/g, '');
	const cardCvvDigits = cardCvv.replace(/\D/g, '');
	const parsedExpirationMonth = Number.parseInt(cardExpirationMonth, 10);
	const parsedExpirationYear = Number.parseInt(cardExpirationYear, 10);
	const parsedInstallments = Number.parseInt(installments, 10);
	const currentYear = new Date().getFullYear();
	const isMissingCardNumber = isCreditCard && cardDigits.length < 13;
	const isMissingCardHolderName = isCreditCard && cardHolderName.trim().length < 3;
	const isMissingCardExpirationMonth =
		isCreditCard && (Number.isNaN(parsedExpirationMonth) || parsedExpirationMonth < 1 || parsedExpirationMonth > 12);
	const isMissingCardExpirationYear =
		isCreditCard && (Number.isNaN(parsedExpirationYear) || parsedExpirationYear < currentYear || parsedExpirationYear > currentYear + 20);
	const isMissingInstallments = isCreditCard && (Number.isNaN(parsedInstallments) || parsedInstallments < 1 || parsedInstallments > 12);
	const isMissingCardCvv = isCreditCard && (cardCvvDigits.length < 3 || cardCvvDigits.length > 4);
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
	const isMissingBoletoCustomer = isBoleto && !selectedCustomer;
	const isMissingBoletoDueDate = isBoleto && !boletoDueDate;
	const minBoletoDateValue = getMinBoletoDate();
	let boletoDueDateValue = null;
	let isInvalidBoletoDateValue = false;

	if (boletoDueDate) {
		try {
			boletoDueDateValue = parseDate(boletoDueDate);
		} catch {
			isInvalidBoletoDateValue = true;
		}
	}

	const isInvalidBoletoDueDate =
		isBoleto &&
		(!boletoDueDate || isInvalidBoletoDateValue || !boletoDueDateValue || boletoDueDateValue.compare(minBoletoDateValue) < 0);

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
				method: paymentMethod,
				installments: paymentMethod === PaymentMethod.CreditCard ? parsedInstallments || 1 : undefined,
			});
			if (!cancelled) setFetchedPreview(previewResponse?.data ?? null);
		});

		return () => {
			cancelled = true;
		};
	}, [shouldShowPreview, amountCents, paymentMethod, parsedInstallments, merchantId]);

	const [state, formAction, isPending] = useActionState(
		async (_prevState: FormState, formData: FormData): Promise<FormState> => {
			const amount = formattedCurrencyToCents(amountFormatted) ?? 0;
			const resolvedDescription = description || (formData.get('description') as string);
			const minBoletoDateOnSubmit = getMinBoletoDate();

			if (amount <= 0) return { error: 'Informe um valor válido' };
			if (isMetadataEnabled && normalizedMetadata.length === 0) {
				return { error: 'Informe o JSON de metadata ou desative a opção de envio' };
			}
			if (isMetadataEnabled && isInvalidMetadataJson) {
				return { error: 'O campo metadata deve conter um JSON válido' };
			}
			if (isBoleto && !selectedCustomer?.id) return { error: 'Selecione um cliente para emitir o boleto' };
			if (isCreditCard && isMissingCardNumber) return { error: 'Informe um número de cartão válido' };
			if (isCreditCard && isMissingCardHolderName) return { error: 'Informe o nome do titular do cartão' };
			if (isCreditCard && isMissingCardExpirationMonth) return { error: 'Informe o mês de expiração do cartão' };
			if (isCreditCard && isMissingCardExpirationYear) return { error: 'Informe o ano de expiração do cartão' };
			if (isCreditCard && isMissingInstallments) return { error: 'Informe a quantidade de parcelas (1 a 12)' };
			if (isCreditCard && isMissingCardCvv) return { error: 'Informe um CVV válido do cartão' };
			if (
				isBoleto &&
				(isInvalidBoletoDateValue || !boletoDueDateValue || boletoDueDateValue.compare(minBoletoDateOnSubmit) < 0)
			) {
				return { error: 'A data de vencimento do boleto deve ser no minimo D+2' };
			}

			const res = await createMerchantPayment(merchantId, {
				method: paymentMethod,
				amount,
				description: resolvedDescription?.trim() || undefined,
				customerId: selectedCustomer?.id,
				customerPhone: selectedCustomer?.phone ?? undefined,
				callbackUrl: callbackUrl.trim() || undefined,
				metadata: isMetadataEnabled ? normalizedMetadata : undefined,
				cardNumber: isCreditCard ? cardDigits : undefined,
				cardHolderName: isCreditCard ? cardHolderName.trim() : undefined,
				cardExpirationMonth: isCreditCard ? parsedExpirationMonth : undefined,
				cardExpirationYear: isCreditCard ? parsedExpirationYear : undefined,
				installments: isCreditCard ? parsedInstallments : undefined,
				cardCvv: isCreditCard ? cardCvvDigits : undefined,
				boletoDueDate: isBoleto ? boletoDueDate : undefined,
				boletoInstructions: isBoleto ? boletoInstructions.trim() || undefined : undefined,
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
		!isInvalidMetadataJson &&
		(!isBoleto || (!isMissingBoletoCustomer && !isMissingBoletoDueDate && !isInvalidBoletoDueDate)) &&
		(!isCreditCard || (
			!isMissingCardNumber &&
			!isMissingCardHolderName &&
			!isMissingCardExpirationMonth &&
			!isMissingCardExpirationYear &&
			!isMissingInstallments &&
			!isMissingCardCvv
		));

	const hasNoPaymentMethods = methodOptions.length === 0;
	return {
		fees: { methodOptions, minAmount, maxAmount, hasMaxLimit, hasNoPaymentMethods },
		form: {
			paymentMethod,
			amountFormatted,
			description,
			callbackUrl,
			cardNumber,
			cardHolderName,
			cardExpirationMonth,
			cardExpirationYear,
			installments,
			cardCvv,
			isMetadataEnabled,
			metadataInput,
			boletoDueDate,
			boletoInstructions,
			selectedCustomer,
			customerSearch,
			isCustomerAutocompleteOpen,
			boletoDueDateValue,
			minBoletoDateValue,
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
			isBoleto,
			isCreditCard,
			isMissingMetadataJson,
			isInvalidMetadataJson,
			isMissingBoletoCustomer,
			isMissingBoletoDueDate,
			isInvalidBoletoDueDate,
			isMissingCardNumber,
			isMissingCardHolderName,
			isMissingCardExpirationMonth,
			isMissingCardExpirationYear,
			isMissingInstallments,
			isMissingCardCvv,
			isValid,
		},
		handlers: {
			setPaymentMethod,
			handleAmountChange,
			handleCustomerSelect,
			handleRemoveCustomer,
			setDescription,
			setCallbackUrl,
			setCardNumber,
			setCardHolderName,
			setCardExpirationMonth,
			setCardExpirationYear,
			setInstallments,
			setCardCvv,
			setIsMetadataEnabled,
			setMetadataInput: setMetadataInputValue,
			applyMetadataTemplate,
			setBoletoDueDate,
			setBoletoInstructions,
			setCustomerSearch,
			setIsCustomerAutocompleteOpen,
		},
	};
}
