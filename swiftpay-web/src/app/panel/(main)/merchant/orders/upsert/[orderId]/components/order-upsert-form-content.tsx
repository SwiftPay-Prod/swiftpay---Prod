'use client';

import { useState, useEffect, useActionState, useDeferredValue, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button, TextField, Input, Label, Chip, Skeleton, Dropdown } from '@heroui/react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Icon } from '@/components/ui/icon';
import {
  Alert01Icon,
  CancelCircleIcon,
  InformationCircleIcon,
  ShoppingCartAdd01Icon,
  Delete02Icon,
  Add01Icon,
  MinusSignIcon,
  CheckmarkCircle02Icon,
  UserCircleIcon,
  ShoppingCart01Icon,
  DeliveryTruck01Icon,
  TextIcon,
  MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import { createMerchantOrder, getMerchantOrder, cancelOrder, updateOrderFulfillment } from '@/app/actions/merchant/orders';
import { listMerchantCustomers } from '@/app/actions/merchant/customers';
import { listMerchantProducts, getMerchantProduct } from '@/app/actions/merchant/products';
import { formatCurrency, formattedCurrencyToCents } from '@/utils/currency';
import { CurrencyCentsInput } from '@/components/ui/currency-cents-input';
import { AsyncButton } from '@/components/ui/async-button';
import { AsyncAutocomplete } from '@/components/ui/async-autocomplete';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { SectionAccordion as SystemAccordion } from '@/components/ui/system-accordion';
import { ReviewIssuesAlert } from '@/components/ui/review-step-layout';
import { toast } from '@heroui/react';
import { ProductStatus, OrderStatus, CustomerStatus, OrderFulfillmentStatus } from '@/types/enums';
import { useMerchant } from '@/contexts/merchant-context';
import { Routes } from '@/router/routes';
import {
  orderStatusParse,
  orderFulfillmentStatusParse,
  orderFulfillmentStatusOptions,
  mapParseColorToChipColor,
  mapParseColorToTextClass,
} from '@/parse';
import type { MinimalCustomer } from '@/types/merchant/customers';
import type { MinimalProductData, ProductVariantData, ProductData } from '@/types/merchant/products';
import {
  orderUpsertFormSchema,
  type OrderItemFormData,
  type OrderUpsertFormData,
} from './order-upsert-form-schema';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDER_STEPS = [
  { title: 'Cliente', description: 'Selecione o cliente', isRequired: true },
  { title: 'Itens', description: 'Adicione produtos ao pedido', isRequired: true },
  { title: 'Entrega e detalhes', description: 'Desconto, frete e observacoes' },
  { title: 'Revisao', description: 'Revise antes de enviar' },
];

const TERMINAL_ORDER_STATUS: OrderStatus[] = [
  OrderStatus.Cancelled,
  OrderStatus.Completed,
  OrderStatus.Expired,
  OrderStatus.Refunded,
];

const EMPTY_ORDER_ITEMS: OrderItemFormData[] = [];

interface FormState {
  error: string | null;
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
      <SystemAccordion.Item id={params.id} className="rounded-xl border border-divider bg-surface">
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

function collectValidationMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object') return [];

  const values = Object.values(errors as Record<string, unknown>);
  const messages = values.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const maybeMessage = (value as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      return [maybeMessage];
    }
    return collectValidationMessages(value);
  });

  return [...new Set(messages)];
}

