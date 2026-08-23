'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Form,
  Input,
  InputGroup,
  Label,
  Select,
  ListBox,
  Chip,
  Spinner,
  TextField,
  TextArea,
  FieldError,
  toast,
} from '@heroui/react';
import { PatternFormat } from 'react-number-format';
import {
  UserIcon,
  MapPinIcon,
  Settings02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { AsyncButton } from '@/components/ui/async-button';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { SectionAccordion as SystemAccordion } from '@/components/ui/system-accordion';
import { ReviewIssuesAlert } from '@/components/ui/review-step-layout';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { createCustomer, updateCustomer } from '@/app/actions/merchant/customers';
import { fetchAddressByCep } from '@/app/actions/address';
import { DeleteCustomerModal } from '@/app/panel/(main)/merchant/customers/modals/delete-customer-modal';
import { customerStatusParse, customerDocumentTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatDocument, formatCep, cepFormat, getDocumentFormat, normalizePhoneToE164 } from '@/utils/input-masks';
import { isValidCEP } from '@/utils/validations';
import { Routes } from '@/router/routes';
import { CustomerDocumentType, type CustomerStatus, type PaymentEnvironment } from '@/types/enums';
import type { CustomerData, MinimalCustomer } from '@/types/merchant/customers';
import { customerFormSchema, type CustomerFormValues } from './customer-form-schema';

interface CustomerUpsertFormContentProps {
  merchantId: string;
  environment: PaymentEnvironment;
  customer?: CustomerData;
}

const CUSTOMER_STEPS = [
  { title: 'Dados Pessoais', description: 'Informacoes do cliente', isRequired: true },
  { title: 'Endereco', description: 'Dados de localizacao' },
  { title: 'Configuracoes', description: 'ID externo e metadata' },
  { title: 'Revisao', description: 'Revise antes de salvar' },
];

function createDefaultValues(customer?: CustomerData): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    externalId: customer?.externalId ?? '',
    documentType: customer?.documentType ?? null,
    document: customer?.document?.replace(/\D/g, '') ?? '',
    phone: normalizePhoneToE164(customer?.phone) ?? '',
    metadata: customer?.metadata ?? '',
    status: customer?.status ?? null,
    address: {
      postalCode: customer?.address?.postalCode ? formatCep(customer.address.postalCode) : '',
      street: customer?.address?.street ?? '',
      number: customer?.address?.number ?? '',
      complement: customer?.address?.complement ?? '',
      neighborhood: customer?.address?.neighborhood ?? '',
      city: customer?.address?.city ?? '',
      state: customer?.address?.state ?? '',
      country: customer?.address?.country ?? 'BR',
    },
  };
}

