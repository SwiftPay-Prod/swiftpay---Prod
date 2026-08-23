'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, Button, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import {
	Alert01Icon,
	CheckmarkCircle02Icon,
	Archive01Icon,
	Tag01Icon,
	Coupon01Icon,
	Image01Icon,
	Layers01Icon,
	Dollar01Icon,
	TextIcon,
	Calendar01Icon,
	Delete02Icon,
	CancelCircleIcon,
	MoreHorizontalCircle01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Tick01Icon,
} from '@hugeicons/core-free-icons';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { SectionAccordion as SystemAccordion } from '@/components/ui/system-accordion';
import {
	createMerchantProduct,
	updateMerchantProduct,
	updateMerchantProductStatus,
	createProductVariant,
	deleteProductVariant,
} from '@/app/actions/merchant/products';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { ReviewIssuesAlert, ReviewStepLayout } from '@/components/ui/review-step-layout';
import { CreateVariantInlineModal } from '@/components/merchant/products/modals/create-variant-inline-modal';
import { VariantModal } from '@/components/merchant/products/modals/variant-modal';
import { DeleteProductModal } from '@/components/merchant/products/modals/delete-product-modal';
import { toast } from '@heroui/react';
import { ProductType, ProductStatus, CategoryStatus, PaymentEnvironment } from '@/types/enums';
import type {
	MinimalCategoryData,
	ProductData,
	ProductVariantData,
	CreateVariantRequest,
} from '@/types/merchant/products';
import type { ApiResponse } from '@/types/common';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import { Routes } from '@/router/routes';
import { serviceProductFormSchema, type ServiceProductFormData } from '@/schemas/product-form-schema';
import { formatCurrency } from '@/utils/currency';
import {
	BasicInfoTab,
	PriceTab,
	ImagesTab,
	CategoriesTab,
	CouponsTab,
	VariantsTab,
	type PendingVariant,
} from './tabs';

const SERVICE_WIZARD_STEPS = [
	{ key: 'basic', title: 'Informações', description: 'Defina nome e identificação do serviço.', isRequired: true },
	{ key: 'images', title: 'Imagens', description: 'Adicione imagens para apresentação do serviço.' },
	{ key: 'categories', title: 'Categorias', description: 'Organize o serviço por categorias.' },
	{ key: 'coupons', title: 'Cupons', description: 'Associe cupons de desconto aplicáveis.' },
	{ key: 'variants', title: 'Variantes', description: 'Crie variações de entrega e precificação.' },
	{ key: 'price', title: 'Preço', description: 'Configure o valor de venda do serviço.', isRequired: true },
	{ key: 'review', title: 'Revisão', description: 'Revise as informações antes de criar o produto.' },
];

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

export interface ServiceFormProps {
	merchantId: string;
	environment: PaymentEnvironment;
	product?: ProductData | null;
	productPromise?: Promise<ApiResponse<ProductData>>;
}

