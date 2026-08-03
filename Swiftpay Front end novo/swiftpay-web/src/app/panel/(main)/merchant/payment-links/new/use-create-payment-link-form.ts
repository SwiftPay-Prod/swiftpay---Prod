'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { PaymentMethod } from '@/types/enums';
import type { ReadFeesData } from '@/types/merchant/settings';
import {
  paymentLinkFormSchema,
  type BillingFormState,
  type PaymentLinkFormData,
  type ProductFormState,
  type SettingsFormState,
  type VisualFormState,
  type ExpirationPreset,
} from './create-payment-link-form-schema';

export type { BillingFormState, SettingsFormState, VisualFormState, ProductFormState, ExpirationPreset };
export type { PaymentLinkFormData };

type SupportedPaymentMethod = PaymentLinkFormData['enabledMethods'][number];

interface UseCreatePaymentLinkFormOptions {
  totalSteps: number;
  availableMethods: SupportedPaymentMethod[];
  initialMethods?: PaymentMethod[];
  initialAmountFormatted?: string;
  initialDescription?: string;
  initialStep?: number;
  initialBilling?: Partial<BillingFormState>;
  initialSettings?: Partial<SettingsFormState>;
  initialVisual?: Partial<VisualFormState>;
  initialProduct?: Partial<ProductFormState>;
  fees?: ReadFeesData | null;
}

