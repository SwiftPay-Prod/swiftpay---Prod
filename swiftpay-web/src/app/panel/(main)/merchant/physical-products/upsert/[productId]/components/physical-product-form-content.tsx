'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@heroui/react';
import { Dropdown } from '@heroui/react';
import {
	TextIcon,
	Dollar01Icon,
	PackageIcon,
	Image01Icon,
	Tag01Icon,
	Coupon01Icon,
	Layers01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	Alert01Icon,
	Delete02Icon,
	MoreHorizontalCircle01Icon,
	Archive01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Tick01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Button } from '@heroui/react';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import { ReviewIssuesAlert, ReviewStepLayout } from '@/components/ui/review-step-layout';
import { CreateVariantInlineModal } from '@/components/merchant/products/modals/create-variant-inline-modal';
import { VariantModal } from '@/components/merchant/products/modals/variant-modal';
import { DeleteProductModal } from '@/components/merchant/products/modals/delete-product-modal';
import { StockAdjustmentModal } from '../../../modals/stock-adjustment-modal';
import {
	BasicInfoTab,
	PriceTab,
	StockTab,
	ImagesTab,
	CategoriesTab,
	CouponsTab,
	VariantsTab,
	type PendingVariant,
} from './tabs';
import type { ProductData, ProductVariantData, MinimalCategoryData, CreateVariantRequest } from '@/types/merchant/products';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import { ProductStatus, ProductType, CategoryStatus, type PaymentEnvironment } from '@/types/enums';
import { Routes } from '@/router/routes';
import {
	createMerchantProduct,
	updateMerchantProduct,
	updateMerchantProductStatus,
	createProductVariant,
	deleteProductVariant,
} from '@/app/actions/merchant/products';
import { physicalProductFormSchema, type PhysicalProductFormData } from './physical-product-form-schema';
import { formatCurrency } from '@/utils/currency';

