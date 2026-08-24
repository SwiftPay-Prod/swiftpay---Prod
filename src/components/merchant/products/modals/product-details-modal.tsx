'use client';

import { Suspense, use, useState, useEffect } from 'react';
import { Modal, Chip, Skeleton, Button, Tooltip, Avatar } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	Coupon01Icon,
	InformationCircleIcon,
	Key01Icon,
	PackageIcon,
	Tag01Icon,
	ViewIcon,
	ViewOffIcon,
	Copy01Icon,
	DeliveryBox01Icon,
	CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { toast } from '@heroui/react';
import { listProductDigitalItems } from '@/app/actions/merchant/digital-items';
import type { MinimalDigitalItem } from '@/types/merchant/digital-items';
import {
	productStatusParse,
	productTypeParse,
	categoryStatusParse,
	variantStatusParse,
	couponStatusParse,
	couponDiscountTypeParse,
	mapParseColorToChipColor,
	digitalItemTypeParse,
	digitalItemStatusParse,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency, formatDiscount } from '@/utils/currency';
import { InlineList } from '@/components/ui/inline-list';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { DigitalItemStatus, ProductType } from '@/types/enums';
import type { ProductData, ProductVariantData, ProductCouponData } from '@/types/merchant/products';
import type { ApiResponse } from '@/types/common';
import Image from 'next/image';
import { VariantModal } from './variant-modal';

type ProductPromise = Promise<ApiResponse<ProductData>>;

interface ProductDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	productPromise: ProductPromise | null;
	merchantId: string;
}

function DetailsContentSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-4">
			<div className="flex items-center gap-4">
				<Skeleton className="w-20 h-20 rounded-lg" />
				<div className="flex flex-col gap-2 flex-1">
					<Skeleton className="h-6 w-48 rounded-lg" />
					<Skeleton className="h-4 w-32 rounded-lg" />
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-lg" />
				))}
			</div>
		</div>
	);
}

interface VariantsTableProps {
	variants: ProductVariantData[];
	merchantId: string;
	productId: string;
	onRefresh: () => void;
}

function VariantsTable({ variants, merchantId, productId, onRefresh }: VariantsTableProps) {
	const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
	const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);
	const [variantModalMode, setVariantModalMode] = useState<'view'>('view');

	function handleView(variant: ProductVariantData) {
		setSelectedVariant(variant);
		setVariantModalMode('view');
		setIsVariantModalOpen(true);
	}

	function handleVariantModalClose(open: boolean) {
		setIsVariantModalOpen(open);
		if (!open) setSelectedVariant(null);
	}

	function handleVariantSuccess() {
		setIsVariantModalOpen(false);
		setSelectedVariant(null);
		onRefresh();
	}

	return (
		<>
			<div className="flex flex-col gap-4">
				<InlineList
					items={variants}
					getKey={(variant) => variant.id}
					getTitle={(variant) => variant.name}
					getSubtitle={(variant) => (variant.sku ? `SKU: ${variant.sku}` : null)}
					renderLeading={(variant) => (
						<Avatar size="sm" className="shrink-0">
							{variant.imageUrl ? (
								<Avatar.Image src={variant.imageUrl} alt={variant.name} />
							) : (
								<Avatar.Fallback className="bg-accent/10 text-accent">
									<Icon icon={PackageIcon} className="icon-xs" />
								</Avatar.Fallback>
							)}
						</Avatar>
					)}
					renderTrailing={(variant) => {
						const statusParsed = variantStatusParse[variant.status];
						return (
							<>
								<span className="font-semibold text-foreground whitespace-nowrap">{formatCurrency(variant.price)}</span>
								<span className="text-xs text-muted whitespace-nowrap">{variant.stockQuantity ?? 0} un</span>
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(statusParsed.color)}
									size="sm"
									className="gap-1"
								>
									{statusParsed.icon}
									{statusParsed.label}
								</Chip>
							</>
						);
					}}
					renderActions={(variant) => (
						<>
							<Tooltip>
								<Button isIconOnly size="sm" variant="tertiary" onPress={() => handleView(variant)}>
									<Icon icon={ViewIcon} className="icon-xs" />
									<Tooltip.Content>Visualizar</Tooltip.Content>
								</Button>
							</Tooltip>
						</>
					)}
					empty={
						<div className="flex flex-col items-center justify-center py-8 text-muted">
							<Icon icon={PackageIcon} className="icon-lg mb-2" />
							<span>Nenhuma variante cadastrada</span>
						</div>
					}
				/>
			</div>

			<VariantModal
				isOpen={isVariantModalOpen}
				onOpenChange={handleVariantModalClose}
				merchantId={merchantId}
				productId={productId}
				variant={selectedVariant}
				mode={variantModalMode}
				onSuccess={handleVariantSuccess}
			/>
		</>
	);
}

