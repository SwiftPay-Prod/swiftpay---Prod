'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
	Modal,
	Button,
	Dropdown,
	TextField,
	Input,
	Label,
	Skeleton,
	Avatar,
	ListBox,
	Description,
	Surface,
	Spinner,
	type Selection,
	type Key,
	Card,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Search01Icon,
	Package01Icon,
	Add01Icon,
	ArrowRight01Icon,
	ArrowLeft01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	PlusSignIcon,
	Layers01Icon,
} from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { MultiSelectChips } from '@/components/ui/multi-select-chips';
import { listMerchantProducts, getMerchantProduct } from '@/app/actions/merchant/products';
import { formatCurrency } from '@/utils/currency';
import { toast } from '@heroui/react';
import { EmptyState } from '@/components/ui/empty-state';
import type { MinimalProductData, ProductData } from '@/types/merchant/products';
import type { PaymentEnvironment } from '@/types/enums';
import { VariantStatus } from '@/types/enums';
import type { CheckoutProductData } from '@/types/merchant/checkouts';

interface AddProductModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	environment: PaymentEnvironment;
	existingProductVariantKeys: string[];
	onAddProducts: (products: CheckoutProductData[]) => void;
	onCreateProduct: (type: 'physical' | 'digital') => void;
}

type Step = 'catalog' | 'variants' | 'confirm';

const PAGE_SIZE = 10;

function getProductVariantKey(productId: string, variantId: string | null): string {
	return `${productId}:${variantId ?? 'base'}`;
}

