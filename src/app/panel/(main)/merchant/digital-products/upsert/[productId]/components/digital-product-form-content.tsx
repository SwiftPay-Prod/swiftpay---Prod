'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dropdown } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	Alert01Icon,
	InformationCircleIcon,
	FileCloudIcon,
	Delete02Icon,
	MoreHorizontalCircle01Icon,
	Archive01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Tick01Icon,
} from '@hugeicons/core-free-icons';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';
import {
	createMerchantProduct,
	updateMerchantProduct,
	updateMerchantProductStatus,
	createProductVariant,
	deleteProductVariant,
} from '@/app/actions/merchant/products';
import { createBulkProductDigitalItems } from '@/app/actions/merchant/digital-items';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { ReviewIssuesAlert, ReviewStepLayout } from '@/components/ui/review-step-layout';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { CreateVariantInlineModal } from '@/components/merchant/products/modals/create-variant-inline-modal';
import { VariantModal } from '@/components/merchant/products/modals/variant-modal';
import { DeleteProductModal } from '@/components/merchant/products/modals/delete-product-modal';
import { formatCurrency } from '@/utils/currency';
import type { PendingDigitalItem } from './digital-items-section';
import { toast } from '@heroui/react';
import { ProductType, ProductStatus, CategoryStatus, PaymentEnvironment } from '@/types/enums';
import type {
	MinimalCategoryData,
	ProductData,
	ProductVariantData,
	CreateVariantRequest,
} from '@/types/merchant/products';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import { Routes } from '@/router/routes';
import { digitalProductFormSchema, type DigitalProductFormData } from './digital-product-form-schema';
import {
	BasicInfoTab,
	PriceTab,
	ImagesTab,
	CategoriesTab,
	CouponsTab,
	VariantsTab,
	DigitalItemsTab,
	type PendingVariant,
} from './tabs';