export function useCreatePaymentLinkForm({
  totalSteps,
  availableMethods,
  initialMethods,
  initialAmountFormatted,
  initialDescription,
  initialStep,
  initialBilling,
  initialSettings,
  initialVisual,
  initialProduct,
  fees,
}: UseCreatePaymentLinkFormOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep ?? 1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const defaultValues = useMemo<PaymentLinkFormData>(
    () => ({
      enabledMethods: (initialMethods ?? [PaymentMethod.Pix]).filter(
        (method): method is SupportedPaymentMethod =>
          method === PaymentMethod.Pix || method === PaymentMethod.Boleto || method === PaymentMethod.CreditCard
      ),
      billing: {
        amountFormatted: initialAmountFormatted ?? '',
        redirectUrl: '',
        ...initialBilling,
      },
      product: {
        name: '',
        description: initialDescription ?? '',
        imageUrl: '',
        ...initialProduct,
      },
      settings: {
        callbackUrl: '',
        pixExpirationMinutes: '',
        boletoDueDate: '',
        boletoInstructions: '',
        canExpire: false,
        expirationPreset: '1d',
        customExpiresAt: '',
        requiredBuyerFields: [],
        showFees: false,
        passFeeToCustomer: false,
        ...initialSettings,
      },
      visual: {
        themeMode: 'Auto',
        logoUrl: '',
        ...initialVisual,
      },
    }),
    [
      initialAmountFormatted,
      initialBilling,
      initialDescription,
      initialMethods,
      initialProduct,
      initialSettings,
      initialVisual,
    ]
  );

  const form = useForm<PaymentLinkFormData>({
    resolver: zodResolver(paymentLinkFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const enabledMethods = form.watch('enabledMethods');
  const billing = form.watch('billing');
  const product = form.watch('product');
  const settings = form.watch('settings');
  const visual = form.watch('visual');

  const amountCents = formattedCurrencyToCents(billing.amountFormatted) ?? 0;

  const hasPix = enabledMethods.includes(PaymentMethod.Pix);
  const hasBoleto = enabledMethods.includes(PaymentMethod.Boleto);
  const hasCreditCard = enabledMethods.includes(PaymentMethod.CreditCard);
  const enabledMins = [
    hasPix ? (fees?.pixMinTransactionAmount ?? 100) : null,
    hasBoleto ? (fees?.boletoMinTransactionAmount ?? 500) : null,
    hasCreditCard ? (fees?.pixMinTransactionAmount ?? 100) : null,
  ].filter((v): v is number => v !== null);
  const enabledMaxes = [
    hasPix ? (fees?.pixMaxTransactionAmount ?? 100000000) : null,
    hasBoleto ? (fees?.boletoMaxTransactionAmount ?? 100000000) : null,
    hasCreditCard ? (fees?.pixMaxTransactionAmount ?? 100000000) : null,
  ].filter((v): v is number => v !== null);
  const effectiveMinAmount = enabledMins.length > 0 ? Math.max(...enabledMins) : 100;
  const effectiveMaxAmount = enabledMaxes.length > 0 ? Math.min(...enabledMaxes) : 100000000;
  const hasEffectiveMaxAmount = effectiveMaxAmount < 100000000;
  const isBelowEffectiveMinAmount = amountCents > 0 && amountCents < effectiveMinAmount;
  const isAboveEffectiveMaxAmount = amountCents > 0 && hasEffectiveMaxAmount && amountCents > effectiveMaxAmount;
  const isAmountOutOfRange = isBelowEffectiveMinAmount || isAboveEffectiveMaxAmount;

  async function validateStep(step: number): Promise<string | null> {
    if (step === 1) {
      const isValid = await form.trigger('enabledMethods');
      if (!isValid || enabledMethods.length === 0) {
        return 'Selecione ao menos um metodo de pagamento.';
      }
    }

    if (step === 2) {
      const isSettingsValid = await form.trigger('settings');
      if (!isSettingsValid) {
        return 'Revise as configuracoes antes de continuar.';
      }

      if (enabledMethods.includes(PaymentMethod.Boleto) && !settings.boletoDueDate.trim()) {
        return 'Informe a data de vencimento do boleto.';
      }

      if (settings.canExpire && settings.expirationPreset === 'custom' && !settings.customExpiresAt.trim()) {
        return 'Informe data e hora da expiracao personalizada.';
      }
    }

    if (step === 3) {
      const isProductValid = await form.trigger('product');
      if (!isProductValid) {
        return 'Revise os dados do produto.';
      }
    }

    if (step === 4) {
      const isVisualValid = await form.trigger('visual');
      if (!isVisualValid) {
        return 'Revise a personalizacao visual.';
      }
    }

    if (step === 5) {
      const isBillingValid = await form.trigger('billing');
      if (!isBillingValid) {
        return 'Revise os dados de cobranca.';
      }

      if (amountCents <= 0) return 'Informe um valor maior que zero.';
      if (amountCents < effectiveMinAmount) return `Valor Mínimo: ${formatCurrency(effectiveMinAmount)}.`;
      if (effectiveMaxAmount > 0 && amountCents > effectiveMaxAmount) return `Valor Máximo: ${formatCurrency(effectiveMaxAmount)}.`;
    }

    return null;
  }

  async function goToNextStep(): Promise<boolean> {
    setStepError(null);
    const error = await validateStep(currentStep);

    if (error) {
      setStepError(error);
      return false;
    }

    setCurrentStep((step) => Math.min(step + 1, totalSteps));
    return true;
  }

  function goToPreviousStep() {
    setStepError(null);
    setSubmitError(null);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function goToStep(targetStep: number): Promise<boolean> {
    if (targetStep === currentStep) {
      return true;
    }

    if (targetStep > currentStep) {
      const error = await validateStep(currentStep);
      if (error) {
        setStepError(error);
        return false;
      }
    }

    setStepError(null);
    setSubmitError(null);
    setCurrentStep(targetStep);
    return true;
  }

  function getAllValidationErrors(): string[] {
    const errors: string[] = [];
    const parsed = paymentLinkFormSchema.safeParse(form.getValues());

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        if (!errors.includes(issue.message)) {
          errors.push(issue.message);
        }
      });
    }

    if (enabledMethods.length === 0) {
      errors.push('Selecione ao menos um metodo de pagamento.');
    }

    if (enabledMethods.includes(PaymentMethod.Boleto) && !settings.boletoDueDate.trim()) {
      errors.push('Informe a data de vencimento do boleto.');
    }

    if (settings.canExpire && settings.expirationPreset === 'custom' && !settings.customExpiresAt.trim()) {
      errors.push('Informe data e hora da expiracao personalizada.');
    }

    if (amountCents <= 0) {
      errors.push('Informe um valor maior que zero.');
    }

    if (amountCents < effectiveMinAmount) {
      errors.push(`Valor Mínimo: ${formatCurrency(effectiveMinAmount)}.`);
    }

    if (effectiveMaxAmount > 0 && amountCents > effectiveMaxAmount) {
      errors.push(`Valor Máximo: ${formatCurrency(effectiveMaxAmount)}.`);
    }

    return Array.from(new Set(errors));
  }

  function toggleMethods(keys: 'all' | Set<React.Key>) {
    setStepError(null);

    if (keys === 'all') {
      form.setValue('enabledMethods', [...availableMethods], { shouldDirty: true, shouldValidate: true });
      return;
    }

    const nextMethods = Array.from(keys)
      .map((key) => String(key))
      .filter((value): value is SupportedPaymentMethod => availableMethods.includes(value as SupportedPaymentMethod));

    form.setValue('enabledMethods', nextMethods, { shouldDirty: true, shouldValidate: true });
  }

  function setBillingField<K extends keyof BillingFormState>(field: K, value: BillingFormState[K]) {
    const current = form.getValues('billing');
    form.setValue('billing', { ...current, [field]: value }, { shouldDirty: true, shouldValidate: true });
  }

  function setSettingsField<K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) {
    const current = form.getValues('settings');
    form.setValue('settings', { ...current, [field]: value }, { shouldDirty: true, shouldValidate: true });
  }

  function setVisualField<K extends keyof VisualFormState>(field: K, value: VisualFormState[K]) {
    const current = form.getValues('visual');
    form.setValue('visual', { ...current, [field]: value }, { shouldDirty: true, shouldValidate: true });
  }

  function setProductField<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    const current = form.getValues('product');
    form.setValue('product', { ...current, [field]: value }, { shouldDirty: true, shouldValidate: true });
  }

  function toggleBuyerField(field: SettingsFormState['requiredBuyerFields'][number], checked: boolean) {
    const currentFields = form.getValues('settings.requiredBuyerFields');
    const nextFields = checked
      ? Array.from(new Set([...currentFields, field]))
      : currentFields.filter((value) => value !== field);

    form.setValue('settings.requiredBuyerFields', nextFields, { shouldDirty: true, shouldValidate: true });
  }

  function resetToSavedData(data: PaymentLinkFormData) {
    form.reset(data, { keepDefaultValues: false });
  }

  return {
    form,
    currentStep,
    amountCents,
    effectiveMinAmount,
    effectiveMaxAmount,
    isAmountOutOfRange,
    enabledMethods,
    billing,
    settings,
    visual,
    product,
    hasUnsavedChanges: form.formState.isDirty,
    submitError,
    stepError,
    setSubmitError,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    getAllValidationErrors,
    toggleMethods,
    setBillingField,
    setSettingsField,
    setVisualField,
    setProductField,
    toggleBuyerField,
    resetToSavedData,
  };
}