export function ServiceForm({ merchantId, environment, product, productPromise }: ServiceFormProps) {
	const router = useRouter();
	const response = productPromise ? use(productPromise) : null;
	const resolvedProduct = product ?? response?.data ?? null;
	const isEditMode = !!resolvedProduct;
	const productId = resolvedProduct?.id;

	const [isPending, startTransition] = useTransition();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<ProductStatus>(resolvedProduct?.status ?? ProductStatus.Active);
	const [isStatusPending, setIsStatusPending] = useState(false);

	const [selectedTab, setSelectedTab] = useState('basic');
	const [categories, setCategories] = useState<MinimalCategoryData[]>(
		resolvedProduct?.categories?.map((c) => ({
			id: c.id,
			name: c.name,
			externalId: null,
			status: CategoryStatus.Active,
			productCount: 0,
			environment,
			createdAt: '',
		})) ?? []
	);
	const [coupons, setCoupons] = useState<MinimalCoupon[]>(
		resolvedProduct?.coupons?.map((c) => ({
			id: c.id,
			code: c.code,
			name: c.name,
			status: c.status,
			discountType: c.discountType,
			discountFixedAmount: c.discountFixedAmount,
			discountPercentage: c.discountPercentage,
			maxUses: c.maxUses,
			currentUses: c.currentUses,
			maxDiscountAmount: null,
			applyToAllProducts: false,
			applyToAllCheckouts: false,
			checkoutCount: 0,
			validFrom: null,
			validUntil: null,
			createdAt: '',
			productCount: 0,
			environment,
		})) ?? []
	);
	const [variants, setVariants] = useState<ProductVariantData[]>(resolvedProduct?.variants ?? []);

	const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] = useState(false);
	const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);
	const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
	const [hasValidatedReview, setHasValidatedReview] = useState(false);

	const form = useForm<ServiceProductFormData>({
		resolver: zodResolver(serviceProductFormSchema),
		mode: 'onChange',
		defaultValues: {
			type: ProductType.Service,
			name: resolvedProduct?.name ?? '',
			description: resolvedProduct?.description ?? '',
			externalId: resolvedProduct?.externalId ?? '',
			imageUrls: resolvedProduct?.imageUrls ?? [],
			status: resolvedProduct?.status ?? null,
			price: resolvedProduct?.price ? resolvedProduct.price / 100 : null,
			categoryIds: resolvedProduct?.categories?.map((c) => c.id) ?? [],
			couponIds: resolvedProduct?.coupons?.map((c) => c.id) ?? [],
			pendingVariants: [],
		},
	});

	const { formState: { isDirty }, setValue, reset, trigger, getValues } = form;

	const name = useWatch({ control: form.control, name: 'name' });
	const description = useWatch({ control: form.control, name: 'description' });
	const externalId = useWatch({ control: form.control, name: 'externalId' });
	const imageUrls = useWatch({ control: form.control, name: 'imageUrls' });
	const priceValue = useWatch({ control: form.control, name: 'price' });
	const selectedCategoryIds = useWatch({ control: form.control, name: 'categoryIds' });
	const selectedCouponIds = useWatch({ control: form.control, name: 'couponIds' });
	const pendingVariants = useWatch({ control: form.control, name: 'pendingVariants' });

	function handleSelectCategory(category: MinimalCategoryData) {
		if (!selectedCategoryIds.includes(category.id)) {
			setValue('categoryIds', [...selectedCategoryIds, category.id], { shouldDirty: true });
			if (!categories.some((c) => c.id === category.id)) {
				setCategories([...categories, category]);
			}
		}
	}

	function handleRemoveCategory(categoryId: string) {
		setValue('categoryIds', selectedCategoryIds.filter((id) => id !== categoryId), { shouldDirty: true });
	}

	function handleSelectCoupon(coupon: MinimalCoupon) {
		if (!coupons.some((c) => c.id === coupon.id)) {
			setCoupons([...coupons, coupon]);
		}
		if (!selectedCouponIds.includes(coupon.id)) {
			setValue('couponIds', [...selectedCouponIds, coupon.id], { shouldDirty: true });
		}
	}

	function handleRemoveCoupon(couponId: string) {
		setValue('couponIds', selectedCouponIds.filter((id) => id !== couponId), { shouldDirty: true });
	}

	function handlePendingVariantAdded(variant: CreateVariantRequest) {
		const pendingVariant: PendingVariant = { ...variant, tempId: crypto.randomUUID() };
		setValue('pendingVariants', [...pendingVariants, pendingVariant], { shouldDirty: true });
		setIsCreateVariantModalOpen(false);
		toast('Variante adicionada', {
			description: 'A variante será criada junto com o serviço.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleRemovePendingVariant(tempId: string) {
		setValue('pendingVariants', pendingVariants.filter((v) => v.tempId !== tempId), { shouldDirty: true });
	}

	async function handleVariantCreated(variant: CreateVariantRequest) {
		if (!productId) return;
		const res = await createProductVariant(merchantId, productId, variant);
		if (res?.error) {
			toast('Erro ao criar variante', {
				description: res.error.message ?? 'Tente novamente mais tarde.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}
		if (res?.data) {
			setVariants([...variants, res.data]);
			toast('Variante criada', {
				description: 'A variante foi criada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		}
		setIsCreateVariantModalOpen(false);
	}

	async function handleDeleteVariant(variantId: string) {
		if (!productId) return;
		const res = await deleteProductVariant(merchantId, productId, variantId);
		if (res?.error) {
			toast('Erro ao excluir variante', {
				description: res.error.message ?? 'Tente novamente mais tarde.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}
		setVariants(variants.filter((v) => v.id !== variantId));
		toast('Variante excluída', {
			description: 'A variante foi excluída com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleEditVariant(variant: ProductVariantData) {
		setSelectedVariant(variant);
		setIsVariantModalOpen(true);
	}

	function handleVariantUpdated(updatedVariant?: ProductVariantData) {
		if (updatedVariant) {
			setVariants(variants.map((v) => (v.id === updatedVariant.id ? updatedVariant : v)));
		}
		setSelectedVariant(null);
		setIsVariantModalOpen(false);
	}

	async function handleStatusChange(status: ProductStatus) {
		if (!productId) return;
		setIsStatusPending(true);
		const response = await updateMerchantProductStatus(merchantId, productId, status);

		if (response?.error) {
			toast('Erro ao atualizar status', {
				description: response.error.message ?? 'Não foi possível atualizar o status do serviço.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			setIsStatusPending(false);
			return;
		}

		setCurrentStatus(status);
		setValue('status', status, { shouldDirty: false });
		toast('Status atualizado', {
			description: response?.message ?? 'Status do serviço atualizado com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		router.refresh();
		setIsStatusPending(false);
	}

	function handleSubmit() {
		startTransition(async () => {
			const customErrors: string[] = [];
			const currentValues = form.getValues();
			if (!currentValues.name.trim()) {
				customErrors.push('Nome do serviço é obrigatório');
			}
			if (currentValues.price == null || currentValues.price <= 0) {
				customErrors.push('Preço deve ser maior que zero');
			}

			if (customErrors.length > 0) {
				toast('Erro de validação', {
					description: customErrors[0],
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const isValid = await trigger();
			if (!isValid) {
				setHasValidatedReview(true);
				const errors = form.formState.errors;
				const firstError = Object.values(errors)[0];
				if (firstError) {
					toast('Erro de validação', {
						description: firstError.message as string,
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
				}
				return;
			}

			const values = getValues();
			const priceCents = values.price ? Math.round(values.price * 100) : null;

			if (isEditMode && productId) {
				const res = await updateMerchantProduct(merchantId, productId, {
					name: values.name.trim(),
					type: ProductType.Service,
					description: values.description?.trim() || null,
					externalId: values.externalId?.trim() || null,
					price: priceCents,
					imageUrls: values.imageUrls.length > 0 ? values.imageUrls : null,
					categoryIds: values.categoryIds.length > 0 ? values.categoryIds : null,
				});

				if (res?.error) {
					toast('Erro ao atualizar serviço', {
						description: res.error.message ?? 'Tente novamente mais tarde.',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}

				toast('Serviço atualizado', {
					description: res?.message || 'O serviço foi atualizado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				reset(values);
				router.refresh();
				return;
			}

			const res = await createMerchantProduct(merchantId, {
				name: values.name.trim(),
				type: ProductType.Service,
				environment,
				status: ProductStatus.Active,
				description: values.description?.trim() || null,
				externalId: values.externalId?.trim() || null,
				price: priceCents,
				imageUrls: values.imageUrls.length > 0 ? values.imageUrls : null,
				categoryIds: values.categoryIds.length > 0 ? values.categoryIds : null,
			});

			if (res?.error) {
				toast('Erro ao criar serviço', {
					description: res.error.message ?? 'Tente novamente mais tarde.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const createdProductId = res?.data?.id;

			if (createdProductId && values.pendingVariants.length > 0) {
				let variantErrors = 0;
				for (const variant of values.pendingVariants) {
					const variantRes = await createProductVariant(merchantId, createdProductId, {
						name: variant.name,
						price: variant.price,
						externalId: variant.externalId,
						sku: variant.sku,
						stockQuantity: variant.stockQuantity,
						imageUrl: variant.imageUrl,
						status: variant.status,
					});

					if (variantRes?.error) {
						variantErrors++;
					}
				}

				if (variantErrors > 0) {
					toast('Serviço criado', {
						description: 'O serviço foi criado, mas algumas variantes falharam.',
						indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
						variant: 'warning',
					});
				} else {
					toast('Serviço criado', {
						description: 'O serviço foi criado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}
			} else {
				toast('Serviço criado', {
					description: res?.message || 'O serviço foi criado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}

			if (createdProductId) {
				router.push(Routes.panel.merchant.services);
			} else {
				router.push(Routes.panel.merchant.services);
			}
		});
	}

	const selectedCoupons = coupons.filter((c) => selectedCouponIds.includes(c.id));

	const headerActions = isEditMode ? (
		<div className="flex items-center gap-2">
			<Dropdown>
				<Button variant="tertiary" aria-label="Ações" isDisabled={isPending || isStatusPending}>
					<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
					Ações
				</Button>
				<Dropdown.Popover className="min-w-48">
					<Dropdown.Menu aria-label="Ações de status do serviço">
						<Dropdown.Item id="delete" textValue="Excluir" className="text-danger" isDisabled={isPending} onPress={() => setIsDeleteModalOpen(true)}>
							<Icon icon={Delete02Icon} className="icon-xs text-danger" />
							Excluir
						</Dropdown.Item>
						<Dropdown.Item id="activate" textValue="Ativar" className="text-success" isDisabled={currentStatus === ProductStatus.Active || isStatusPending} onPress={() => handleStatusChange(ProductStatus.Active)}>
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
							Ativar
						</Dropdown.Item>
						<Dropdown.Item id="inactivate" textValue="Inativar" className="text-warning" isDisabled={currentStatus !== ProductStatus.Active || isStatusPending} onPress={() => handleStatusChange(ProductStatus.Inactive)}>
							<Icon icon={CancelCircleIcon} className="icon-xs text-warning" />
							Inativar
						</Dropdown.Item>
						<Dropdown.Item id="archive" textValue="Arquivar" className="text-danger" isDisabled={currentStatus === ProductStatus.Archived || isStatusPending} onPress={() => handleStatusChange(ProductStatus.Archived)}>
							<Icon icon={Archive01Icon} className="icon-xs text-danger" />
							Arquivar
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>
		</div>
	) : null;

	const tabItems: InternalTabItem[] = [
		{ id: 'basic', label: 'Básico', icon: <Icon icon={TextIcon} className="icon-sm" /> },
		{ id: 'images', label: 'Imagens', icon: <Icon icon={Image01Icon} className="icon-sm" /> },
		{ id: 'categories', label: 'Categorias', icon: <Icon icon={Tag01Icon} className="icon-sm" /> },
		{ id: 'coupons', label: 'Cupons', icon: <Icon icon={Coupon01Icon} className="icon-sm" /> },
		{ id: 'variants', label: 'Variantes', icon: <Icon icon={Layers01Icon} className="icon-sm" /> },
		{ id: 'price', label: 'Preço', icon: <Icon icon={Dollar01Icon} className="icon-sm" /> },
		{ id: 'review', label: 'Revisão', icon: <Icon icon={Alert01Icon} className="icon-sm" /> },
	];
    const visibleTabItems = isEditMode ? tabItems.filter((item) => item.id !== 'review') : tabItems;

	const formValidationErrors = collectValidationMessages(form.formState.errors);
	const reviewValidationMessages = [
		...formValidationErrors,
		...(name.trim().length === 0 ? ['Nome do serviço é obrigatório'] : []),
		...(priceValue == null || priceValue <= 0 ? ['Preço deve ser maior que zero'] : []),
	];
	const uniqueReviewValidationMessages = [...new Set(reviewValidationMessages)];
	const hasReviewErrors = uniqueReviewValidationMessages.length > 0;
	const isReviewStep = !isEditMode && selectedTab === 'review';
	const stepDefinitions = isEditMode
		? SERVICE_WIZARD_STEPS.filter((step) => step.key !== 'review')
		: SERVICE_WIZARD_STEPS;
	const wizardStepOrder = stepDefinitions.map((step) => step.key);
	const currentWizardStepIndex = Math.max(0, wizardStepOrder.indexOf(selectedTab));
	const wizardSteps = stepDefinitions.map((step) => {
		if (step.key === 'basic') {
			return { ...step, isCompleted: name.trim().length > 0 };
		}

		if (step.key === 'price') {
			return { ...step, isCompleted: priceValue != null && priceValue > 0 };
		}

		return step;
	});

	useEffect(() => {
		if (isEditMode && selectedTab === 'review') {
			setSelectedTab('basic');
		}
	}, [isEditMode, selectedTab]);
	const basicSummary = name.trim().length > 0
		? name.trim()
		: 'Nome não informado';
	const imagesSummary = imageUrls.length === 0
		? 'Nenhuma imagem adicionada'
		: `${imageUrls.length} imagem(ns) adicionada(s)`;
	const categoriesSummary = selectedCategoryIds.length === 0
		? 'Nenhuma categoria selecionada'
		: `${selectedCategoryIds.length} categoria(s) selecionada(s)`;
	const couponsSummary = selectedCouponIds.length === 0
		? 'Nenhum cupom associado'
		: `${selectedCouponIds.length} cupom(ns) associado(s)`;
	const variantsSummary = isEditMode
		? `${variants.length} variante(s) cadastrada(s)`
		: `${pendingVariants.length} variante(s) pendente(s)`;
	const priceSummary = priceValue != null
		? formatCurrency(Math.round(priceValue * 100))
		: 'Preço não informado';
	const reviewSummary = hasReviewErrors
		? `${uniqueReviewValidationMessages.length} pendência(s)`
		: 'Tudo pronto para salvar';

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

	function handleWizardBack() {
		if (currentWizardStepIndex <= 0) return;
		setSelectedTab(wizardStepOrder[currentWizardStepIndex - 1] ?? 'basic');
	}

	async function goToStep(targetStep: string) {
		if (isEditMode || targetStep !== 'review') {
			setSelectedTab(targetStep);
			return;
		}

		setHasValidatedReview(true);
		await form.trigger();
		setSelectedTab('review');
	}

	function handleWizardNext() {
		if (currentWizardStepIndex >= wizardStepOrder.length - 1) return;
		const targetStep = wizardStepOrder[currentWizardStepIndex + 1] ?? 'basic';
		void goToStep(targetStep);
	}

	return (
		<div className="flex flex-col gap-4">
			<FormPageHeader
				icon={<Icon icon={Calendar01Icon} className="icon-md text-accent" />}
				title={isEditMode ? 'Editar Serviço' : 'Novo Serviço'}
				description={
					isEditMode
						? `Editando: ${resolvedProduct?.name}`
						: 'Cadastre um novo serviço para sua organização'
				}
				backLabel="Voltar para serviços"
				onBack={() => router.push(Routes.panel.merchant.services)}
				actions={headerActions}
			/>

			{isEditMode && <UnsavedChangesAlert hasChanges={isDirty} onSave={handleSubmit} isSaving={isPending} />}

			<WizardStepper
				steps={wizardSteps}
				currentStep={currentWizardStepIndex}
				mode={isEditMode ? 'editor' : 'wizard'}
				isDisabled={isPending}
				onStepClick={(idx) => {
					void goToStep(wizardStepOrder[idx] ?? 'basic');
				}}
				onBack={isEditMode ? handleWizardBack : undefined}
				onNext={isEditMode ? handleWizardNext : undefined}
				submitSlot={null}
			/>

			<InternalTabs
				className="w-full **:[[role=tablist]]:hidden"
				ariaLabel="Abas de cadastro do serviço"
				items={visibleTabItems}
				selectedKey={selectedTab}
				onSelectionChange={(key) => setSelectedTab(key as string)}
			>

				<Tabs.Panel id="basic" className="p-0">
					{renderAccordionCard({
						id: 'service-basic',
						icon: TextIcon,
						title: 'Informações Básicas',
						summary: basicSummary,
						children: (
							<BasicInfoTab
								name={name}
								setName={(value) => setValue('name', value, { shouldDirty: true })}
								description={description ?? ''}
								setDescription={(value) => setValue('description', value, { shouldDirty: true })}
								externalId={externalId ?? ''}
								setExternalId={(value) => setValue('externalId', value, { shouldDirty: true })}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				<Tabs.Panel id="price" className="p-0">
					{renderAccordionCard({
						id: 'service-price',
						icon: Dollar01Icon,
						title: 'Preço',
						summary: priceSummary,
						children: (
							<PriceTab
								price={priceValue ?? undefined}
								setPrice={(value) => setValue('price', value ?? null, { shouldDirty: true })}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				<Tabs.Panel id="images" className="p-0">
					{renderAccordionCard({
						id: 'service-images',
						icon: Image01Icon,
						title: 'Imagens',
						summary: imagesSummary,
						children: (
							<ImagesTab
								imageUrls={imageUrls}
								setImageUrls={(value) => setValue('imageUrls', value, { shouldDirty: true })}
								merchantId={merchantId}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				<Tabs.Panel id="categories" className="p-0">
					{renderAccordionCard({
						id: 'service-categories',
						icon: Tag01Icon,
						title: 'Categorias',
						summary: categoriesSummary,
						children: (
							<CategoriesTab
								merchantId={merchantId}
								environment={environment}
								categories={categories}
								setCategories={setCategories}
								selectedCategoryIds={selectedCategoryIds}
								onSelectCategory={handleSelectCategory}
								onRemoveCategory={handleRemoveCategory}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				<Tabs.Panel id="coupons" className="p-0">
					{renderAccordionCard({
						id: 'service-coupons',
						icon: Coupon01Icon,
						title: 'Cupons',
						summary: couponsSummary,
						children: (
							<CouponsTab
								merchantId={merchantId}
								environment={environment}
								selectedCouponIds={selectedCouponIds}
								selectedCoupons={selectedCoupons}
								onSelectCoupon={handleSelectCoupon}
								onRemoveCoupon={handleRemoveCoupon}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				<Tabs.Panel id="variants" className="p-0">
					{renderAccordionCard({
						id: 'service-variants',
						icon: Layers01Icon,
						title: 'Variantes',
						summary: variantsSummary,
						children: (
							<VariantsTab
								isEditMode={isEditMode}
								variants={variants}
								pendingVariants={pendingVariants}
								onOpenCreateModal={() => setIsCreateVariantModalOpen(true)}
								onEditVariant={handleEditVariant}
								onDeleteVariant={handleDeleteVariant}
								onRemovePendingVariant={handleRemovePendingVariant}
								disabled={false}
							/>
						),
					})}
				</Tabs.Panel>

				{!isEditMode && <Tabs.Panel id="review" className="p-0"> 
					{hasValidatedReview && hasReviewErrors && <ReviewIssuesAlert issues={uniqueReviewValidationMessages} />}
					{renderAccordionCard({
						id: 'service-review',
						icon: Alert01Icon,
						title: 'Revisão',
						summary: reviewSummary,
						children: (
							<ReviewStepLayout
								title="Revisão do serviço"
								description="Confira os dados antes de criar o produto."
							>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
									<div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
										<p className="text-xs text-muted">Nome</p>
										<p className="text-sm font-medium">{name || 'Não informado'}</p>
									</div>
									<div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2">
										<p className="text-xs text-muted">Preço</p>
										<p className="text-sm font-medium">{priceSummary}</p>
									</div>
									<div className="rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2">
										<p className="text-xs text-muted">Categorias</p>
										<p className="text-sm font-medium">{selectedCategoryIds.length}</p>
									</div>
									<div className="rounded-lg border border-border px-3 py-2">
										<p className="text-xs text-muted">Variantes pendentes</p>
										<p className="text-sm font-medium">{pendingVariants.length}</p>
									</div>
								</div>
							</ReviewStepLayout>
						),
					})}
				</Tabs.Panel>}
			</InternalTabs>

			{!isEditMode && (
				<div className="rounded-xl border border-border bg-surface p-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						<Button
							variant="secondary"
							onPress={currentWizardStepIndex === 0 ? () => router.push(Routes.panel.merchant.services) : handleWizardBack}
							isDisabled={isPending}
							className="sm:mr-auto"
						>
							<Icon icon={ArrowLeft01Icon} className="icon-sm" />
							Voltar
						</Button>

						{!isReviewStep ? (
							<Button variant="primary" onPress={handleWizardNext} isDisabled={isPending} className="w-full sm:w-auto">
								Próximo
								<Icon icon={ArrowRight01Icon} className="icon-sm" />
							</Button>
						) : (
							<Button
								variant="primary"
								onPress={handleSubmit}
								isPending={isPending}
								isDisabled={hasReviewErrors}
								className="w-full sm:w-auto"
							>
								<Icon icon={Tick01Icon} className="icon-sm" />
								Criar Produto
							</Button>
						)}
					</div>
				</div>
			)}

			<CreateVariantInlineModal
				isOpen={isCreateVariantModalOpen}
				onOpenChange={setIsCreateVariantModalOpen}
				merchantId={merchantId}
				productType={ProductType.Service}
				onSuccess={isEditMode ? handleVariantCreated : handlePendingVariantAdded}
			/>

			{isEditMode && selectedVariant && productId && (
				<VariantModal
					isOpen={isVariantModalOpen}
					onOpenChange={(open: boolean) => {
						setIsVariantModalOpen(open);
						if (!open) setSelectedVariant(null);
					}}
					mode="edit"
					variant={selectedVariant}
					merchantId={merchantId}
					productId={productId}
					onSuccess={handleVariantUpdated}
					productType={ProductType.Service}
				/>
			)}

			{isEditMode && productId && (
				<DeleteProductModal
					isOpen={isDeleteModalOpen}
					onOpenChange={setIsDeleteModalOpen}
					merchantId={merchantId}
					productId={productId}
					productName={resolvedProduct?.name ?? ''}
					redirectUrl={Routes.panel.merchant.services}
				/>
			)}
		</div>
	);
}