interface CouponsSectionProps {
	coupons: ProductCouponData[];
}

function CouponsSection({ coupons }: CouponsSectionProps) {
	function getDiscountDisplay(coupon: ProductCouponData) {
		const discountTypeParse = couponDiscountTypeParse[coupon.discountType];
		return `${formatDiscount(coupon)} ${discountTypeParse.label}`;
	}

	function getUsageDisplay(coupon: ProductCouponData) {
		if (coupon.maxUses === null) {
			return `${coupon.currentUses} uso${coupon.currentUses !== 1 ? 's' : ''}`;
		}
		return `${coupon.currentUses}/${coupon.maxUses} usos`;
	}

	return (
		<InlineList
			items={coupons}
			getKey={(coupon) => coupon.id}
			getTitle={(coupon) => coupon.code}
			getSubtitle={(coupon) => coupon.name}
			renderLeading={(_coupon) => (
				<Avatar size="sm" className="shrink-0">
					<Avatar.Fallback className="bg-accent/10 text-accent">
						<Icon icon={Coupon01Icon} className="icon-xs" />
					</Avatar.Fallback>
				</Avatar>
			)}
			renderTrailing={(coupon) => {
				const statusParsed = couponStatusParse[coupon.status];
				return (
					<>
						<span className="font-semibold text-foreground whitespace-nowrap">{getDiscountDisplay(coupon)}</span>
						<span className="text-xs text-muted whitespace-nowrap">{getUsageDisplay(coupon)}</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
							{statusParsed.icon}
							{statusParsed.label}
						</Chip>
					</>
				);
			}}
			empty={
				<div className="flex flex-col items-center justify-center py-8 text-muted">
					<Icon icon={Coupon01Icon} className="icon-lg mb-2" />
					<span>Nenhum cupom vinculado</span>
				</div>
			}
		/>
	);
}

interface DigitalItemsInlineListProps {
	merchantId: string;
	productId: string;
}

const PREVIEW_LIMIT = 5;