export function AddProductModal({
	isOpen,
	onOpenChange,
	merchantId,
	environment,
	existingProductVariantKeys,
	onAddProducts,
	onCreateProduct,
}: AddProductModalProps) {
	const [step, setStep] = useState<Step>('catalog');
	const [isPending, startTransition] = useTransition();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isLoadingProduct, setIsLoadingProduct] = useState(false);

	const [searchValue, setSearchValue] = useState('');
	const [selectedType, setSelectedType] = useState<'Physical' | 'Digital'>('Physical');
	const [products, setProducts] = useState<MinimalProductData[]>([]);
	const [selectedProductKey, setSelectedProductKey] = useState<Selection>(new Set());
	const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
	const [selectedVariantIds, setSelectedVariantIds] = useState<Key[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);

	const selectedProductId =
		selectedProductKey === 'all' ? null : (Array.from(selectedProductKey as Set<string>)[0] ?? null);

	const availableProducts = useMemo(() => {
		const withoutAdded = products.filter(
			(product) => !existingProductVariantKeys.includes(getProductVariantKey(product.id, null))
		);

		if (selectedType === 'Digital') {
			return withoutAdded.filter((product) => product.type === 'Digital');
		}

		return withoutAdded.filter((product) => product.type !== 'Digital');
	}, [products, existingProductVariantKeys, selectedType]);

	const selectedProductFromList = selectedProductId
		? (availableProducts.find((p) => p.id === selectedProductId) ?? null)
		: null;

	const activeVariants = selectedProduct?.variants.filter((variant) => variant.status === VariantStatus.Active) ?? [];
	const variantOptions = activeVariants.map((variant) => {
		const alreadyAdded = existingProductVariantKeys.includes(
			getProductVariantKey(selectedProduct?.id ?? '', variant.id)
		);

		return {
			id: variant.id,
			label: variant.name,
			description: formatCurrency(variant.price),
			isDisabled: alreadyAdded,
			disabledReason: alreadyAdded ? 'Ja adicionado' : undefined,
		};
	});

	const selectedVariants = activeVariants.filter((variant) => selectedVariantIds.map(String).includes(variant.id));
	const hasVariantSelection = selectedVariantIds.length > 0;
	const totalSelection = activeVariants.length > 0 ? selectedVariantIds.length : selectedProduct ? 1 : 0;

	const fetchProducts = useCallback(
		async (append: boolean, basePage: number = 1) => {
			const targetPage = append ? basePage + 1 : 1;

			if (append) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}

			const response = await listMerchantProducts(merchantId, {
				environment,
				search: searchValue || undefined,
				page: targetPage,
				pageSize: PAGE_SIZE,
			});

			const newItems = response?.data?.items ?? [];
			const totalPages = response?.data?.totalPages ?? 1;

			if (append) {
				setProducts((prev) => [...prev, ...newItems]);
			} else {
				setProducts(newItems);
			}

			setHasMore(targetPage < totalPages);
			setPage(targetPage);
			setIsLoading(false);
			setIsLoadingMore(false);
		},
		[merchantId, environment, searchValue]
	);

	useEffect(() => {
		if (!isOpen) return;
		if (step !== 'catalog') return;

		let cancelled = false;

		Promise.resolve().then(() => {
			if (!cancelled) {
				void fetchProducts(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [isOpen, step, selectedType, fetchProducts]);

	function resetState() {
		setStep('catalog');
		setIsLoading(false);
		setIsLoadingMore(false);
		setIsLoadingProduct(false);
		setSearchValue('');
		setSelectedType('Physical');
		setProducts([]);
		setSelectedProductKey(new Set());
		setSelectedProduct(null);
		setSelectedVariantIds([]);
		setPage(1);
		setHasMore(false);
	}

	function handleClose() {
		onOpenChange(false);
		resetState();
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			handleClose();
		}
	}

	function handleSelectionChange(keys: Selection) {
		setSelectedProductKey(keys);
	}

	function handleCreateProduct(type: 'physical' | 'digital') {
		handleClose();
		onCreateProduct(type);
	}

	async function handleSelectProduct() {
		if (!selectedProductFromList) return;

		setIsLoadingProduct(true);
		const response = await getMerchantProduct(merchantId, selectedProductFromList.id);
		setIsLoadingProduct(false);

		if (!response?.data) {
			toast('Erro ao carregar produto', {
				description: 'Nao foi possivel carregar os dados do produto.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		const product = response.data;
		setSelectedProduct(product);

		const availableVariants = product.variants
			.filter((variant) => variant.status === VariantStatus.Active)
			.filter((variant) => !existingProductVariantKeys.includes(getProductVariantKey(product.id, variant.id)));

		if (availableVariants.length === 0 && product.variants.some((variant) => variant.status === VariantStatus.Active)) {
			toast('Nenhuma variante disponivel', {
				description: 'Todas as variantes desse produto ja estao no checkout.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		if (availableVariants.length > 0) {
			setSelectedVariantIds(availableVariants.map((variant) => variant.id));
			setStep('variants');
			return;
		}

		const baseKey = getProductVariantKey(product.id, null);
		if (existingProductVariantKeys.includes(baseKey)) {
			toast('Produto ja adicionado', {
				description: 'Este produto ja foi vinculado ao checkout.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		setStep('confirm');
	}

	function handleConfirmVariants() {
		if (!hasVariantSelection) {
			toast('Selecione ao menos uma variante', {
				description: 'Escolha uma ou mais variantes para continuar.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		setStep('confirm');
	}

	function handleAddProducts() {
		if (!selectedProduct) return;

		startTransition(async () => {
			const itemsToAdd: CheckoutProductData[] = [];

			if (activeVariants.length === 0) {
				itemsToAdd.push({
					id: `local-${selectedProduct.id}-base-${crypto.randomUUID()}`,
					productId: selectedProduct.id,
					variantId: null,
					productName: selectedProduct.name,
					productImageUrl: selectedProduct.imageUrl,
					variantName: null,
					displayOrder: 0,
					customPrice: null,
					originalPrice: selectedProduct.price ?? 0,
					quantity: 1,
					maxQuantity: null,
					isActive: true,
				});
			} else {
				for (const variantId of selectedVariantIds.map(String)) {
					const variant = activeVariants.find((value) => value.id === variantId);
					if (!variant) continue;

					itemsToAdd.push({
						id: `local-${selectedProduct.id}-${variant.id}-${crypto.randomUUID()}`,
						productId: selectedProduct.id,
						variantId: variant.id,
						productName: selectedProduct.name,
						productImageUrl: selectedProduct.imageUrl,
						variantName: variant.name,
						displayOrder: 0,
						customPrice: null,
						originalPrice: variant.price,
						quantity: 1,
						maxQuantity: null,
						isActive: true,
					});
				}
			}

			onAddProducts(itemsToAdd);

			handleClose();
		});
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Package01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Adicionar produto</Modal.Heading>
						<p className="text-sm text-muted">
							{step === 'catalog' && 'Selecione um produto existente para vincular ao checkout.'}
							{step === 'variants' && 'Escolha as variantes que devem ficar disponiveis.'}
							{step === 'confirm' && 'Revise os itens escolhidos antes de concluir.'}
						</p>
					</Modal.Header>

					<Modal.Body className="space-y-4">
						{step === 'catalog' && (
							<>
								<div className="flex items-center justify-between">
									<div className="flex flex-wrap gap-2">
										<Button
											size="sm"
											variant={selectedType === 'Physical' ? 'primary' : 'tertiary'}
											onPress={() => setSelectedType('Physical')}
										>
											Fisicos
										</Button>
										<Button
											size="sm"
											variant={selectedType === 'Digital' ? 'primary' : 'tertiary'}
											onPress={() => setSelectedType('Digital')}
										>
											Digitais
										</Button>
									</div>

									<Dropdown>
										<Button variant="secondary">
											<Icon icon={PlusSignIcon} className="icon-sm" />
											Criar produto
										</Button>
										<Dropdown.Popover className="min-w-52">
											<Dropdown.Menu aria-label="Criar produto">
												<Dropdown.Item
													id="create-physical-product"
													textValue="Criar produto fisico"
													onPress={() => handleCreateProduct('physical')}
												>
													<Icon icon={Package01Icon} className="icon-xs" />
													Criar produto fisico
												</Dropdown.Item>
												<Dropdown.Item
													id="create-digital-product"
													textValue="Criar produto digital"
													onPress={() => handleCreateProduct('digital')}
												>
													<Icon icon={Package01Icon} className="icon-xs" />
													Criar produto digital
												</Dropdown.Item>
											</Dropdown.Menu>
										</Dropdown.Popover>
									</Dropdown>
								</div>

								<TextField variant="secondary" value={searchValue} onChange={setSearchValue}>
									<Label className="sr-only">Buscar produto</Label>
									<div className="relative">
										<Icon icon={Search01Icon} className="icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
										<Input variant="secondary" placeholder="Buscar por nome" className="pl-10" />
									</div>
								</TextField>

								{isLoading ? (
									<div className="space-y-2">
										{Array.from({ length: 4 }).map((_, index) => (
											<Skeleton key={index} className="h-16 rounded-lg" />
										))}
									</div>
								) : availableProducts.length === 0 ? (
									<EmptyState>
										<EmptyState.Indicator>
											<Icon icon={Package01Icon} className="icon-lg" />
										</EmptyState.Indicator>
										<EmptyState.Heading>Nenhum produto disponivel</EmptyState.Heading>
										<EmptyState.Description>
											Ajuste os filtros ou crie um produto novo para continuar.
										</EmptyState.Description>
									</EmptyState>
								) : (
									<Surface className="max-h-80 overflow-y-auto rounded-xl">
										<ListBox
											aria-label="Selecionar produto"
											selectionMode="single"
											selectedKeys={selectedProductKey}
											onSelectionChange={handleSelectionChange}
											className="**:data-selected:bg-accent-soft"
										>
											{availableProducts.map((product) => (
												<ListBox.Item key={product.id} id={product.id} textValue={product.name}>
													<Avatar className="size-10 rounded-md">
														{product.imageUrl && <Avatar.Image src={product.imageUrl} alt={product.name} />}
														<Avatar.Fallback className="rounded-md">
															{product.name.charAt(0).toUpperCase()}
														</Avatar.Fallback>
													</Avatar>
													<div className="flex flex-col">
														<Label>{product.name}</Label>
														<Description>
															{product.price
																? formatCurrency(product.price)
																: product.variantCount > 0
																	? `${product.variantCount} variacao(oes)`
																	: 'Sem preco'}
														</Description>
													</div>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Surface>
								)}

								{hasMore && !isLoading && (
									<Button
										variant="tertiary"
										className="w-full"
										onPress={() => fetchProducts(true, page)}
										isPending={isLoadingMore}
									>
										Carregar mais
									</Button>
								)}
							</>
						)}

						{step === 'variants' && selectedProduct && (
							<>
								<Card className="bg-surface-secondary">
									<Card.Content className="flex items-center gap-3 p-3">
										<Avatar className="size-12 rounded-md">
											{selectedProduct.imageUrl && (
												<Avatar.Image src={selectedProduct.imageUrl} alt={selectedProduct.name} />
											)}
											<Avatar.Fallback className="rounded-md">
												{selectedProduct.name.charAt(0).toUpperCase()}
											</Avatar.Fallback>
										</Avatar>
										<div className="flex-1">
											<p className="text-sm font-semibold">{selectedProduct.name}</p>
											<p className="text-xs text-muted">{activeVariants.length} variantes ativas</p>
										</div>
										<Button variant="tertiary" size="sm" onPress={() => setStep('catalog')}>
											Trocar
										</Button>
									</Card.Content>
								</Card>

								<MultiSelectChips
									label="Variantes"
									placeholder="Selecione as variantes"
									selectedText="{count} variante(s) selecionada(s)"
									options={variantOptions}
									value={selectedVariantIds}
									onChange={setSelectedVariantIds}
								/>

								{hasVariantSelection && (
									<div className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm text-success-soft-foreground">
										<Icon icon={CheckmarkCircle02Icon} className="icon-md shrink-0" />
										<span>{selectedVariantIds.length} variante(s) selecionada(s)</span>
									</div>
								)}
							</>
						)}

						{step === 'confirm' && selectedProduct && (
							<>
								<Card className="bg-surface-secondary">
									<Card.Content className="flex items-center gap-3 p-3">
										<Avatar className="size-12 rounded-md">
											{selectedProduct.imageUrl && (
												<Avatar.Image src={selectedProduct.imageUrl} alt={selectedProduct.name} />
											)}
											<Avatar.Fallback className="rounded-md">
												{selectedProduct.name.charAt(0).toUpperCase()}
											</Avatar.Fallback>
										</Avatar>
										<div className="flex-1">
											<p className="text-sm font-semibold">{selectedProduct.name}</p>
											<p className="text-xs text-muted">
												{totalSelection > 1
													? `${totalSelection} variantes selecionadas`
													: activeVariants.length > 0
														? selectedVariants[0]?.name
														: 'Produto base'}
											</p>
										</div>
									</Card.Content>
								</Card>

								{totalSelection > 1 && (
									<div className="flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm text-info-soft-foreground">
										<Icon icon={Layers01Icon} className="icon-md shrink-0" />
										<div>
											<p className="font-medium">Multiplas variantes</p>
											<p className="text-xs opacity-80">
												O cliente podera escolher a variante no checkout. O preco sera exibido por variante.
											</p>
										</div>
									</div>
								)}
							</>
						)}
					</Modal.Body>

					<Modal.Footer>
						{step === 'catalog' && (
							<>
								<Button variant="tertiary" onPress={handleClose}>
									Cancelar
								</Button>
								<Button
									variant="primary"
									onPress={handleSelectProduct}
									isDisabled={!selectedProductFromList || isLoadingProduct}
								>
									{isLoadingProduct ? (
										<>
											<Spinner size="sm" />
											Carregando
										</>
									) : (
										<>
											Selecionar
											<Icon icon={ArrowRight01Icon} className="icon-sm" />
										</>
									)}
								</Button>
							</>
						)}

						{step === 'variants' && (
							<>
								<Button variant="tertiary" onPress={() => setStep('catalog')}>
									<Icon icon={ArrowLeft01Icon} className="icon-sm" />
									Voltar
								</Button>
								<Button variant="primary" onPress={handleConfirmVariants} isDisabled={!hasVariantSelection}>
									Continuar
									<Icon icon={ArrowRight01Icon} className="icon-sm" />
								</Button>
							</>
						)}

						{step === 'confirm' && (
							<>
								<Button variant="tertiary" onPress={() => setStep(activeVariants.length > 0 ? 'variants' : 'catalog')}>
									<Icon icon={ArrowLeft01Icon} className="icon-sm" />
									Voltar
								</Button>
								<AsyncButton variant="primary" onPress={handleAddProducts} isPending={isPending}>
									<Icon icon={Add01Icon} className="icon-sm" />
									Adicionar {totalSelection > 1 ? `(${totalSelection})` : ''}
								</AsyncButton>
							</>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
