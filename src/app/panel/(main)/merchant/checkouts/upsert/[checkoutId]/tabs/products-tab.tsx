'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button, AlertDialog, Card, Input } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { CheckoutTabSaveLayout } from '../components/checkout-tab-save-layout';
import { InternalListBox } from '@/components/ui/internal-list-box';
import { useRouter } from 'next/navigation';
import {
	ShoppingBag02Icon,
	Add01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { updateMerchantCheckout } from '@/app/actions/merchant/checkouts';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import { AddProductModal } from '../modals/add-product-modal';
import { EditProductModal } from '../modals/edit-product-modal';
import { CheckoutSectionPreview } from '../components/checkout-section-preview';
import { Routes } from '@/router/routes';
import type { CheckoutData, CheckoutProductData } from '@/types/merchant/checkouts';
import { CheckoutProductSortableRow } from '../components/checkout-product-sortable-row';

interface GroupedProduct {
	productId: string;
	productName: string;
	productImageUrl: string | null;
	variants: CheckoutProductData[];
}

interface ProductsTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
	onDraftChange?: (draft: {
		count: number;
		hasPendingChanges: boolean;
		productOperations: Array<{
			operation: 'add' | 'update' | 'remove';
			checkoutProductId?: string;
			productId?: string;
			variantId?: string;
			displayOrder?: number;
			isActive?: boolean;
		}>;
	}) => void;
}

type CreateProductKind = 'physical' | 'digital';

function buildProductOperations(originalProducts: CheckoutProductData[], localProducts: CheckoutProductData[]) {
	const originalById = new Map(originalProducts.map((item) => [item.id, item]));
	const localById = new Map(localProducts.map((item) => [item.id, item]));

	const operations: Array<{
		operation: 'add' | 'update' | 'remove';
		checkoutProductId?: string;
		productId?: string;
		variantId?: string;
		displayOrder?: number;
		isActive?: boolean;
	}> = [];

	for (const originalItem of originalProducts) {
		if (!localById.has(originalItem.id)) {
			operations.push({
				operation: 'remove',
				checkoutProductId: originalItem.id,
			});
		}
	}

	for (const localItem of localProducts) {
		if (localItem.id.startsWith('local-')) {
			operations.push({
				operation: 'add',
				productId: localItem.productId,
				variantId: localItem.variantId ?? undefined,
			});
			continue;
		}

		const originalItem = originalById.get(localItem.id);
		if (!originalItem) continue;

		if (originalItem.displayOrder === localItem.displayOrder && originalItem.isActive === localItem.isActive) {
			continue;
		}

		operations.push({
			operation: 'update',
			checkoutProductId: localItem.id,
			displayOrder: localItem.displayOrder,
			isActive: localItem.isActive,
		});
	}

	return operations;
}