const PHYSICAL_PRODUCT_WIZARD_STEPS = [
	{ key: 'basic', title: 'Informações', description: 'Defina nome e identificadores do produto.', isRequired: true },
	{ key: 'stock', title: 'Estoque', description: 'Ajuste estoque geral e política de controle.' },
	{ key: 'images', title: 'Imagens', description: 'Adicione imagens para apresentação do produto.' },
	{ key: 'categories', title: 'Categorias', description: 'Organize o produto nas categorias da loja.' },
	{ key: 'coupons', title: 'Cupons', description: 'Associe cupons de desconto aplicáveis.' },
	{ key: 'variants', title: 'Variantes', description: 'Crie variações com preço e estoque por item.' },
	{ key: 'price', title: 'Preço', description: 'Configure o valor de venda do produto.', isRequired: true },
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

interface PhysicalProductFormContentProps {
	merchantId: string;
	environment: PaymentEnvironment;
	product: ProductData | null;
}

export function PhysicalProductFormContent({
	merchantId,
	environment,
	product,
}: PhysicalProductFormContentProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnTo = searchParams.get('returnTo');
	const backRoute = returnTo || Routes.panel.merchant.productsByType('physical');

	const resolvedProduct = product;
	const isEditMode = !!resolvedProduct;
	const productId = resolvedProduct?.id;

	const [selectedTab, setSelectedTab] = useState<string>('basic');
	const [isPending, startTransition] = useTransition();

	const defaultValues = useMemo<PhysicalProductFormData>(
		() => ({
			type: ProductType.Physical,
			name: resolvedProduct?.name ?? '',
			description: resolvedProduct?.description ?? null,
			externalId: resolvedProduct?.externalId ?? null,
			status: resolvedProduct?.status ?? ProductStatus.Active,
			price: resolvedProduct?.price ? resolvedProduct.price / 100 : null,
			imageUrls: resolvedProduct?.imageUrls ?? [],
			categoryIds: resolvedProduct?.categories?.map((c) => c.id) ?? [],
			couponIds: resolvedProduct?.coupons?.map((c) => c.id) ?? [],
			pendingVariants: [],
			stockQuantity: resolvedProduct?.stockQuantity ?? null,
			isUnlimitedStock: resolvedProduct?.isUnlimitedDigitalStock ?? true,
		}),
		[resolvedProduct]
	);

	const form = useForm<PhysicalProductFormData>({
		resolver: zodResolver(physicalProductFormSchema),
		defaultValues,
		mode: 'onChange',
	});

	const { setValue, reset, formState: { isDirty, errors }, control } = form;

	const name = useWatch({ control, name: 'name' });
	const description = useWatch({ control, name: 'description' });
	const externalId = useWatch({ control, name: 'externalId' });
	const priceValue = useWatch({ control, name: 'price' });
	const imageUrls = useWatch({ control, name: 'imageUrls' });
	const selectedCategoryIds = useWatch({ control, name: 'categoryIds' });
	const selectedCouponIds = useWatch({ control, name: 'couponIds' });
	const pendingVariants = useWatch({ control, name: 'pendingVariants' });
	const stockQuantity = useWatch({ control, name: 'stockQuantity' });
	const isUnlimitedStock = useWatch({ control, name: 'isUnlimitedStock' });

	const [categories, setCategories] = useState<MinimalCategoryData[]>(
		resolvedProduct?.categories?.map((c) => ({
			id: c.id,
			externalId: null,
			name: c.name,
			environment,
			status: c.status ?? CategoryStatus.Active,
			productCount: 0,
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
			maxUsesPerCustomer: null,
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
	const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
	const [adjustingVariant, setAdjustingVariant] = useState<ProductVariantData | null>(null);
	const [hasValidatedReview, setHasValidatedReview] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isStatusPending, setIsStatusPending] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<ProductStatus>(resolvedProduct?.status ?? ProductStatus.Active);

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);


	async function handleStatusChange(status: ProductStatus) {
		if (!productId || currentStatus === status || isStatusPending) return;

		setIsStatusPending(true);
		const response = await updateMerchantProductStatus(merchantId, productId, status);
		setIsStatusPending(false);

		if (response?.error) {
			toast('Erro ao atualizar status', {
				description: response.error.message ?? 'Não foi possível atualizar o status do produto.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		setCurrentStatus(status);
		toast('Status atualizado', {
			description: response?.message ?? 'Status do produto atualizado com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
		router.refresh();
	}

	const hasVariants = isEditMode ? variants.length > 0 : pendingVariants.length > 0;
	const showMainStock = !hasVariants;
	const showVariantStock = hasVariants;

	function handleOpenMainAdjustment() {
		setAdjustingVariant(null);
		setIsAdjustmentModalOpen(true);
	}

	function handleOpenVariantAdjustment(variant: ProductVariantData) {
		setAdjustingVariant(variant);
		setIsAdjustmentModalOpen(true);
	}

	function handleStockAdjustmentSuccess(newQuantity: number | null) {
		if (adjustingVariant) {
			setVariants((prev) =>
				prev.map((v) => (v.id === adjustingVariant.id ? { ...v, stockQuantity: newQuantity } : v))
			);
		} else {
			setValue('stockQuantity', newQuantity, { shouldDirty: true });
		}
		setIsAdjustmentModalOpen(false);
		setAdjustingVariant(null);
	}

	function handleCategoryCreated(category: MinimalCategoryData) {
		setCategories((prev) => [...prev, category]);
		setValue('categoryIds', [...selectedCategoryIds, category.id], { shouldDirty: true });
	}

	function handleSelectCategory(category: MinimalCategoryData) {
		if (!selectedCategoryIds.includes(category.id)) {
			setCategories((prev) => {
				if (prev.some((c) => c.id === category.id)) return prev;
				return [...prev, category];
			});
			setValue('categoryIds', [...selectedCategoryIds, category.id], { shouldDirty: true });
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
		const pendingVariant: PendingVariant = {
			...variant,
			tempId: crypto.randomUUID(),
		};
		setValue('pendingVariants', [...pendingVariants, pendingVariant], { shouldDirty: true });
		setIsCreateVariantModalOpen(false);
		toast('Variante adicionada', {
			description: 'Será criada junto com o produto.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleRemovePendingVariant(tempId: string) {
		setValue('pendingVariants', pendingVariants.filter((v) => v.tempId !== tempId), { shouldDirty: true });
	}

	async function handleVariantCreated(variant: CreateVariantRequest) {
		if (!productId) return;

		const response = await createProductVariant(merchantId, productId, {
			name: variant.name,
			price: variant.price,
			sku: variant.sku,
			externalId: variant.externalId,
			imageUrl: variant.imageUrl,
			stockQuantity: variant.stockQuantity,
			status: variant.status,
		});

		if (response?.error) {
			toast('Erro ao criar variante', {
				description: response.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		if (response?.data) {
			const newVariant = response.data;
			setVariants((prev) => [...prev, newVariant]);
		}
		setIsCreateVariantModalOpen(false);
		toast('Variante criada', {
			description: 'A variante foi criada com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleEditVariant(variant: ProductVariantData) {
		setSelectedVariant(variant);
		setIsVariantModalOpen(true);
	}

	function handleVariantUpdated(updatedVariant?: ProductVariantData) {
		if (!updatedVariant) return;
		setVariants((prev) => prev.map((v) => (v.id === updatedVariant.id ? updatedVariant : v)));
		setIsVariantModalOpen(false);
		setSelectedVariant(null);
	}

	async function handleDeleteVariant(variantId: string) {
		if (!productId) return;

		const response = await deleteProductVariant(merchantId, productId, variantId);
		if (response?.error) {
			toast('Erro ao excluir', {
				description: response.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		setVariants((prev) => prev.filter((v) => v.id !== variantId));
		toast('Variante excluída', {
			description: 'A variante foi excluída com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleSubmit() {
		startTransition(async () => {
			const customErrors: string[] = [];
			const currentValues = form.getValues();
			if (!currentValues.name.trim()) {
				customErrors.push('Nome do produto é obrigatório');
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

			const isValid = await form.trigger();
			if (!isValid) {
				setHasValidatedReview(true);
				const firstError = Object.values(errors)[0];
				if (firstError?.message) {
					toast('Erro de validação', {
						description: firstError.message as string,
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
				}
				return;
			}

			const data = form.getValues();
			const priceCents = data.price ? Math.round(data.price * 100) : null;

			if (isEditMode && productId) {
				const response = await updateMerchantProduct(merchantId, productId, {
					name: data.name.trim(),
					description: data.description?.trim() || null,
					externalId: data.externalId?.trim() || null,
					price: priceCents,
					isUnlimitedDigitalStock: data.isUnlimitedStock,
					imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [],
					categoryIds: data.categoryIds,
					couponIds: data.couponIds,
				});

				if (response?.error) {
					toast('Erro ao atualizar', {
						description: response.error.message ?? 'Erro ao atualizar produto.',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}

				toast('Produto atualizado', {
					description: 'As alterações foram salvas com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				reset({
					...data,
					pendingVariants: [],
				});
				router.refresh();
				return;
			}

			const hasNewVariants = data.pendingVariants.length > 0;
			const response = await createMerchantProduct(merchantId, {
				name: data.name.trim(),
				description: data.description?.trim() || null,
				externalId: data.externalId?.trim() || null,
				status: ProductStatus.Active,
				price: priceCents,
				stockQuantity: !data.isUnlimitedStock && !hasNewVariants ? (data.stockQuantity ?? null) : null,
				isUnlimitedDigitalStock: data.isUnlimitedStock,
				imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [],
				categoryIds: data.categoryIds,
				environment,
				type: ProductType.Physical,
			});

			if (response?.error) {
				toast('Erro ao criar', {
					description: response.error.message ?? 'Erro ao criar produto.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const newProductId = response?.data?.id;
			if (newProductId && data.pendingVariants.length > 0) {
				let variantErrors = 0;
				for (const pendingVariant of data.pendingVariants) {
					const variantRes = await createProductVariant(merchantId, newProductId, {
						name: pendingVariant.name,
						sku: pendingVariant.sku || null,
						price: pendingVariant.price,
						stockQuantity: data.isUnlimitedStock ? null : (pendingVariant.stockQuantity ?? null),
						imageUrl: pendingVariant.imageUrl || null,
						status: pendingVariant.status,
					});

					if (variantRes?.error) {
						variantErrors++;
					}
				}

				if (variantErrors > 0) {
					toast('Atenção', {
						description: 'Produto criado, mas algumas variantes falharam.',
						indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
						variant: 'warning',
					});
				} else {
					toast('Produto criado', {
						description: 'O produto foi criado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}
			} else {
				toast('Produto criado', {
					description: response?.message || 'O produto foi criado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}

			if (!isEditMode && returnTo) {
				router.push(returnTo);
				return;
			}

			if (newProductId) {
				router.push(Routes.panel.merchant.productsByType('physical'));
			} else {
				router.push(Routes.panel.merchant.productsByType('physical'));
			}
		});
	}

	const selectedCoupons = coupons.filter((c) => selectedCouponIds.includes(c.id));

	const formValidationErrors = collectValidationMessages(form.formState.errors);
	const reviewValidationMessages = [
		...formValidationErrors,
		...(name.trim().length === 0 ? ['Nome do produto é obrigatório'] : []),
		...(priceValue == null || priceValue <= 0 ? ['Preço deve ser maior que zero'] : []),
	];
	const uniqueReviewValidationMessages = [...new Set(reviewValidationMessages)];
	const hasReviewErrors = uniqueReviewValidationMessages.length > 0;
	const isReviewStep = !isEditMode && selectedTab === 'review';
	const basicSummary = name.trim().length > 0 ? name.trim() : 'Nome não informado';
	const priceSummary = priceValue != null ? formatCurrency(priceValue) : 'Preço não informado';
	const stockSummary = isUnlimitedStock
		? 'Estoque ilimitado'
		: `Quantidade ${stockQuantity ?? 0}${showVariantStock ? ' com controle por variante' : ''}`;
	const imagesSummary = imageUrls.length > 0 ? `${imageUrls.length} imagem(ns)` : 'Nenhuma imagem';
	const categoriesSummary = selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} categoria(s)` : 'Nenhuma categoria';
	const couponsSummary = selectedCouponIds.length > 0 ? `${selectedCouponIds.length} cupom(ns)` : 'Nenhum cupom';
	const variantsSummary = isEditMode
		? `${variants.length} variante(s) cadastrada(s)`
		: `${pendingVariants.length} variante(s) pendente(s)`;
	const reviewSummary = hasReviewErrors
		? `${uniqueReviewValidationMessages.length} pendência(s)`
		: 'Tudo pronto para salvar';
	const stepDefinitions = isEditMode
		? PHYSICAL_PRODUCT_WIZARD_STEPS.filter((step) => step.key !== 'review')
		: PHYSICAL_PRODUCT_WIZARD_STEPS;
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

	const canActivate = currentStatus === ProductStatus.Inactive || currentStatus === ProductStatus.Archived;
	const canInactivate = currentStatus === ProductStatus.Active;
	const canArchive = currentStatus !== ProductStatus.Archived;

	const headerActions = isEditMode ? (
		<div className="flex items-center gap-2">
			<Dropdown>
				<Button variant="tertiary" aria-label="Ações" isDisabled={isPending || isStatusPending}>
					<Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
					Ações
				</Button>
				<Dropdown.Popover className="min-w-48">
					<Dropdown.Menu aria-label="Ações do produto físico">
						<Dropdown.Item id="activate" textValue="Ativar" className="text-success" isDisabled={!canActivate || isStatusPending} onPress={() => void handleStatusChange(ProductStatus.Active)}>
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-success" />
							Ativar
						</Dropdown.Item>
						<Dropdown.Item id="inactivate" textValue="Inativar" className="text-warning" isDisabled={!canInactivate || isStatusPending} onPress={() => void handleStatusChange(ProductStatus.Inactive)}>
							<Icon icon={CancelCircleIcon} className="icon-xs text-warning" />
							Inativar
						</Dropdown.Item>
						<Dropdown.Item id="archive" textValue="Arquivar" className="text-secondary" isDisabled={!canArchive || isStatusPending} onPress={() => void handleStatusChange(ProductStatus.Archived)}>
							<Icon icon={Archive01Icon} className="icon-xs text-secondary" />
							Arquivar
						</Dropdown.Item>
						<Dropdown.Item id="delete" textValue="Excluir produto" className="text-danger" onPress={() => setIsDeleteModalOpen(true)}>
							<Icon icon={Delete02Icon} className="icon-xs text-danger" />
							Excluir produto
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>
		</div>
	) : null;

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
		<div className="flex flex-col gap-6">
			<FormPageHeader
				icon={<Icon icon={PackageIcon} className="icon-md text-accent" />}
				title={isEditMode ? 'Editar Produto' : 'Novo Produto'}
				description={
					isEditMode ? `${resolvedProduct?.name}` : 'Cadastre um novo produto físico'
				}
				updatedAt={isEditMode ? resolvedProduct?.createdAt : null}
				backLabel={returnTo ? 'Voltar para checkout' : 'Voltar para produtos'}
				onBack={() => router.push(backRoute)}
				actions={headerActions}
			/>

			{isEditMode && (
				<UnsavedChangesAlert
					hasChanges={isDirty}
					onSave={handleSubmit}
					isSaving={isPending}
				/>
			)}

			<div className="flex flex-col gap-4">
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

				{selectedTab === 'basic' && (
					<SectionAccordion
						id="physical-basic"
						icon={TextIcon}
						title="Informações Básicas"
						summary={basicSummary}
						color="accent"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-accent-soft"
						iconClassName="icon-md text-accent"
						bodyClassName="p-4 sm:p-6"
					>
						<BasicInfoTab
							name={name}
							setName={(value) => setValue('name', value, { shouldDirty: true })}
							description={description ?? ''}
							setDescription={(value) => setValue('description', value || null, { shouldDirty: true })}
							externalId={externalId ?? ''}
							setExternalId={(value) => setValue('externalId', value || null, { shouldDirty: true })}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'price' && (
					<SectionAccordion
						id="physical-price"
						icon={Dollar01Icon}
						title="Preço"
						summary={priceSummary}
						color="success"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-success-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success-soft"
						iconClassName="icon-md text-success"
						bodyClassName="p-4 sm:p-6"
					>
						<PriceTab
							priceValue={priceValue ?? undefined}
							setPriceValue={(value) => setValue('price', value ?? null, { shouldDirty: true })}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'stock' && (
					<SectionAccordion
						id="physical-stock"
						icon={PackageIcon}
						title="Estoque"
						summary={stockSummary}
						color="warning"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-warning-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning-soft"
						iconClassName="icon-md text-warning"
						bodyClassName="p-4 sm:p-6"
					>
						<StockTab
							isEditMode={isEditMode}
							isUnlimitedStock={isUnlimitedStock}
							setIsUnlimitedStock={(value) => setValue('isUnlimitedStock', value, { shouldDirty: true })}
							stockQuantity={stockQuantity ?? undefined}
							setStockQuantity={(value) => setValue('stockQuantity', value ?? null, { shouldDirty: true })}
							showMainStock={showMainStock}
							showVariantStock={showVariantStock}
							variants={variants}
							onOpenMainAdjustment={handleOpenMainAdjustment}
							onOpenVariantAdjustment={handleOpenVariantAdjustment}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'images' && (
					<SectionAccordion
						id="physical-images"
						icon={Image01Icon}
						title="Imagens"
						summary={imagesSummary}
						color="secondary"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-secondary/30 bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-secondary/10"
						iconClassName="icon-md text-secondary"
						bodyClassName="p-4 sm:p-6"
					>
						<ImagesTab
							merchantId={merchantId}
							imageUrls={imageUrls}
							setImageUrls={(value) => setValue('imageUrls', value, { shouldDirty: true })}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'categories' && (
					<SectionAccordion
						id="physical-categories"
						icon={Tag01Icon}
						title="Categorias"
						summary={categoriesSummary}
						color="warning"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-warning-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning-soft"
						iconClassName="icon-md text-warning"
						bodyClassName="p-4 sm:p-6"
					>
						<CategoriesTab
							merchantId={merchantId}
							environment={environment}
							categories={categories}
							selectedCategoryIds={selectedCategoryIds}
							onSelectCategory={handleSelectCategory}
							onRemoveCategory={handleRemoveCategory}
							onCategoryCreated={handleCategoryCreated}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'coupons' && (
					<SectionAccordion
						id="physical-coupons"
						icon={Coupon01Icon}
						title="Cupons"
						summary={couponsSummary}
						color="accent"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-accent-soft"
						iconClassName="icon-md text-accent"
						bodyClassName="p-4 sm:p-6"
					>
						<CouponsTab
							merchantId={merchantId}
							environment={environment}
							selectedCouponIds={selectedCouponIds}
							selectedCoupons={selectedCoupons}
							onSelectCoupon={handleSelectCoupon}
							onRemoveCoupon={handleRemoveCoupon}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'variants' && (
					<SectionAccordion
						id="physical-variants"
						icon={Layers01Icon}
						title="Variantes"
						summary={variantsSummary}
						color="secondary"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-secondary/30 bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-secondary/10"
						iconClassName="icon-md text-secondary"
						bodyClassName="p-4 sm:p-6"
					>
						<VariantsTab
							merchantId={merchantId}
							isEditMode={isEditMode}
							isUnlimitedStock={isUnlimitedStock}
							variants={variants}
							pendingVariants={pendingVariants}
							onCreateVariant={() => setIsCreateVariantModalOpen(true)}
							onEditVariant={handleEditVariant}
							onDeleteVariant={handleDeleteVariant}
							onRemovePendingVariant={handleRemovePendingVariant}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{!isEditMode && selectedTab === 'review' && (
					<div className="flex flex-col gap-3">
						{hasValidatedReview && hasReviewErrors && <ReviewIssuesAlert issues={uniqueReviewValidationMessages} />}
						<SectionAccordion
							id="physical-review"
							icon={CheckmarkCircle02Icon}
							title="Revisão do produto físico"
							summary={reviewSummary}
							color="success"
							defaultExpanded={true}
							itemClassName="rounded-xl border border-success-soft-hover bg-surface"
							triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-content2 px-4 py-3"
							summaryClassName="text-xs text-muted"
							iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success-soft"
							iconClassName="icon-md text-success"
							bodyClassName="p-4 sm:p-6"
						>
							<ReviewStepLayout
								title="Revisão do produto físico"
								description="Confirme os dados abaixo antes de criar o produto."
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
									<div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
										<p className="text-xs text-muted">Estoque</p>
										<p className="text-sm font-medium">{isUnlimitedStock ? 'Ilimitado' : (stockQuantity ?? 0)}</p>
									</div>
									<div className="rounded-lg border border-content3 px-3 py-2">
										<p className="text-xs text-muted">Variantes pendentes</p>
										<p className="text-sm font-medium">{pendingVariants.length}</p>
									</div>
								</div>
							</ReviewStepLayout>
						</SectionAccordion>
					</div>
				)}

				{!isEditMode && (
					<div className="rounded-xl border border-divider bg-surface p-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
							<Button
								variant="secondary"
								onPress={currentWizardStepIndex === 0 ? () => router.push(backRoute) : handleWizardBack}
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

			</div>

			<CreateVariantInlineModal
				isOpen={isCreateVariantModalOpen}
				onOpenChange={setIsCreateVariantModalOpen}
				merchantId={merchantId}
				productType={ProductType.Physical}
				isUnlimitedStock={isUnlimitedStock}
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
					productType={ProductType.Physical}
					isUnlimitedStock={isUnlimitedStock}
				/>
			)}

			{isEditMode && productId && (
				<StockAdjustmentModal
					isOpen={isAdjustmentModalOpen}
					onOpenChange={setIsAdjustmentModalOpen}
					merchantId={merchantId}
					productId={productId}
					variantId={adjustingVariant?.id}
					variantName={adjustingVariant?.name}
					currentStock={adjustingVariant ? (adjustingVariant.stockQuantity ?? null) : (stockQuantity ?? null)}
					onSuccess={handleStockAdjustmentSuccess}
				/>
			)}

			{isEditMode && productId && (
				<DeleteProductModal
					isOpen={isDeleteModalOpen}
					onOpenChange={setIsDeleteModalOpen}
					merchantId={merchantId}
					productId={productId}
					productName={resolvedProduct?.name ?? 'este produto'}
					redirectUrl={backRoute}
				/>
			)}

		</div>
	);
}