const DIGITAL_PRODUCT_WIZARD_STEPS = [
	{ key: 'basic', title: 'Informações', description: 'Defina nome e identificadores do produto.', isRequired: true },
	{ key: 'images', title: 'Imagens', description: 'Adicione imagens para apresentação do produto.' },
	{ key: 'categories', title: 'Categorias', description: 'Organize o produto nas categorias da loja.' },
	{ key: 'coupons', title: 'Cupons', description: 'Associe cupons de desconto aplicáveis.' },
	{ key: 'variants', title: 'Variantes', description: 'Crie variações de preço e identificação.' },
	{ key: 'digital-items', title: 'Itens', description: 'Cadastre os conteúdos de entrega digital.' },
	{ key: 'price', title: 'Preço', description: 'Configure o valor de venda do produto digital.', isRequired: true },
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

export interface DigitalProductFormProps {
	merchantId: string;
	environment: PaymentEnvironment;
	product?: ProductData | null;
}

export function DigitalProductFormContent({ merchantId, environment, product }: DigitalProductFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnTo = searchParams.get('returnTo');
	const backRoute = returnTo || Routes.panel.merchant.productsByType('digital');
	const resolvedProduct = product ?? null;
	const isEditMode = !!resolvedProduct;
	const productId = resolvedProduct?.id;

	const [selectedTab, setSelectedTab] = useState<string>('basic');
	const [isPending, startTransition] = useTransition();

	const defaultValues = useMemo<DigitalProductFormData>(() => ({
		type: ProductType.Digital,
		name: resolvedProduct?.name ?? '',
		description: resolvedProduct?.description ?? null,
		externalId: resolvedProduct?.externalId ?? null,
		status: resolvedProduct?.status ?? ProductStatus.Active,
		price: resolvedProduct?.price ?? null,
		imageUrls: resolvedProduct?.imageUrls ?? [],
		categoryIds: resolvedProduct?.categories?.map((c) => c.id) ?? [],
		couponIds: resolvedProduct?.coupons?.map((c) => c.id) ?? [],
		pendingVariants: [],
		isUnlimitedDigitalStock: resolvedProduct?.isUnlimitedDigitalStock ?? true,
		pendingDigitalItems: [],
	}), [resolvedProduct]);

	const form = useForm<DigitalProductFormData>({
		resolver: zodResolver(digitalProductFormSchema),
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
	const isUnlimitedDigitalStock = useWatch({ control, name: 'isUnlimitedDigitalStock' });
	const pendingDigitalItems = useWatch({ control, name: 'pendingDigitalItems' });

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
	const [hasValidatedReview, setHasValidatedReview] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isStatusPending, setIsStatusPending] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<ProductStatus>(resolvedProduct?.status ?? ProductStatus.Active);


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
		if (!selectedCouponIds.includes(coupon.id)) {
			setValue('couponIds', [...selectedCouponIds, coupon.id], { shouldDirty: true });
			if (!coupons.some((c) => c.id === coupon.id)) {
				setCoupons([...coupons, coupon]);
			}
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
		const res = await createProductVariant(merchantId, productId, variant);
		if (res?.error) {
			toast('Erro ao criar variante', {
				description: res.error.message ?? 'Tente novamente.',
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
				description: res.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}
		setVariants(variants.filter((v) => v.id !== variantId));
		toast('Variante excluída', {
			description: 'A variante foi removida com sucesso.',
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

	function handleUnlimitedStockChange(value: boolean) {
		setValue('isUnlimitedDigitalStock', value, { shouldDirty: true });
		if (value && pendingDigitalItems.length > 1) {
			setValue('pendingDigitalItems', pendingDigitalItems.slice(0, 1), { shouldDirty: true });
			toast('Estoque ilimitado', {
				description: 'Apenas 1 item digital é permitido neste modo.',
				indicator: <Icon icon={InformationCircleIcon} className="icon-sm" />,
				variant: 'default',
			});
		}
	}

	function handleSetPendingDigitalItems(items: PendingDigitalItem[]) {
		setValue('pendingDigitalItems', items, { shouldDirty: true });
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
			const priceCents = data.price ?? null;

			if (isEditMode && productId) {
				const res = await updateMerchantProduct(merchantId, productId, {
					name: data.name.trim(),
					type: ProductType.Digital,
					description: data.description?.trim() || null,
					externalId: data.externalId?.trim() || null,
					price: priceCents,
					imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [],
					categoryIds: data.categoryIds,
					couponIds: data.couponIds,
					isUnlimitedDigitalStock: data.isUnlimitedDigitalStock,
				});

				if (res?.error) {
					toast('Erro ao atualizar produto', {
						description: res.error.message ?? 'Tente novamente.',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}

				let hasErrors = false;

				if (data.pendingDigitalItems.length > 0) {
					const itemsByType = data.pendingDigitalItems.reduce(
						(acc, item) => {
							const key = item.type;
							if (!acc[key]) acc[key] = [];
							acc[key].push(item.content);
							return acc;
						},
						{} as Record<string, string[]>
					);

					for (const [type, contents] of Object.entries(itemsByType)) {
						const bulkRes = await createBulkProductDigitalItems(merchantId, productId, {
							type: type as PendingDigitalItem['type'],
							contents,
							variantId: null,
						});

						if (bulkRes?.error) {
							hasErrors = true;
						}
					}

					setValue('pendingDigitalItems', []);
				}

				if (hasErrors) {
					toast('Produto atualizado com avisos', {
						description: 'Alguns itens digitais falharam ao ser criados.',
						indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
						variant: 'warning',
					});
				} else {
					toast('Produto atualizado', {
						description: res?.message || 'O produto foi atualizado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}

				reset({
					...data,
					pendingDigitalItems: [],
				});
				router.refresh();
				return;
			}

			const res = await createMerchantProduct(merchantId, {
				name: data.name.trim(),
				type: ProductType.Digital,
				status: ProductStatus.Active,
				environment,
				description: data.description?.trim() || null,
				externalId: data.externalId?.trim() || null,
				price: priceCents,
				imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [],
				categoryIds: data.categoryIds,
				isUnlimitedDigitalStock: data.isUnlimitedDigitalStock,
			});

			if (res?.error) {
				toast('Erro ao criar produto', {
					description: res.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const createdProductId = res?.data?.id;

			if (createdProductId) {
				let hasErrors = false;

				if (data.pendingVariants.length > 0) {
					let variantErrors = 0;
					for (const variant of data.pendingVariants) {
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
						hasErrors = true;
					}
				}

				if (data.pendingDigitalItems.length > 0) {
					const itemsByType = data.pendingDigitalItems.reduce(
						(acc, item) => {
							const key = item.type;
							if (!acc[key]) acc[key] = [];
							acc[key].push(item.content);
							return acc;
						},
						{} as Record<string, string[]>
					);

					for (const [type, contents] of Object.entries(itemsByType)) {
						const bulkRes = await createBulkProductDigitalItems(merchantId, createdProductId, {
							type: type as PendingDigitalItem['type'],
							contents,
							variantId: null,
						});

						if (bulkRes?.error) {
							hasErrors = true;
						}
					}
				}

				if (hasErrors) {
					toast('Produto criado com avisos', {
						description: 'Alguns itens digitais falharam ao ser criados.',
						indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
						variant: 'warning',
					});
				} else if (data.pendingVariants.length > 0 || data.pendingDigitalItems.length > 0) {
					toast('Produto criado', {
						description: 'O produto foi criado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				} else {
					toast('Produto criado', {
						description: res?.message || 'O produto foi criado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}
			} else {
				toast('Produto criado', {
					description: res?.message || 'O produto foi criado com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
			}

			if (!isEditMode && returnTo) {
				router.push(returnTo);
				return;
			}

			if (createdProductId) {
				router.push(Routes.panel.merchant.productsByType('digital'));
			} else {
				router.push(Routes.panel.merchant.productsByType('digital'));
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
	const imagesSummary = imageUrls.length > 0 ? `${imageUrls.length} imagem(ns)` : 'Nenhuma imagem';
	const categoriesSummary = selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} categoria(s)` : 'Nenhuma categoria';
	const couponsSummary = selectedCouponIds.length > 0 ? `${selectedCouponIds.length} cupom(ns)` : 'Nenhum cupom';
	const variantsSummary = isEditMode
		? `${variants.length} variante(s) cadastrada(s)`
		: `${pendingVariants.length} variante(s) pendente(s)`;
	const digitalItemsSummary = isEditMode
		? 'Gerencie os itens digitais do produto'
		: `${pendingDigitalItems.length} item(ns) digital(is) pendente(s)`;
	const reviewSummary = hasReviewErrors
		? `${uniqueReviewValidationMessages.length} pendência(s)`
		: 'Tudo pronto para salvar';
	const stepDefinitions = isEditMode
		? DIGITAL_PRODUCT_WIZARD_STEPS.filter((step) => step.key !== 'review')
		: DIGITAL_PRODUCT_WIZARD_STEPS;
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
					<Dropdown.Menu aria-label="Ações do produto digital">
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
				icon={<Icon icon={FileCloudIcon} className="icon-md text-accent" />}
				title={isEditMode ? 'Editar Produto' : 'Novo Produto'}
				description={
					isEditMode ? `${resolvedProduct?.name}` : 'Cadastre um novo produto digital'
				}
				updatedAt={isEditMode ? resolvedProduct?.createdAt : null}
				backLabel={returnTo ? 'Voltar para checkout' : 'Voltar para produtos digitais'}
				onBack={() => router.push(backRoute)}
				actions={headerActions}
			/>

			{isEditMode && <UnsavedChangesAlert hasChanges={isDirty} onSave={handleSubmit} isSaving={isPending} />}

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
						id="digital-basic"
						icon={FileCloudIcon}
						title="Informações Básicas"
						summary={basicSummary}
						color="accent"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
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
							isEditMode={isEditMode}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'price' && (
					<SectionAccordion
						id="digital-price"
						icon={InformationCircleIcon}
						title="Preço"
						summary={priceSummary}
						color="success"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-success-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success-soft"
						iconClassName="icon-md text-success"
						bodyClassName="p-4 sm:p-6"
					>
						<PriceTab
							priceInCents={priceValue ?? null}
							setPriceInCents={(cents) => setValue('price', cents, { shouldDirty: true })}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'images' && (
					<SectionAccordion
						id="digital-images"
						icon={InformationCircleIcon}
						title="Imagens"
						summary={imagesSummary}
						color="secondary"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-secondary/30 bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
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
						id="digital-categories"
						icon={InformationCircleIcon}
						title="Categorias"
						summary={categoriesSummary}
						color="warning"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-warning-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-warning-soft"
						iconClassName="icon-md text-warning"
						bodyClassName="p-4 sm:p-6"
					>
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
					</SectionAccordion>
				)}

				{selectedTab === 'coupons' && (
					<SectionAccordion
						id="digital-coupons"
						icon={InformationCircleIcon}
						title="Cupons"
						summary={couponsSummary}
						color="accent"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
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
						id="digital-variants"
						icon={InformationCircleIcon}
						title="Variantes"
						summary={variantsSummary}
						color="secondary"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-secondary/30 bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-secondary/10"
						iconClassName="icon-md text-secondary"
						bodyClassName="p-4 sm:p-6"
					>
						<VariantsTab
							isEditMode={isEditMode}
							variants={variants}
							pendingVariants={pendingVariants}
							isUnlimitedStock={isUnlimitedDigitalStock}
							onOpenCreateModal={() => setIsCreateVariantModalOpen(true)}
							onEditVariant={handleEditVariant}
							onDeleteVariant={handleDeleteVariant}
							onRemovePendingVariant={handleRemovePendingVariant}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{selectedTab === 'digital-items' && (
					<SectionAccordion
						id="digital-items"
						icon={InformationCircleIcon}
						title="Itens Digitais"
						summary={digitalItemsSummary}
						color="accent"
						defaultExpanded={true}
						itemClassName="rounded-xl border border-accent-soft-hover bg-surface"
						triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
						summaryClassName="text-xs text-muted"
						iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-accent-soft"
						iconClassName="icon-md text-accent"
						bodyClassName="p-4 sm:p-6"
					>
						<DigitalItemsTab
							merchantId={merchantId}
							productId={productId ?? null}
							variants={variants}
							isEditMode={isEditMode}
							pendingDigitalItems={pendingDigitalItems}
							setPendingDigitalItems={handleSetPendingDigitalItems}
							isUnlimitedStock={isUnlimitedDigitalStock}
							onUnlimitedStockChange={handleUnlimitedStockChange}
							disabled={false}
						/>
					</SectionAccordion>
				)}

				{!isEditMode && selectedTab === 'review' && (
					<div className="flex flex-col gap-3">
						{hasValidatedReview && hasReviewErrors && <ReviewIssuesAlert issues={uniqueReviewValidationMessages} />}
						<SectionAccordion
							id="digital-review"
							icon={InformationCircleIcon}
							title="Revisão do produto digital"
							summary={reviewSummary}
							color="success"
							defaultExpanded={true}
							itemClassName="rounded-xl border border-success-soft-hover bg-surface"
							triggerClassName="flex w-full items-center justify-between rounded-t-xl bg-surface-deep px-4 py-3"
							summaryClassName="text-xs text-muted"
							iconContainerClassName="flex size-10 items-center justify-center rounded-lg bg-success-soft"
							iconClassName="icon-md text-success"
							bodyClassName="p-4 sm:p-6"
						>
							<ReviewStepLayout
								title="Revisão do produto digital"
								description="Confira os dados abaixo antes de criar o produto."
							>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
									<div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
										<p className="text-xs text-muted">Cupons</p>
										<p className="text-sm font-medium">{selectedCouponIds.length}</p>
									</div>
									<div className="rounded-lg border border-border px-3 py-2">
										<p className="text-xs text-muted">Variantes pendentes</p>
										<p className="text-sm font-medium">{pendingVariants.length}</p>
									</div>
									<div className="rounded-lg border border-border px-3 py-2">
										<p className="text-xs text-muted">Itens digitais pendentes</p>
										<p className="text-sm font-medium">{pendingDigitalItems.length}</p>
									</div>
								</div>
							</ReviewStepLayout>
						</SectionAccordion>
					</div>
				)}

				{!isEditMode && (
					<div className="rounded-xl border border-border bg-surface p-4">
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
				productType={ProductType.Digital}
				isUnlimitedStock={isUnlimitedDigitalStock}
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
					productType={ProductType.Digital}
					isUnlimitedStock={isUnlimitedDigitalStock}
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