function cleanValue(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function CustomerUpsertFormContent({ merchantId, environment, customer }: CustomerUpsertFormContentProps) {
  const router = useRouter();
  const isEditMode = !!customer;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasValidatedReview, setHasValidatedReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: createDefaultValues(customer),
    mode: 'onChange',
  });

  const {
    control,
    reset,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { isDirty, errors },
  } = form;

  useEffect(() => {
    reset(createDefaultValues(customer));
  }, [customer, reset]);

  const stepDefinitions = isEditMode ? CUSTOMER_STEPS.filter((step) => step.title !== 'Revisao') : CUSTOMER_STEPS;
  const lastStepIndex = stepDefinitions.length - 1;

  const values = useWatch({ control }) as CustomerFormValues;
  const cityValue = useWatch({ control, name: 'address.city' });
  const stateValue = useWatch({ control, name: 'address.state' });
  const countryValue = useWatch({ control, name: 'address.country' });
  const streetValue = useWatch({ control, name: 'address.street' });
  const numberValue = useWatch({ control, name: 'address.number' });
  const complementValue = useWatch({ control, name: 'address.complement' });
  const neighborhoodValue = useWatch({ control, name: 'address.neighborhood' });
  const selectedStatus = useWatch({ control, name: 'status' }) as CustomerStatus | null | undefined;
  const selectedDocumentType = useWatch({ control, name: 'documentType' }) as CustomerDocumentType | null | undefined;

  const cepLoaded = useMemo(() => !!(cityValue && stateValue), [cityValue, stateValue]);
  const defaultPhoneCountry = useMemo(() => {
    const addressCountry = countryValue?.trim().toLowerCase();
    return addressCountry && addressCountry.length === 2 ? addressCountry : 'br';
  }, [countryValue]);

  const reviewValidationErrors = useMemo(() => {
    const reviewErrors: string[] = [];
    if (errors.name?.message) reviewErrors.push(String(errors.name.message));
    if (errors.email?.message) reviewErrors.push(String(errors.email.message));
    return [...new Set(reviewErrors)];
  }, [errors.email?.message, errors.name?.message]);

  const wizardSteps = useMemo(
    () =>
      stepDefinitions.map((step, index) => {
        if (index === 0) {
          return {
            ...step,
            isCompleted: values.name.trim().length > 0 && values.email.trim().length > 0,
          };
        }

        return step;
      }),
    [stepDefinitions, values.email, values.name]
  );

  const personalSummary = [values.name.trim() || 'Sem nome', values.email.trim() || 'Sem e-mail'].join('  ');
  const addressSummary = [values.address.city || null, values.address.state || null, values.address.postalCode || null]
    .filter((item): item is string => !!item)
    .join('  ') || 'Endereco nao informado';
  const configSummary = [
    values.externalId?.trim() ? `ID: ${values.externalId.trim()}` : null,
    selectedStatus ? customerStatusParse[selectedStatus]?.label : null,
  ]
    .filter((item): item is string => !!item)
    .join('  ') || 'Sem configuracoes adicionais';

  async function handleCepChange(value: string) {
    const cleanCep = value.replace(/\D/g, '');
    setValue('address.postalCode', formatCep(cleanCep), { shouldDirty: true });

    if (!isValidCEP(cleanCep)) {
      return;
    }

    setIsFetchingCep(true);
    const result = await fetchAddressByCep(cleanCep);
    setIsFetchingCep(false);

    if (result.success) {
      setValue('address.street', result.data.address, { shouldDirty: true });
      setValue('address.neighborhood', result.data.neighborhood, { shouldDirty: true });
      setValue('address.city', result.data.city, { shouldDirty: true });
      setValue('address.state', result.data.state, { shouldDirty: true });
      setValue('address.complement', result.data.complement ?? getValues('address.complement') ?? '', { shouldDirty: true });
      return;
    }

    toast('CEP nao encontrado', {
      description: result.error,
      indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
      variant: 'danger',
    });

    setValue('address.street', '', { shouldDirty: true });
    setValue('address.neighborhood', '', { shouldDirty: true });
    setValue('address.city', '', { shouldDirty: true });
    setValue('address.state', '', { shouldDirty: true });
  }

  async function onSubmit(data: CustomerFormValues) {
    setFormError(null);

    const cleanDocument = data.document?.replace(/\D/g, '') || undefined;
    const cleanPhone = data.phone?.replace(/\D/g, '') || undefined;
    const cleanPostalCode = data.address.postalCode?.replace(/\D/g, '') || undefined;

    if (isEditMode && customer) {
      const res = await updateCustomer(merchantId, customer.id, {
        name: data.name.trim(),
        email: data.email.trim(),
        externalId: cleanValue(data.externalId),
        document: cleanDocument,
        documentType: data.documentType || undefined,
        phone: cleanPhone,
        status: data.status || undefined,
        metadata: cleanValue(data.metadata),
        environment,
        addressStreet: cleanValue(data.address.street),
        addressNumber: cleanValue(data.address.number),
        addressComplement: cleanValue(data.address.complement),
        addressNeighborhood: cleanValue(data.address.neighborhood),
        addressCity: cleanValue(data.address.city),
        addressState: cleanValue(data.address.state),
        addressPostalCode: cleanPostalCode,
        addressCountry: cleanValue(data.address.country),
      });

      if (res?.error) {
        setFormError(res.error.message ?? 'Erro ao atualizar');
        return;
      }

      toast('Cliente atualizado', {
        description: res?.message || 'As informacoes do cliente foram atualizadas.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });
      reset(data);
      setHasValidatedReview(false);
      router.refresh();
      return;
    }

    const res = await createCustomer(merchantId, {
      name: data.name.trim(),
      email: data.email.trim(),
      externalId: cleanValue(data.externalId),
      document: cleanDocument,
      documentType: data.documentType || undefined,
      phone: cleanPhone,
      metadata: cleanValue(data.metadata),
      environment,
      addressStreet: cleanValue(data.address.street),
      addressNumber: cleanValue(data.address.number),
      addressComplement: cleanValue(data.address.complement),
      addressNeighborhood: cleanValue(data.address.neighborhood),
      addressCity: cleanValue(data.address.city),
      addressState: cleanValue(data.address.state),
      addressPostalCode: cleanPostalCode,
      addressCountry: cleanValue(data.address.country),
    });

    if (res?.error) {
      setFormError(res.error.message ?? 'Erro ao criar');
      return;
    }

    toast('Cliente criado', {
      description: res?.message || 'O cliente foi cadastrado com sucesso.',
      indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      variant: 'success',
    });
    setHasValidatedReview(false);
    router.back();
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const isValid = await trigger();
      if (!isValid) return;
      await handleSubmit(onSubmit)();
    });
  }

  function handleReviewSubmit() {
    setHasValidatedReview(true);
    startTransition(async () => {
      const isValid = await trigger(['name', 'email']);
      if (!isValid) {
        const errorMessage = reviewValidationErrors[0] ?? 'Erro de validacao';
        toast('Erro de validacao', {
          description: errorMessage,
          indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
          variant: 'danger',
        });
        return;
      }

      await handleSubmit(onSubmit)();
    });
  }

  function renderAccordionCard(params: {
    id: string;
    icon: React.ComponentProps<typeof Icon>['icon'];
    title: string;
    summary: string;
    children: React.ReactNode;
  }) {
    return (
      <SystemAccordion defaultExpandedKeys={[params.id]} className="px-0">
        <SystemAccordion.Item id={params.id} className="rounded-xl border border-border bg-surface">
          <SystemAccordion.Heading>
            <SystemAccordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon icon={params.icon} className="icon-md text-accent" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{params.title}</span>
                  <span className="text-xs text-muted">{params.summary}</span>
                </div>
              </div>
              <SystemAccordion.Indicator />
            </SystemAccordion.Trigger>
          </SystemAccordion.Heading>
          <SystemAccordion.Panel>
            <SystemAccordion.Body className="p-4">{params.children}</SystemAccordion.Body>
          </SystemAccordion.Panel>
        </SystemAccordion.Item>
      </SystemAccordion>
    );
  }

  const deleteModalCustomer: MinimalCustomer | null = customer
    ? {
        id: customer.id,
        externalId: customer.externalId,
        name: customer.name,
        email: customer.email,
        document: customer.document,
        documentType: customer.documentType,
        phone: customer.phone,
        status: customer.status,
        address: customer.address,
        paymentsCount: 0,
        createdAt: customer.createdAt,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <FormPageHeader
        title={isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
        description={isEditMode ? 'Atualize as informacoes do cliente' : 'Cadastre um novo cliente para usar em transacoes'}
        backLabel="Voltar"
        onBack={() => router.back()}
        icon={<Icon icon={UserIcon} className="icon-md text-accent" />}
        actions={
          isEditMode ? (
            <Button variant="danger-soft" isDisabled={isPending} onPress={() => setIsDeleteModalOpen(true)}>
              <Icon icon={Delete02Icon} className="icon-sm" />
              Excluir Cliente
            </Button>
          ) : undefined
        }
      />

      {isEditMode && <UnsavedChangesAlert hasChanges={isDirty} onSave={handleSaveEdit} isSaving={isPending} />}

      <WizardStepper
        steps={wizardSteps}
        currentStep={currentStep}
        mode={isEditMode ? 'editor' : 'wizard'}
        onStepClick={(step) => setCurrentStep(step)}
        onBack={currentStep > 0 ? () => setCurrentStep((step) => step - 1) : undefined}
        onNext={
          currentStep < lastStepIndex
            ? () => {
                if (!isEditMode && currentStep + 1 === lastStepIndex) setHasValidatedReview(true);
                setCurrentStep((step) => step + 1);
              }
            : undefined
        }
        submitSlot={
          !isEditMode && currentStep === lastStepIndex ? (
            <AsyncButton variant="primary" isPending={isPending} isDisabled={reviewValidationErrors.length > 0} onPress={handleReviewSubmit}>
              <Icon icon={UserIcon} className="icon-sm" />
              Criar Cliente
            </AsyncButton>
          ) : undefined
        }
      />

      <Form id="customer-form" onSubmit={(event) => event.preventDefault()}>
        {currentStep === 0 &&
          renderAccordionCard({
            id: 'personal',
            icon: UserIcon,
            title: 'Informacoes Basicas',
            summary: personalSummary,
            children: (
              <div className="flex flex-col gap-4">
                <TextField variant="secondary" isRequired>
                  <Label>Nome completo</Label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        variant="secondary"
                        placeholder="Nome do cliente"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                  <FieldError />
                </TextField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField variant="secondary" type="email" isRequired>
                    <Label>E-mail</Label>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <Input
                          variant="secondary"
                          placeholder="email@exemplo.com"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                    <FieldError />
                  </TextField>

                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextField variant="secondary">
                        <Label>Telefone</Label>
                        <InternationalPhoneInput
                          name={field.name}
                          value={field.value}
                          defaultCountry={defaultPhoneCountry}
                          placeholder="Ex: +55 99 91234-5678"
                          onBlur={field.onBlur}
                          onChange={(value) =>
                            field.onChange(normalizePhoneToE164(value ?? '') ?? (value ?? ''))
                          }
                          disabled={isPending}
                        />
                        <FieldError />
                      </TextField>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="documentType"
                    render={({ field }) => (
                      <Select
                        variant="secondary"
                        selectedKey={field.value ?? null}
                        onSelectionChange={(key) => field.onChange((key as CustomerDocumentType) ?? null)}
                      >
                        <Label>Tipo de documento</Label>
                        <Select.Trigger>
                          <Select.Value>{(state) => state.selectedText || 'Selecione...'}</Select.Value>
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {Object.entries(customerDocumentTypeParse).map(([key, value]) => (
                              <ListBox.Item key={key} id={key} textValue={value.label}>
                                {value.label}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <FieldError />
                      </Select>
                    )}
                  />

                  <Controller
                    control={control}
                    name="document"
                    render={({ field }) => (
                      <TextField variant="secondary">
                        <Label>{selectedDocumentType === CustomerDocumentType.CNPJ ? 'CNPJ' : 'CPF'}</Label>
                        <PatternFormat
                          customInput={Input}
                          variant="secondary"
                          format={getDocumentFormat(selectedDocumentType)}
                          mask="_"
                          value={field.value ?? ''}
                          onValueChange={(values) => field.onChange(values.value)}
                          placeholder={
                            selectedDocumentType === CustomerDocumentType.CNPJ
                              ? '00.000.000/0000-00'
                              : '000.000.000-00'
                          }
                          disabled={!selectedDocumentType || isPending}
                        />
                        <FieldError />
                      </TextField>
                    )}
                  />
                </div>

                {isEditMode && (
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        variant="secondary"
                        selectedKey={field.value ?? null}
                        onSelectionChange={(key) => field.onChange((key as CustomerStatus) ?? null)}
                      >
                        <Label>Status</Label>
                        <Select.Trigger>
                          <Select.Value>
                            {() => {
                              if (field.value && customerStatusParse[field.value]) {
                                const parsed = customerStatusParse[field.value];
                                return (
                                  <Chip variant="soft" color={mapParseColorToChipColor(parsed.color)} size="sm" className="gap-1">
                                    {parsed.icon}
                                    {parsed.label}
                                  </Chip>
                                );
                              }
                              return 'Selecione...';
                            }}
                          </Select.Value>
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {Object.entries(customerStatusParse).map(([key, value]) => (
                              <ListBox.Item key={key} id={key} textValue={value.label}>
                                <Chip variant="soft" color={mapParseColorToChipColor(value.color)} size="sm" className="gap-1">
                                  {value.icon}
                                  {value.label}
                                </Chip>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <FieldError />
                      </Select>
                    )}
                  />
                )}
              </div>
            ),
          })}

        {currentStep === 1 &&
          renderAccordionCard({
            id: 'address',
            icon: MapPinIcon,
            title: 'Endereco',
            summary: addressSummary,
            children: (
              <div className="flex flex-col gap-4">
                <Controller
                  control={control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <TextField variant="secondary">
                      <Label>CEP</Label>
                      <InputGroup>
                        <PatternFormat
                          customInput={InputGroup.Input}
                          format={cepFormat}
                          mask="_"
                          value={field.value ?? ''}
                          placeholder="00000-000"
                          onValueChange={(patternValue) => {
                            void handleCepChange(patternValue.value);
                          }}
                        />
                        {isFetchingCep && (
                          <InputGroup.Suffix>
                            <Spinner size="sm" />
                          </InputGroup.Suffix>
                        )}
                      </InputGroup>
                      <FieldError />
                    </TextField>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <TextField variant="secondary" isDisabled={isFetchingCep || (!cepLoaded && !streetValue)}>
                      <Label>Rua</Label>
                      <Controller
                        control={control}
                        name="address.street"
                        render={({ field }) => (
                          <Input
                            variant="secondary"
                            placeholder="Nome da rua"
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        )}
                      />
                      <FieldError />
                    </TextField>
                  </div>

                  <TextField variant="secondary" isDisabled={isFetchingCep || (!cepLoaded && !numberValue)}>
                    <Label>Numero</Label>
                    <Controller
                      control={control}
                      name="address.number"
                      render={({ field }) => (
                        <Input
                          variant="secondary"
                          placeholder="123"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                    <FieldError />
                  </TextField>
                </div>

                <TextField variant="secondary" isDisabled={isFetchingCep || (!cepLoaded && !complementValue)}>
                  <Label>Complemento</Label>
                  <Controller
                    control={control}
                    name="address.complement"
                    render={({ field }) => (
                      <Input
                        variant="secondary"
                        placeholder="Apto, Bloco, etc."
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                  <FieldError />
                </TextField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField variant="secondary" isDisabled={isFetchingCep || (!cepLoaded && !neighborhoodValue)}>
                    <Label>Bairro</Label>
                    <Controller
                      control={control}
                      name="address.neighborhood"
                      render={({ field }) => (
                        <Input
                          variant="secondary"
                          placeholder="Nome do bairro"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                    <FieldError />
                  </TextField>

                  <TextField variant="secondary" isDisabled>
                    <Label>Cidade</Label>
                    <Input variant="secondary" placeholder="Nome da cidade" value={cityValue ?? ''} />
                    <FieldError />
                  </TextField>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField variant="secondary" isDisabled>
                    <Label>Estado</Label>
                    <Input variant="secondary" placeholder="UF" value={stateValue ?? ''} />
                    <FieldError />
                  </TextField>

                  <TextField variant="secondary" isDisabled>
                    <Label>Pais</Label>
                    <Controller
                      control={control}
                      name="address.country"
                      render={({ field }) => (
                        <Input
                          variant="secondary"
                          placeholder="BR"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                    <FieldError />
                  </TextField>
                </div>
              </div>
            ),
          })}

        {currentStep === 2 &&
          renderAccordionCard({
            id: 'config',
            icon: Settings02Icon,
            title: 'Configuracoes',
            summary: configSummary,
            children: (
              <div className="flex flex-col gap-4">
                <TextField variant="secondary">
                  <Label>ID Externo</Label>
                  <Controller
                    control={control}
                    name="externalId"
                    render={({ field }) => (
                      <Input
                        variant="secondary"
                        placeholder="Seu identificador interno"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                  <FieldError />
                </TextField>

                <TextField variant="secondary">
                  <Label>Metadata (JSON)</Label>
                  <Controller
                    control={control}
                    name="metadata"
                    render={({ field }) => (
                      <TextArea
                        variant="secondary"
                        placeholder='{"chave": "valor"}'
                        rows={3}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                  <FieldError />
                </TextField>
              </div>
            ),
          })}

        {!isEditMode && currentStep === lastStepIndex && (
          <div className="flex flex-col gap-4">
            {hasValidatedReview && reviewValidationErrors.length > 0 && (
              <ReviewIssuesAlert issues={reviewValidationErrors} title="Corrija os itens abaixo:" />
            )}

            {renderAccordionCard({
              id: 'review',
              icon: UserIcon,
              title: 'Revisao',
              summary: reviewValidationErrors.length === 0 ? 'Tudo pronto para salvar' : `${reviewValidationErrors.length} pendencia(s)`,
              children: (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted">Confira os dados preenchidos antes de confirmar.</p>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted">Dados pessoais</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-muted">Nome:</span> {values.name.trim() || 'Nao informado'}</p>
                        <p><span className="text-muted">E-mail:</span> {values.email.trim() || 'Nao informado'}</p>
                        <p><span className="text-muted">Telefone:</span> {values.phone?.trim() || 'Nao informado'}</p>
                        <p><span className="text-muted">Tipo doc:</span> {selectedDocumentType ? customerDocumentTypeParse[selectedDocumentType].label : 'Nao informado'}</p>
                        <p>
                          <span className="text-muted">Documento:</span>{' '}
                          {values.document?.trim()
                            ? formatDocument(values.document, selectedDocumentType)
                            : 'Nao informado'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted">Endereco</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-muted">CEP:</span> {values.address.postalCode || 'Nao informado'}</p>
                        <p><span className="text-muted">Rua:</span> {values.address.street || 'Nao informado'}</p>
                        <p><span className="text-muted">Numero:</span> {values.address.number || 'Nao informado'}</p>
                        <p><span className="text-muted">Bairro:</span> {values.address.neighborhood || 'Nao informado'}</p>
                        <p><span className="text-muted">Cidade/UF:</span> {values.address.city || '-'} / {values.address.state || '-'}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted">Configuracoes</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-muted">ID externo:</span> {values.externalId?.trim() || 'Nao informado'}</p>
                        <p><span className="text-muted">Status:</span> {selectedStatus ? customerStatusParse[selectedStatus].label : 'Padrao'}</p>
                        <p><span className="text-muted">Metadata:</span> {values.metadata?.trim() || 'Nao informado'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted">Clique em &quot;Criar Cliente&quot; para confirmar.</p>
                </div>
              ),
            })}
          </div>
        )}
      </Form>

      {formError && (
        <Card>
          <Card.Content>
            <p className="text-sm text-danger">{formError}</p>
          </Card.Content>
        </Card>
      )}

      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        merchantId={merchantId}
        customer={deleteModalCustomer}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          router.push(Routes.panel.merchant.customers);
        }}
      />
    </div>
  );
}