function DigitalItemsInlineList({ merchantId, productId }: DigitalItemsInlineListProps) {
	const [items, setItems] = useState<MinimalDigitalItem[]>([]);
	const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());

	useEffect(() => {
		let cancelled = false;
		listProductDigitalItems(merchantId, productId, { pageSize: PREVIEW_LIMIT }).then((response) => {
			if (!cancelled) {
				setItems(response?.data?.items?.items ?? []);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, productId]);

	function toggleValueVisibility(itemId: string) {
		setVisibleValues((prev) => {
			const next = new Set(prev);
			if (next.has(itemId)) {
				next.delete(itemId);
			} else {
				next.add(itemId);
			}
			return next;
		});
	}

	return <>
		<InlineList
			items={items}
			getKey={(item) => item.id}
			getTitle={(item) => {
				const typeParse = digitalItemTypeParse[item.type];
				return item.variantName ? `${typeParse.label} • ${item.variantName}` : typeParse.label;
			}}
			getSubtitle={(item) => {
				const isVisible = visibleValues.has(item.id);
				const hasDelivery = item.status === DigitalItemStatus.Delivered && item.deliveredAt;
				return (
					<div className="flex flex-col gap-0.5">
						<span className={`${isVisible ? '' : 'visual-blur'} font-mono text-xs break-all`}>
							{item.content}
						</span>
						{hasDelivery && (
							<span className="flex items-center gap-1 text-xs text-success">
								<Icon icon={DeliveryBox01Icon} className="icon-2xs" />
								{item.deliveredToOrderNumber ? `Pedido #${item.deliveredToOrderNumber}` : 'Entregue'}
							</span>
						)}
					</div>
				);
			}}
			empty={
				<div className="flex flex-col items-center justify-center px-4 py-8 text-center bg-surface rounded-xl border border-border">
					<Icon icon={Key01Icon} className="icon-lg text-muted mb-2" />
					<p className="text-sm font-medium">Nenhum item digital cadastrado</p>
					<p className="text-sm text-muted">Adicione chaves, links ou códigos que serão enviados aos clientes</p>
				</div>
			}
			renderLeading={(item) => {
				const typeParse = digitalItemTypeParse[item.type];
				return (
					<Avatar size="sm" className="shrink-0">
						<Avatar.Fallback className={`bg-${typeParse.color}/10 text-${typeParse.color}`}>
							{typeParse.icon}
						</Avatar.Fallback>
					</Avatar>
				);
			}}
			renderTrailing={(item) => {
				const statusParse = digitalItemStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
						{statusParse.icon}
						{statusParse.label}
					</Chip>
				);
			}}
			renderActions={(item) => {
				const isVisible = visibleValues.has(item.id);
				return (
					<>
						<Tooltip>
							<Button isIconOnly size="sm" variant="tertiary" onPress={() => toggleValueVisibility(item.id)}>
								<Icon icon={isVisible ? ViewOffIcon : ViewIcon} className="icon-xs" />
								<Tooltip.Content>{isVisible ? 'Ocultar valor' : 'Mostrar valor'}</Tooltip.Content>
							</Button>
						</Tooltip>
						<Tooltip>
							<Button
								isIconOnly
								size="sm"
								variant="tertiary"
								onPress={() => {
									void navigator.clipboard.writeText(item.content).catch(() => undefined);
									toast('Valor copiado', {
										description: 'O valor foi copiado para a área de transferência.',
										indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
										variant: 'success',
									});
								}}
							>
								<Icon icon={Copy01Icon} className="icon-xs" />
								<Tooltip.Content>Copiar valor</Tooltip.Content>
							</Button>
						</Tooltip>
					</>
				);
			}}
		/>
	</>;
}

interface DetailsContentProps {
	productPromise: ProductPromise;
	merchantId: string;
}

function DetailsContent({ productPromise, merchantId }: DetailsContentProps) {
	const [refreshKey, setRefreshKey] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const response = use(productPromise);
	const product = response?.data;

	function handleRefresh() {
		setRefreshKey((k) => k + 1);
	}

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-foreground/70">{response.error.message ?? 'Erro ao carregar produto'}</p>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-foreground/70">Produto não encontrado</p>
			</div>
		);
	}

	const statusParse = productStatusParse[product.status];
	const typeParse = productTypeParse[product.type];
	const coverImageUrl = product.imageUrls?.[0] ?? product.imageUrl;
	const galleryImages = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];

	return (
		<div className="flex flex-col gap-6">
			{/* Header do Produto */}
			<div className="flex items-start gap-4 pb-4 border-b border-border">
				{coverImageUrl ? (
					<button type="button" onClick={() => setPreviewUrl(coverImageUrl)} className="shrink-0">
						<Avatar size="lg">
							<Avatar.Image src={coverImageUrl} alt={product.name} />
						</Avatar>
					</button>
				) : (
					<Avatar size="lg" className="shrink-0">
						<Avatar.Fallback>
							<Icon icon={PackageIcon} className="icon-md" />
						</Avatar.Fallback>
					</Avatar>
				)}
				<div className="flex flex-col gap-2 flex-1 min-w-0">
					{product.description && <p className="text-sm text-muted line-clamp-2">{product.description}</p>}
					<div className="flex flex-wrap items-center gap-2 mt-1">
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
						<Chip variant="soft" color={mapParseColorToChipColor(typeParse.color)} size="sm" className="gap-1">
							{typeParse.icon}
							{typeParse.label}
						</Chip>
					</div>
				</div>
			</div>

			{galleryImages.length > 0 && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={ViewIcon} className="icon-sm" />} title={`Fotos (${galleryImages.length})`} />
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{galleryImages.map((url) => (
							<div key={url} className="relative">
								<button
									type="button"
									onClick={() => setPreviewUrl(url)}
									className="group relative flex h-28 w-full items-center justify-center rounded-medium border border-default bg-surface overflow-hidden cursor-pointer"
								>
									<Image src={url} alt={product.name} className="h-full w-full object-cover" fill />
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
										<Icon icon={ViewIcon} className="icon-sm text-foreground" />
										<span className="text-tiny">Visualizar</span>
									</div>
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Informações Gerais */}
			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={product.id} label="ID" />} mono />
					<DetailRow label="ID Externo" value={product.externalId ?? '-'} mono />
					<DetailRow label="Preço Base" value={product.price ? formatCurrency(product.price) : 'Não definido'} />
					<DetailRow label="Ambiente" value={product.environment} />
					<DetailRow label="Estoque" value={product.stockQuantity == null ? 'Ilimitado / não controlado' : String(product.stockQuantity)} />
					<DetailRow label="Itens Digitais" value={String(product.digitalItemsCount ?? 0)} />
					<DetailRow label="Variantes" value={String(product.variants.length)} />
					<DetailRow label="Cupons" value={String(product.coupons.length)} />
					<DetailRow label="Criado em" value={formatDate(product.createdAt)} />
				</div>
			</div>

			{/* Descrição */}
			{product.description && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Descrição" />
					<p className="text-sm text-foreground whitespace-pre-wrap">{product.description}</p>
				</div>
			)}

			{/* Categorias */}
			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle
					icon={<Icon icon={Tag01Icon} className="icon-sm" />}
					title={`Categorias (${product.categories.length})`}
				/>
				{product.categories.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{product.categories.map((cat) => {
							const catStatus = categoryStatusParse[cat.status];
							return (
								<Chip
									key={cat.id}
									variant="soft"
									color={mapParseColorToChipColor(catStatus.color)}
									size="md"
									className="gap-1"
								>
									<Icon icon={Tag01Icon} className="icon-xs" />
									{cat.name}
								</Chip>
							);
						})}
					</div>
				) : (
					<p className="text-sm text-muted">Nenhuma categoria vinculada</p>
				)}
			</div>

			{/* Variantes */}
			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle
					icon={<Icon icon={PackageIcon} className="icon-sm" />}
					title={`Variantes (${product.variants.length})`}
				/>
				<VariantsTable
					key={refreshKey}
					variants={product.variants}
					merchantId={merchantId}
					productId={product.id}
					onRefresh={handleRefresh}
				/>
			</div>

			{/* Itens Digitais - apenas para produtos digitais */}
			{product.type === ProductType.Digital && (
				<>
					<div className="rounded-lg bg-surface-secondary p-4">
						<div className="mb-4">
							<SectionTitle
								icon={<Icon icon={Key01Icon} className="icon-sm" />}
								title={`Itens Digitais (${product.digitalItemsCount ?? 0} disponíveis)`}
							/>
						</div>
						<DigitalItemsInlineList
							merchantId={merchantId}
							productId={product.id}
						/>
					</div>
				</>
			)}

			{/* Cupons */}
			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle
					icon={<Icon icon={Coupon01Icon} className="icon-sm" />}
					title={`Cupons (${product.coupons.length})`}
				/>
				{product.coupons.length > 0 ? (
					<CouponsSection coupons={product.coupons} />
				) : (
					<p className="text-sm text-muted">Nenhum cupom vinculado a este produto</p>
				)}
			</div>

			<Modal.Backdrop isOpen={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-4xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Visualizar imagem</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							{previewUrl && (
								<div
									className="relative w-full overflow-hidden rounded-lg bg-surface-deep"
									style={{ aspectRatio: '16 / 9' }}
								>
									<Image src={previewUrl} alt={product.name} className="object-contain" fill />
								</div>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

export function ProductDetailsModal({ isOpen, onOpenChange, productPromise, merchantId }: ProductDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={PackageIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Produto</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do produto</p>
					</Modal.Header>
					<Modal.Body>
						{productPromise && (
							<Suspense fallback={<DetailsContentSkeleton />}>
								<DetailsContent productPromise={productPromise} merchantId={merchantId} />
							</Suspense>
						)}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