export function ProductsTab({ checkout, merchantId, onRefresh, onDraftChange }: ProductsTabProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<CheckoutProductData | null>(null);
	const [deletingProduct, setDeletingProduct] = useState<CheckoutProductData | null>(null);
	const [draftProducts, setDraftProducts] = useState<CheckoutProductData[] | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

	const localProducts = draftProducts ?? checkout.products;
	const productOperations = useMemo(
		() => buildProductOperations(checkout.products, localProducts),
		[checkout.products, localProducts]
	);
	const hasChanges = productOperations.length > 0;

	useEffect(() => {
		onDraftChange?.({
			count: localProducts.length,
			hasPendingChanges: hasChanges,
			productOperations,
		});
	}, [localProducts.length, hasChanges, productOperations, onDraftChange]);

	const existingProductVariantKeys = localProducts.map((p) => `${p.productId}:${p.variantId ?? 'base'}`);

	const groupedProducts = useMemo<GroupedProduct[]>(() => {
		const groups = new Map<string, GroupedProduct>();
		const sortedProducts = [...localProducts].sort((a, b) => a.displayOrder - b.displayOrder);

		for (const product of sortedProducts) {
			const existing = groups.get(product.productId);
			if (existing) {
				existing.variants.push(product);
			} else {
				groups.set(product.productId, {
					productId: product.productId,
					productName: product.productName,
					productImageUrl: product.productImageUrl,
					variants: [product],
				});
			}
		}

		return Array.from(groups.values());
	}, [localProducts]);

	const filteredRows = useMemo<CheckoutProductData[]>(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return [...localProducts]
			.filter((variant) => {
				if (!normalizedSearch) return true;

				const productNameMatch = variant.productName.toLowerCase().includes(normalizedSearch);
				const variantNameMatch = (variant.variantName || 'produto base').toLowerCase().includes(normalizedSearch);
				return productNameMatch || variantNameMatch;
			})
			.sort((a, b) => {
				return a.displayOrder - b.displayOrder;
			});
	}, [localProducts, searchTerm]);

	const totalVariants = localProducts.length;
	const totalProducts = groupedProducts.length;
	const activeVariants = localProducts.filter((item) => item.isActive).length;
	const inactiveVariants = totalVariants - activeVariants;
	const canReorder = !searchTerm.trim();

	function handleGoToCreateProduct(kind: CreateProductKind = 'physical') {
		const returnTo = encodeURIComponent(Routes.panel.merchant.checkoutsUpsert(checkout.id));

		if (kind === 'digital') {
			router.push(`${Routes.panel.merchant.digitalProductsUpsert('new')}?returnTo=${returnTo}`);
			return;
		}

		router.push(`${Routes.panel.merchant.physicalProductsUpsert('new')}?returnTo=${returnTo}`);
	}

	function handleAddProducts(products: CheckoutProductData[]) {
		setDraftProducts((prev) => {
			const base = prev ?? checkout.products;
			let nextDisplayOrder = base.reduce((max, item) => Math.max(max, item.displayOrder), 0) + 1;

			const withOrder = products.map((item) => {
				const value = { ...item, displayOrder: nextDisplayOrder };
				nextDisplayOrder += 1;
				return value;
			});

			return [...base, ...withOrder];
		});

		setIsAddOpen(false);
	}

	function handleEditApply(nextVariants: CheckoutProductData[]) {
		if (!editingProduct) return;

		setDraftProducts((prev) => {
			const base = prev ?? checkout.products;
			const withoutCurrentProduct = base.filter((item) => item.productId !== editingProduct.productId);
			return [...withoutCurrentProduct, ...nextVariants];
		});

		setEditingProduct(null);
	}

	function handleRemoveProduct() {
		if (!deletingProduct) return;

		setDraftProducts((prev) => {
			const base = prev ?? checkout.products;
			return base.filter((item) => item.id !== deletingProduct.id);
		});

		setDeletingProduct(null);

		toast('Produto removido', {
			description: 'O item foi removido localmente. Clique em salvar para aplicar no checkout.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleSave() {
		if (productOperations.length === 0) {
			return;
		}

		startTransition(async () => {
			const response = await updateMerchantCheckout(merchantId, checkout.id, { productOperations });

			if (response?.error) {
				toast('Erro ao salvar', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Produtos salvos', {
				description: 'As alteracoes de produtos foram salvas com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});

			setDraftProducts(null);
			onRefresh();
		});
	}

	function handleDragEnd(event: DragEndEvent) {
		if (!canReorder) {
			return;
		}

		const activeId = String(event.active.id);
		const overId = event.over ? String(event.over.id) : null;

		if (!overId || activeId === overId) {
			return;
		}

		setDraftProducts((prev) => {
			const base = [...(prev ?? checkout.products)].sort((a, b) => a.displayOrder - b.displayOrder);
			const sourceIndex = base.findIndex((item) => item.id === activeId);
			const targetIndex = base.findIndex((item) => item.id === overId);

			if (sourceIndex < 0 || targetIndex < 0) {
				return prev ?? checkout.products;
			}

			const reordered = arrayMove(base, sourceIndex, targetIndex);

			return reordered.map((item, index) => ({
				...item,
				displayOrder: index + 1,
			}));
		});
	}

	return (
		<CheckoutTabSaveLayout
			hasChanges={hasChanges}
			onSave={handleSave}
			isSaving={isPending}
			className="flex flex-col gap-4"
		>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-7">
					<SectionAccordion
						id="checkout-products"
						icon={ShoppingBag02Icon}
						title="Produtos do checkout"
						summary={`${totalProducts} produtos • ${totalVariants} variacoes • ${activeVariants} ativas • ${inactiveVariants} inativas`}
						defaultExpanded
					>
						<div className="mb-2 flex flex-wrap items-center gap-2">
							<Button variant="primary" size="sm" onPress={() => setIsAddOpen(true)}>
								<Icon icon={Add01Icon} className="icon-sm" />
								Adicionar produto
							</Button>
						</div>

						{groupedProducts.length > 0 && (
							<div className="mb-3 flex flex-col gap-2">
								<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
									<Input
										variant="secondary"
										value={searchTerm}
										onChange={(event) => setSearchTerm(event.target.value)}
										placeholder="Buscar por produto ou variação"
										className="w-full lg:max-w-sm"
									/>
									{canReorder ? (
										<p className="text-xs text-muted">
											Arraste os itens para definir a ordem de exibição no checkout.
										</p>
									) : (
										<p className="text-xs text-muted">Limpe a busca para reordenar com drag and drop.</p>
									)}
								</div>
							</div>
						)}

						{groupedProducts.length === 0 ? (
							<Card className="border border-dashed border-border bg-surface-secondary">
								<Card.Content className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
										<Icon icon={InformationCircleIcon} className="icon-md text-accent" />
									</div>
									<div className="flex flex-col gap-1">
										<p className="text-sm font-semibold text-foreground">Nenhum produto vinculado</p>
										<p className="text-sm text-muted-foreground">
											Use Adicionar produto para incluir itens existentes ou Criar novo produto para cadastrar
											um item e voltar.
										</p>
									</div>
								</Card.Content>
							</Card>
						) : filteredRows.length === 0 ? (
							<Card className="border border-dashed border-border bg-surface-secondary">
								<Card.Content className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
										<Icon icon={InformationCircleIcon} className="icon-md text-accent" />
									</div>
									<div className="flex flex-col gap-1">
										<p className="text-sm font-semibold">Nenhum resultado para os filtros aplicados</p>
										<p className="text-sm text-muted">Ajuste a busca para visualizar os produtos adicionados.</p>
									</div>
								</Card.Content>
							</Card>
						) : (
							<div className="flex max-h-150 flex-col gap-2 overflow-y-auto pr-1">
								<InternalListBox
									ariaLabel="Produtos do checkout"
									sortable
									itemIds={filteredRows.map((variant) => variant.id)}
									onDragEnd={handleDragEnd}
								>
									{filteredRows.map((variant) => (
										<CheckoutProductSortableRow
											key={variant.id}
											variant={variant}
											canReorder={canReorder}
											onEdit={setEditingProduct}
											onDelete={setDeletingProduct}
										/>
									))}
								</InternalListBox>
							</div>
						)}
					</SectionAccordion>
				</div>

				<div className="lg:col-span-5">
					<CheckoutSectionPreview
						title="Lista de Produtos"
						description="Veja como os produtos e variações são exibidos para o cliente. Você pode reordenar os itens arrastando-os na lista ao lado."
						src="https://placehold.co/600x800?text=Preview+Lista+de+Produtos"
					/>
				</div>
			</div>

			<AddProductModal
				isOpen={isAddOpen}
				onOpenChange={setIsAddOpen}
				merchantId={merchantId}
				environment={checkout.environment}
				existingProductVariantKeys={existingProductVariantKeys}
				onAddProducts={handleAddProducts}
				onCreateProduct={handleGoToCreateProduct}
			/>

			{editingProduct && (
				<EditProductModal
					isOpen={!!editingProduct}
					onOpenChange={(open: boolean) => !open && setEditingProduct(null)}
					merchantId={merchantId}
					product={editingProduct}
					allProductVariantsInCheckout={localProducts}
					onApplyChanges={handleEditApply}
				/>
			)}

			<AlertDialog.Backdrop
				isOpen={!!deletingProduct}
				onOpenChange={(open: boolean) => !open && setDeletingProduct(null)}
			>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-md">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>Remover variacao</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Tem certeza que deseja remover <strong>{deletingProduct?.productName}</strong>
								{deletingProduct?.variantName && <strong>{` - ${deletingProduct.variantName}`}</strong>} do checkout?
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								Cancelar
							</Button>
							<AsyncButton variant="danger" onPress={handleRemoveProduct} isPending={isPending}>
								Remover
							</AsyncButton>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</CheckoutTabSaveLayout>
	);
}