export function OrderUpsertFormContent() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const formRef = useRef<HTMLFormElement>(null);

  const isNewMode = orderId === 'new';
  const isEditMode = !isNewMode;
  const isValidId = isNewMode || UUID_REGEX.test(orderId);

  const { selectedMerchant } = useMerchant();
  const merchantId = selectedMerchant?.id;

  const [selectedCustomer, setSelectedCustomer] = useState<MinimalCustomer | null>(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [fetchedCustomerOptions, setFetchedCustomerOptions] = useState<MinimalCustomer[]>([]);
  const [lastCompletedCustomerSearch, setLastCompletedCustomerSearch] = useState<string | null>(null);
  const [isCustomerAutocompleteOpen, setIsCustomerAutocompleteOpen] = useState(false);
  const [isPreloadingCustomers, setIsPreloadingCustomers] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [fetchedProductOptions, setFetchedProductOptions] = useState<MinimalProductData[]>([]);
  const [lastCompletedProductSearch, setLastCompletedProductSearch] = useState<string | null>(null);
  const [isProductAutocompleteOpen, setIsProductAutocompleteOpen] = useState(false);
  const [isPreloadingProducts, setIsPreloadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [orderFulfillment, setOrderFulfillment] = useState<string>('');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);

  const [hasValidatedReview, setHasValidatedReview] = useState(false);

  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const deferredProductSearch = useDeferredValue(productSearch);

  const defaultValues = useMemo<OrderUpsertFormData>(
    () => ({
      customerId: null,
      items: [],
      couponCode: '',
      shippingAmountFormatted: '',
      notes: '',
    }),
    []
  );

  const form = useForm<OrderUpsertFormData>({
    resolver: zodResolver(orderUpsertFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    control,
    getValues,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = form;

  const watchedOrderItems = useWatch({ control, name: 'items' });
  const orderItems = watchedOrderItems ?? EMPTY_ORDER_ITEMS;
  const couponCode = useWatch({ control, name: 'couponCode' }) ?? '';
  const shippingAmountFormatted = useWatch({ control, name: 'shippingAmountFormatted' }) ?? '';
  const notes = useWatch({ control, name: 'notes' }) ?? '';

  const isDebounceCustomers = customerSearch.trim().length >= 1 && customerSearch !== deferredCustomerSearch;
  const isFetchingCustomers = deferredCustomerSearch.trim().length >= 1 && deferredCustomerSearch !== lastCompletedCustomerSearch;
  const isSearchingCustomers = isDebounceCustomers || isFetchingCustomers;
  const isLoadingCustomers = isSearchingCustomers || isPreloadingCustomers;

  const isDebounceProducts = productSearch.trim().length >= 1 && productSearch !== deferredProductSearch;
  const isFetchingProducts = deferredProductSearch.trim().length >= 1 && deferredProductSearch !== lastCompletedProductSearch;
  const isSearchingProducts = isDebounceProducts || isFetchingProducts;
  const isLoadingProducts = isSearchingProducts || isLoadingProduct || isPreloadingProducts;

  const customerOptions = fetchedCustomerOptions;
  const productOptions = fetchedProductOptions;

  useEffect(() => {
    if (!isValidId) {
      router.replace(Routes.panel.merchant.orders);
    }
  }, [isValidId, router]);

  useEffect(() => {
    if (!isEditMode || !merchantId || !isValidId) return;

    const currentMerchantId = merchantId;
    let cancelled = false;

    async function loadOrder() {
      setIsLoadingOrder(true);
      const response = await getMerchantOrder(currentMerchantId, orderId);

      if (cancelled) return;

      if (response?.error || !response?.data) {
        setOrderLoadError(response?.error?.message ?? 'Nao foi possivel carregar o pedido.');
        setIsLoadingOrder(false);
        return;
      }

      const order = response.data;
      const hydratedCustomer = order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            email: order.customer.email ?? '',
            document: order.customer.document ?? null,
            phone: order.customer.phone ?? null,
            documentType: null,
            status: CustomerStatus.Active,
            externalId: null,
            address: null,
            paymentsCount: 0,
            createdAt: order.createdAt,
          }
        : null;

      setSelectedCustomer(hydratedCustomer);

      reset({
        customerId: hydratedCustomer?.id ?? null,
        items: order.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          price: item.unitPrice,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        couponCode: order.couponCode ?? '',
        shippingAmountFormatted: order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : '',
        notes: order.notes ?? '',
      });

      setOrderStatus(order.status);
      setOrderFulfillment(order.fulfillmentStatus);
      setIsLoadingOrder(false);
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, isValidId, merchantId, orderId, reset]);

  useEffect(() => {
    if (!merchantId || isEditMode) return;
    const term = deferredCustomerSearch.trim();
    if (term.length < 1) return;

    let cancelled = false;

    listMerchantCustomers(merchantId, {
      search: term,
      pageSize: 10,
    }).then((response) => {
      if (!cancelled) {
        setFetchedCustomerOptions(response?.data?.items ?? []);
        setLastCompletedCustomerSearch(term);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deferredCustomerSearch, merchantId, isEditMode]);

  useEffect(() => {
    if (!merchantId || isEditMode) return;
    const term = deferredProductSearch.trim();
    if (term.length < 1) return;

    let cancelled = false;

    listMerchantProducts(merchantId, {
      search: term,
      pageSize: 10,
      status: ProductStatus.Active,
    }).then((response) => {
      if (!cancelled) {
        setFetchedProductOptions(response?.data?.items ?? []);
        setLastCompletedProductSearch(term);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deferredProductSearch, merchantId, isEditMode]);

  function handleCustomerAutocompleteOpenChange(isOpen: boolean) {
    setIsCustomerAutocompleteOpen(isOpen);

    if (!isOpen || !merchantId || isEditMode) return;

    const term = customerSearch.trim();
    if (term.length > 0) return;
    if (lastCompletedCustomerSearch === '' && fetchedCustomerOptions.length > 0) return;

    setIsPreloadingCustomers(true);
    listMerchantCustomers(merchantId, {
      pageSize: 10,
    }).then((response) => {
      setFetchedCustomerOptions(response?.data?.items ?? []);
      setLastCompletedCustomerSearch('');
      setIsPreloadingCustomers(false);
    });
  }

  function handleProductAutocompleteOpenChange(isOpen: boolean) {
    setIsProductAutocompleteOpen(isOpen);

    if (!isOpen || !merchantId || isEditMode) return;

    const term = productSearch.trim();
    if (term.length > 0) return;
    if (lastCompletedProductSearch === '' && fetchedProductOptions.length > 0) return;

    setIsPreloadingProducts(true);
    listMerchantProducts(merchantId, {
      pageSize: 10,
      status: ProductStatus.Active,
    }).then((response) => {
      setFetchedProductOptions(response?.data?.items ?? []);
      setLastCompletedProductSearch('');
      setIsPreloadingProducts(false);
    });
  }

  async function handleProductSelect(key: string | number | null) {
    if (!key || !merchantId || isEditMode) {
      setSelectedProduct(null);
      setSelectedVariant(null);
      setProductSearch('');
      return;
    }

    setIsLoadingProduct(true);
    const response = await getMerchantProduct(merchantId, key as string);
    setIsLoadingProduct(false);

    if (response?.data) {
      setSelectedProduct(response.data);
      setProductSearch(response.data.name);
      const firstVariant = response.data.variants[0];
      if (response.data.variants.length === 1 && firstVariant) {
        setSelectedVariant(firstVariant);
      } else {
        setSelectedVariant(null);
      }
    }
  }

  function handleAddItem() {
    if (!selectedProduct || isEditMode) return;

    const price = selectedVariant?.price ?? selectedProduct.price ?? 0;
    const imageUrl = selectedVariant?.imageUrl ?? selectedProduct.imageUrl;

    const newItem: OrderItemFormData = {
      productId: selectedProduct.id,
      variantId: selectedVariant?.id ?? null,
      productName: selectedProduct.name,
      variantName: selectedVariant?.name ?? null,
      price,
      quantity: productQuantity,
      imageUrl,
    };

    setValue('items', [...orderItems, newItem], { shouldDirty: true, shouldValidate: true });
    setSelectedProduct(null);
    setSelectedVariant(null);
    setProductSearch('');
    setProductQuantity(1);
  }

  function handleRemoveItem(index: number) {
    if (isEditMode) return;
    setValue(
      'items',
      orderItems.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function handleUpdateItemQuantity(index: number, delta: number) {
    if (isEditMode) return;

    setValue(
      'items',
      orderItems.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function handleCustomerSelect(key: string | number | null) {
    if (isEditMode) return;

    if (!key) {
      setSelectedCustomer(null);
      setCustomerSearch('');
      setValue('customerId', null, { shouldDirty: true, shouldValidate: true });
      return;
    }
    const customer = customerOptions.find((c) => c.id === key);
    setSelectedCustomer(customer || null);
    setCustomerSearch(customer?.name ?? '');
    setValue('customerId', customer?.id ?? null, { shouldDirty: true, shouldValidate: true });
  }

  function handleRemoveCustomer() {
    if (isEditMode) return;
    setSelectedCustomer(null);
    setCustomerSearch('');
    setValue('customerId', null, { shouldDirty: true, shouldValidate: true });
  }

  const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);
  const shippingCents = formattedCurrencyToCents(shippingAmountFormatted) ?? 0;
  const total = subtotal + shippingCents;

  const reviewValidationErrors = useMemo(() => {
    const errorsList: string[] = [];
    if (!merchantId) errorsList.push('Selecione um merchant para continuar.');
    if (!selectedCustomer) errorsList.push('Selecione um cliente.');
    if (orderItems.length === 0) errorsList.push('Adicione pelo menos um item.');
    return [...new Set(errorsList)];
  }, [merchantId, orderItems.length, selectedCustomer]);

  const formValidationErrors = useMemo(() => collectValidationMessages(errors), [errors]);

  const stepDefinitions = isEditMode
    ? ORDER_STEPS.filter((step) => step.title !== 'Revisao')
    : ORDER_STEPS;
  const wizardSteps = useMemo(
    () =>
      stepDefinitions.map((step, index) => {
        if (index === 0) {
          return { ...step, isCompleted: selectedCustomer != null };
        }

        if (index === 1) {
          return { ...step, isCompleted: orderItems.length > 0 };
        }

        return step;
      }),
    [orderItems.length, selectedCustomer, stepDefinitions]
  );

  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState): Promise<FormState> => {
      if (isEditMode) {
        return { error: 'Esta tela nao envia edicao de pedido.' };
      }

      const isValid = await trigger();
      if (!isValid) {
        return { error: 'Preencha os campos obrigatorios para continuar.' };
      }

      if (!merchantId) return { error: 'Selecione um merchant' };
      if (!selectedCustomer) return { error: 'Selecione um cliente' };
      if (orderItems.length === 0) return { error: 'Adicione pelo menos um item' };

      const values = getValues();

      const res = await createMerchantOrder(merchantId, {
        customerId: selectedCustomer.id,
        items: values.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        couponCode: values.couponCode.trim() || undefined,
        shippingAmount: shippingCents || undefined,
        notes: values.notes.trim() || undefined,
      });

      if (res?.error) return { error: res.error.message || 'Erro ao criar pedido' };

      reset(defaultValues);

      toast('Pedido criado', {
        description: res?.message || 'O pedido foi criado com sucesso.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });
      router.push(Routes.panel.merchant.orders);
      return { error: null };
    },
    { error: null }
  );

  async function handleCancelOrder() {
    if (!merchantId || !isEditMode || !orderId) return;

    setIsCancellingOrder(true);
    const response = await cancelOrder(merchantId, orderId);
    setIsCancellingOrder(false);

    if (response?.error) {
      toast('Erro ao cancelar pedido', {
        description: response.error.message ?? 'Nao foi possivel cancelar o pedido.',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        variant: 'danger',
      });
      return;
    }

    toast('Pedido cancelado', {
      description: response?.message ?? 'O pedido foi cancelado com sucesso.',
      indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      variant: 'success',
    });

    router.push(Routes.panel.merchant.orders);
  }

  async function handleFulfillmentChange(status: OrderFulfillmentStatus) {
    if (!merchantId || !isEditMode || !orderId || !orderFulfillment || isUpdatingFulfillment) return;
    if (orderFulfillment === status) return;

    setIsUpdatingFulfillment(true);
    const response = await updateOrderFulfillment(merchantId, orderId, status);
    setIsUpdatingFulfillment(false);

    if (response?.error) {
      toast('Erro ao atualizar entrega', {
        description: response.error.message ?? 'Não foi possível atualizar o status de entrega.',
        indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
        variant: 'danger',
      });
      return;
    }

    setOrderFulfillment(status);
    toast('Entrega atualizada', {
      description: `Status de entrega alterado para "${orderFulfillmentStatusParse[status].label}".`,
      indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
      variant: 'success',
    });
  }

  async function handleReviewSubmit() {
    setHasValidatedReview(true);

    const isValid = await trigger();
    if (!isValid) {
      toast('Erro de validacao', {
        description: collectValidationMessages(errors)[0] ?? 'Preencha os campos obrigatorios.',
        indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
        variant: 'danger',
      });
      return;
    }

    if (reviewValidationErrors.length > 0) {
      toast('Erro de validacao', {
        description: reviewValidationErrors[0],
        indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
        variant: 'danger',
      });
      return;
    }

    formRef.current?.requestSubmit();
  }

  const hasVariants = selectedProduct && selectedProduct.variants.length > 0;
  const canAddItem = selectedProduct && (!hasVariants || selectedVariant);
  const lastStepIndex = stepDefinitions.length - 1;

  const customerSummary = selectedCustomer
    ? `${selectedCustomer.name} - ${selectedCustomer.email ?? selectedCustomer.document ?? 'Sem contato'}`
    : 'Cliente nao selecionado';

  const itemsSummary = orderItems.length > 0
    ? `${orderItems.length} item(ns) - ${formatCurrency(subtotal)}`
    : 'Nenhum item adicionado';

  const deliverySummary = [
    couponCode.trim() ? `Cupom: ${couponCode.trim()}` : null,
    shippingCents > 0 ? `Frete: ${formatCurrency(shippingCents)}` : 'Sem frete',
    notes.trim() ? 'Com observacoes' : null,
  ]
    .filter((item): item is string => !!item)
    .join(' - ');

  const quickSummary = [
    selectedCustomer?.name ?? 'Sem cliente',
    `${orderItems.length} item(ns)`,
    formatCurrency(total),
  ].join(' - ');

  const canCancelOrder =
    isEditMode &&
    !!orderStatus &&
    !TERMINAL_ORDER_STATUS.includes(orderStatus);

  if (!isValidId) {
    return null;
  }

  if (!merchantId) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted">Selecione um merchant para continuar</p>
      </div>
    );
  }

  if (isEditMode && isLoadingOrder) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isEditMode && orderLoadError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-danger">{orderLoadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormPageHeader
        icon={<Icon icon={ShoppingCartAdd01Icon} className="icon-md text-accent" />}
        title={isEditMode ? 'Editar Pedido' : 'Novo Pedido'}
        description={
          isEditMode
            ? 'Revise os dados do pedido e execute as acoes disponiveis.'
            : 'Crie um novo pedido para sua organizacao.'
        }
        meta={quickSummary}
        backLabel="Voltar"
        onBack={() => router.back()}
        actions={
          isEditMode ? (
            <div className="flex items-center gap-2">
              {orderStatus && (
                <Chip variant="soft" color={mapParseColorToChipColor(orderStatusParse[orderStatus].color)} size="sm" className="gap-1">
                  {orderStatusParse[orderStatus].icon}
                  {orderStatusParse[orderStatus].label}
                </Chip>
              )}
              {orderFulfillment && (
                <Chip
                  variant="soft"
                  color={mapParseColorToChipColor(orderFulfillmentStatusParse[orderFulfillment as keyof typeof orderFulfillmentStatusParse].color)}
                  size="sm"
                  className="gap-1"
                >
                  {orderFulfillmentStatusParse[orderFulfillment as keyof typeof orderFulfillmentStatusParse].icon}
                  {orderFulfillmentStatusParse[orderFulfillment as keyof typeof orderFulfillmentStatusParse].label}
                </Chip>
              )}
              {canCancelOrder && (
                <AsyncButton
                  variant="danger"
                  isPending={isCancellingOrder}
                  onPress={handleCancelOrder}
                >
                  <Icon icon={CancelCircleIcon} className="icon-sm" />
                  Cancelar pedido
                </AsyncButton>
              )}
              <Dropdown>
                <Button variant="tertiary" isDisabled={isCancellingOrder || isUpdatingFulfillment}>
                  <Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
                  Ações
                </Button>
                <Dropdown.Popover className="min-w-56">
                  <Dropdown.Menu aria-label="Ações do pedido">
                    {canCancelOrder && (
                      <Dropdown.Item id="cancel-order" textValue="Cancelar pedido" className="text-danger" onPress={() => void handleCancelOrder()}>
                        <Icon icon={CancelCircleIcon} className="icon-xs text-danger" />
                        Cancelar pedido
                      </Dropdown.Item>
                    )}
                    {orderFulfillmentStatusOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        id={`fulfillment-${option.value}`}
                        textValue={option.label}
                        isDisabled={orderFulfillment === option.value || isUpdatingFulfillment}
                        onPress={() => void handleFulfillmentChange(option.value)}
                      >
                        <div className={`flex items-center gap-2 ${mapParseColorToTextClass(option.color)}`}>
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          ) : undefined
        }
      />

      <WizardStepper
        steps={wizardSteps}
        currentStep={currentStep}
        mode={isEditMode ? 'editor' : 'wizard'}
        onStepClick={(step) => {
          if (!isEditMode && step === lastStepIndex) {
            setHasValidatedReview(true);
          }
          setCurrentStep(step);
        }}
        onBack={currentStep > 0 ? () => setCurrentStep((s) => s - 1) : undefined}
        onNext={
          currentStep < lastStepIndex
            ? () => {
                const nextStep = currentStep + 1;
                if (!isEditMode && nextStep === lastStepIndex) {
                  setHasValidatedReview(true);
                }
                setCurrentStep(nextStep);
              }
            : undefined
        }
        submitSlot={
          !isEditMode && currentStep === lastStepIndex ? (
            <AsyncButton
              isPending={isPending}
              isDisabled={reviewValidationErrors.length > 0 || formValidationErrors.length > 0}
              onPress={handleReviewSubmit}
            >
              <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
              Criar pedido
            </AsyncButton>
          ) : null
        }
      />

      <form ref={formRef} id="order-form" action={formAction} className="flex flex-col gap-6">
        {currentStep === 0 &&
          renderAccordionCard({
            id: 'customer',
            icon: UserCircleIcon,
            title: 'Cliente',
            summary: customerSummary,
            children: isEditMode ? (
              <div className="rounded-lg border border-divider bg-surface-secondary p-3">
                <p className="text-sm font-medium">{selectedCustomer?.name ?? 'Cliente nao informado'}</p>
                <p className="text-xs text-muted">{selectedCustomer?.email ?? selectedCustomer?.document ?? '-'}</p>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <AsyncAutocomplete
                  label="Cliente"
                  placeholder="Selecione um cliente"
                  searchPlaceholder="Digite para buscar clientes"
                  searchValue={customerSearch}
                  minSearchLength={0}
                  onSearchChange={setCustomerSearch}
                  isLoading={isLoadingCustomers}
                  optionVariant="card"
                  isOpen={isCustomerAutocompleteOpen}
                  onOpenChange={handleCustomerAutocompleteOpenChange}
                  options={customerOptions.map((customer) => ({
                    key: customer.id,
                    label: customer.name,
                    description: customer.email ?? customer.document ?? null,
                  }))}
                  value={selectedCustomer?.id ?? null}
                  emptyMessage="Nenhum cliente encontrado"
                  onChange={(key) => handleCustomerSelect(key)}
                  className="flex-1"
                />
                {selectedCustomer && (
                  <Button variant="danger-soft" size="sm" onPress={handleRemoveCustomer}>
                    <Icon icon={CancelCircleIcon} size={18} />
                  </Button>
                )}
              </div>
            ),
          })}

        {currentStep === 1 &&
          renderAccordionCard({
            id: 'items',
            icon: ShoppingCart01Icon,
            title: 'Itens do pedido',
            summary: itemsSummary,
            children: (
              <div className="flex flex-col gap-4">
                {!isEditMode && (
                  <div className="flex flex-col gap-3 rounded-lg">
                    <AsyncAutocomplete
                      label="Buscar produto"
                      placeholder="Selecione um produto"
                      searchPlaceholder="Digite para buscar produtos"
                      searchValue={productSearch}
                      minSearchLength={0}
                      onSearchChange={setProductSearch}
                      isLoading={isLoadingProducts}
                      optionVariant="card"
                      isOpen={isProductAutocompleteOpen}
                      onOpenChange={handleProductAutocompleteOpenChange}
                      options={productOptions.map((product) => ({
                        key: product.id,
                        label: product.name,
                        description: product.price ? formatCurrency(product.price) : 'Variacoes disponiveis',
                      }))}
                      value={selectedProduct?.id ?? null}
                      emptyMessage="Nenhum produto encontrado"
                      onChange={(key) => handleProductSelect(key)}
                    />

                    {selectedProduct && (
                      <div className="flex flex-col gap-3 rounded-lg border border-divider p-3">
                        <div className="flex items-center gap-3">
                          {selectedProduct.imageUrl && (
                            <Image
                              src={selectedProduct.imageUrl}
                              alt={selectedProduct.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                            {selectedProduct.price && (
                              <p className="text-xs text-muted">{formatCurrency(selectedProduct.price)}</p>
                            )}
                          </div>
                        </div>

                        {hasVariants && (
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.variants.map((variant) => (
                              <Button
                                key={variant.id}
                                size="sm"
                                variant={selectedVariant?.id === variant.id ? 'primary' : 'secondary'}
                                onPress={() => setSelectedVariant(variant)}
                              >
                                {variant.name} - {formatCurrency(variant.price)}
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button isIconOnly variant="tertiary" size="sm" onPress={() => setProductQuantity((q) => Math.max(1, q - 1))}>
                              <Icon icon={MinusSignIcon} className="icon-xs" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{productQuantity}</span>
                            <Button isIconOnly variant="tertiary" size="sm" onPress={() => setProductQuantity((q) => q + 1)}>
                              <Icon icon={Add01Icon} className="icon-xs" />
                            </Button>
                          </div>
                          <Button variant="primary" size="sm" isDisabled={!canAddItem} onPress={handleAddItem}>
                            <Icon icon={Add01Icon} className="icon-xs" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {orderItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {orderItems.map((item, index) => (
                      <div key={`${item.productId}-${item.variantId ?? 'no-variant'}-${index}`} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          {item.variantName && <p className="text-xs text-muted truncate">{item.variantName}</p>}
                          <p className="text-xs text-muted">{formatCurrency(item.price)} cada</p>
                        </div>
                        {!isEditMode && (
                          <div className="flex items-center gap-2">
                            <Button isIconOnly variant="tertiary" size="sm" onPress={() => handleUpdateItemQuantity(index, -1)}>
                              <Icon icon={MinusSignIcon} className="icon-xs" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <Button isIconOnly variant="tertiary" size="sm" onPress={() => handleUpdateItemQuantity(index, 1)}>
                              <Icon icon={Add01Icon} className="icon-xs" />
                            </Button>
                          </div>
                        )}
                        {isEditMode && <span className="text-sm text-muted">x{item.quantity}</span>}
                        <span className="text-sm font-medium w-20 text-right shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                        {!isEditMode && (
                          <Button isIconOnly variant="danger-soft" size="sm" onPress={() => handleRemoveItem(index)}>
                            <Icon icon={Delete02Icon} className="icon-sm" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Nenhum item adicionado ao pedido.</p>
                )}
              </div>
            ),
          })}

        {currentStep === 2 &&
          renderAccordionCard({
            id: 'delivery',
            icon: DeliveryTruck01Icon,
            title: 'Entrega e detalhes',
            summary: deliverySummary || 'Sem configuracoes adicionais',
            children: (
              <div className="flex flex-col gap-4">
                {isEditMode ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-divider p-3">
                      <p className="text-xs text-muted">Cupom</p>
                      <p className="text-sm font-medium">{couponCode || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-divider p-3">
                      <p className="text-xs text-muted">Frete</p>
                      <p className="text-sm font-medium">{formatCurrency(shippingCents)}</p>
                    </div>
                    <div className="rounded-lg border border-divider p-3 lg:col-span-2">
                      <p className="text-xs text-muted">Observacoes</p>
                      <p className="text-sm font-medium">{notes || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <TextField variant="secondary" aria-label="Cupom de desconto">
                        <Label>Cupom de desconto (opcional)</Label>
                        <Input
                          variant="secondary"
                          placeholder="CUPOM10"
                          value={couponCode}
                          onChange={(e) => setValue('couponCode', e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
                        />
                      </TextField>

                      <TextField variant="secondary" aria-label="Valor do frete">
                        <Label>Frete (opcional)</Label>
                        <CurrencyCentsInput
                          variant="secondary"
                          placeholder="R$ 0,00"
                          onValueChange={(v) => setValue('shippingAmountFormatted', v, { shouldDirty: true, shouldValidate: true })}
                        />
                      </TextField>
                    </div>

                    <TextField variant="secondary" aria-label="Observacoes">
                      <Label>Observacoes (opcional)</Label>
                      <Input
                        variant="secondary"
                        placeholder="Observacoes do pedido..."
                        value={notes}
                        onChange={(e) => setValue('notes', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      />
                    </TextField>
                  </>
                )}
              </div>
            ),
          })}

        {!isEditMode && currentStep === lastStepIndex && (
          <>
            {!isEditMode && hasValidatedReview && (reviewValidationErrors.length > 0 || formValidationErrors.length > 0) && (
              <ReviewIssuesAlert
                issues={[...reviewValidationErrors, ...formValidationErrors]}
                title="Corrija os itens abaixo:"
              />
            )}
            {renderAccordionCard({
              id: 'review',
              icon: TextIcon,
              title: 'Revisao do pedido',
              summary:
                isEditMode
                  ? 'Pedido carregado para consulta e acoes'
                  : reviewValidationErrors.length > 0 || formValidationErrors.length > 0
                    ? `${reviewValidationErrors.length + formValidationErrors.length} pendencia(s)`
                    : 'Tudo pronto para criar',
              children: (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg bg-surface-secondary p-4">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      {couponCode && (
                        <div className="flex justify-between">
                          <span className="text-muted">Cupom ({couponCode}):</span>
                          <span className="font-medium text-success">Aplicado no checkout</span>
                        </div>
                      )}
                      {shippingCents > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">Frete:</span>
                          <span className="font-medium">{formatCurrency(shippingCents)}</span>
                        </div>
                      )}
                      <div className="border-t border-divider pt-2 mt-1">
                        <div className="flex justify-between">
                          <span className="font-medium">Total estimado:</span>
                          <span className="font-bold text-lg">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3">
                    <Icon icon={InformationCircleIcon} className="icon-sm shrink-0 text-info mt-0.5" />
                    <p className="text-xs text-muted">
                      {isEditMode
                        ? 'No modo de edicao, as acoes do pedido ficam disponiveis no cabecalho da pagina.'
                        : 'Um QR Code PIX sera gerado automaticamente para o pedido. O desconto do cupom sera calculado no momento da criacao.'}
                    </p>
                  </div>

                  {state.error && (
                    <div className="flex items-center gap-2 text-sm text-danger p-4 bg-danger/10 rounded-lg">
                      <Icon icon={Alert01Icon} className="icon-sm" />
                      <span>{state.error}</span>
                    </div>
                  )}
                </div>
              ),
            })}
          </>
        )}
      </form>
    </div>
  );
}
