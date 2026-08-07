'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Modal,
  Button,
  Switch,
  Avatar,
  Card,
  Skeleton,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
  PencilEdit02Icon,
  Layers01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { MultiSelectChips } from '@/components/ui/multi-select-chips';
import { formatCurrency } from '@/utils/currency';
import { getMerchantProduct } from '@/app/actions/merchant/products';
import { toast } from '@heroui/react';
import { VariantStatus } from '@/types/enums';
import type { CheckoutProductData } from '@/types/merchant/checkouts';
import type { ProductData } from '@/types/merchant/products';
import type { Key } from '@heroui/react';

interface EditProductModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  merchantId: string;
  product: CheckoutProductData | null;
  allProductVariantsInCheckout: CheckoutProductData[];
  onApplyChanges: (nextVariants: CheckoutProductData[]) => void;
}

export function EditProductModal({
  isOpen,
  onOpenChange,
  merchantId,
  product,
  allProductVariantsInCheckout,
  onApplyChanges,
}: EditProductModalProps) {
  const [isPending, startTransition] = useTransition();
  const [fullProduct, setFullProduct] = useState<ProductData | null>(null);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);

  const [isActive, setIsActive] = useState<boolean>(product?.isActive ?? true);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Key[]>([]);

  useEffect(() => {
    if (!isOpen || !product) return;
    if (loadedProductId === product.productId) return;

    getMerchantProduct(merchantId, product.productId).then((res) => {
      setFullProduct(res?.data ?? null);
      setLoadedProductId(product.productId);
      setIsActive(product.isActive ?? true);

      const selected = allProductVariantsInCheckout
        .filter((item) => item.productId === product.productId)
        .map((item) => item.variantId ?? 'base');

      setSelectedVariantIds(selected);
    });
  }, [isOpen, product, loadedProductId, merchantId, allProductVariantsInCheckout]);

  const isLoadingProduct = isOpen && product !== null && loadedProductId !== product.productId;

  const activeVariants = fullProduct?.variants.filter((variant) => variant.status === VariantStatus.Active) ?? [];
  const hasVariants = activeVariants.length > 0;

  const variantOptions = activeVariants.map((variant) => ({
    id: variant.id,
    label: variant.name,
    description: formatCurrency(variant.price),
  }));

  function handleClose() {
    onOpenChange(false);
    setFullProduct(null);
    setLoadedProductId(null);
  }

  function handleSave() {
    if (!product || !fullProduct) return;

    startTransition(async () => {
      const currentVariants = allProductVariantsInCheckout.filter((item) => item.productId === product.productId);
      const currentByVariant = new Map(currentVariants.map((item) => [item.variantId ?? 'base', item]));
      const maxDisplayOrder = allProductVariantsInCheckout.length > 0
        ? Math.max(...allProductVariantsInCheckout.map((item) => item.displayOrder))
        : 0;
      let nextDisplayOrder = maxDisplayOrder + 1;

      const nextVariants: CheckoutProductData[] = selectedVariantIds
        .map(String)
        .map((variantId) => {
          const existing = currentByVariant.get(variantId);

          if (existing) {
            return {
              ...existing,
              isActive,
            };
          }

          const variant = fullProduct.variants.find((value) => value.id === variantId);
          if (!variant) return null;

          const displayOrder = nextDisplayOrder;
          nextDisplayOrder += 1;

          return {
            id: `local-${product.productId}-${variant.id}-${crypto.randomUUID()}`,
            productId: product.productId,
            variantId: variant.id,
            productName: product.productName,
            productImageUrl: product.productImageUrl,
            variantName: variant.name,
            displayOrder,
            customPrice: null,
            originalPrice: variant.price,
            quantity: 1,
            maxQuantity: null,
            isActive,
          };
        })
        .filter((item): item is CheckoutProductData => item !== null);

      onApplyChanges(nextVariants);

      toast('Produto atualizado', {
        description: 'Alteracoes aplicadas localmente. Clique em salvar para persistir.',
        indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
        variant: 'success',
      });

      handleClose();
    });
  }

  if (!product) {
    return null;
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={PencilEdit02Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Editar produto</Modal.Heading>
            <p className="text-sm text-muted">Ajuste variantes e status deste produto no checkout.</p>
          </Modal.Header>

          <Modal.Body className="space-y-4">
            <Card className="bg-surface-secondary">
              <Card.Content className="flex items-center gap-3 p-3">
                <Avatar className="size-12 rounded-md">
                  {product.productImageUrl && <Avatar.Image src={product.productImageUrl} alt={product.productName} />}
                  <Avatar.Fallback className="rounded-md">{product.productName.charAt(0).toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{product.productName}</p>
                  <p className="text-xs text-muted">Preco base: {formatCurrency(product.originalPrice)}</p>
                </div>
              </Card.Content>
            </Card>

            {isLoadingProduct ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : hasVariants ? (
              <>
                <MultiSelectChips
                  label="Variantes no checkout"
                  placeholder="Selecione as variantes"
                  selectedText="{count} variante(s) selecionada(s)"
                  options={variantOptions}
                  value={selectedVariantIds}
                  onChange={setSelectedVariantIds}
                />

                {selectedVariantIds.length > 1 && (
                  <div className="flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm text-info-soft-foreground">
                    <Icon icon={Layers01Icon} className="icon-md shrink-0" />
                    <div>
                      <p className="font-medium">Variantes em lote</p>
                      <p className="text-xs opacity-80">
                        Ordem e status serao aplicados em todas as variantes selecionadas.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2">
              <div>
                <p className="text-sm font-medium">Produto ativo</p>
                <p className="text-xs text-muted">Desative para ocultar temporariamente no checkout.</p>
              </div>
              <Switch isSelected={isActive} onChange={setIsActive}>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
              Cancelar
            </Button>
            <AsyncButton
              variant="primary"
              onPress={handleSave}
              isPending={isPending}
              isDisabled={hasVariants && selectedVariantIds.length === 0}
            >
              Salvar alteracoes
            </AsyncButton>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
