'use client';

import { Suspense, use, useState } from 'react';
import { Modal, Chip, Skeleton, Avatar, Tabs } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { InternalTabs } from '@/components/ui/internal-tabs';
import {
  InformationCircleIcon,
  Coupon01Icon,
  PackageIcon,
  CalendarSetting01Icon,
  ShoppingCart01Icon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons';
import { couponStatusParse, couponDiscountTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency, formatDiscount } from '@/utils/currency';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import type { CouponData } from '@/types/merchant/coupons';
import type { ApiResponse } from '@/types/common';

type CouponPromise = Promise<ApiResponse<CouponData>>;

interface CouponDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  couponPromise: CouponPromise | null;
}

interface DetailsContentProps {
  couponPromise: CouponPromise;
}

function DetailsContentSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
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

function DetailsContent({ couponPromise }: DetailsContentProps) {
  const response = use(couponPromise);
  const coupon = response?.data;
  const [selectedTab, setSelectedTab] = useState('geral');

  if (response?.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
        <p className="text-foreground/70">{response.error.message ?? 'Erro ao carregar cupom'}</p>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-foreground/70">Cupom não encontrado</p>
      </div>
    );
  }

  const statusParse = couponStatusParse[coupon.status];
  const typeParse = couponDiscountTypeParse[coupon.discountType];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 border-b border-border pb-4">
        <Avatar size="lg" className="shrink-0 bg-accent/10">
          <Avatar.Fallback className="text-accent">
            <Icon icon={Coupon01Icon} className="icon-md" />
          </Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold text-accent">{coupon.code}</span>
            <span className="text-sm text-muted">{coupon.name}</span>
          </div>
          {coupon.description && <p className="line-clamp-2 text-sm text-muted">{coupon.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
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

      <InternalTabs
        ariaLabel="Detalhes do cupom"
        items={[
          { id: 'geral', label: 'Geral' },
          { id: 'regras', label: 'Regras' },
          { id: 'como-funciona', label: 'Como Funciona' },
        ]}
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tabs.Panel id="geral" className="p-0">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-secondary p-4">
              <SectionTitle icon={<Icon icon={Coupon01Icon} className="icon-sm" />} title="Informações do Desconto" />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Valor do Desconto" value={formatDiscount(coupon)} />
                <DetailRow
                  label="Valor Mínimo"
                  value={coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : 'Sem mínimo'}
                />
                <DetailRow
                  label="Desconto Máximo"
                  value={coupon.maxDiscountAmount ? formatCurrency(coupon.maxDiscountAmount) : 'Sem limite'}
                />
                <DetailRow label="Usos" value={`${coupon.currentUses} / ${coupon.maxUses ?? '∞'}`} />
                <DetailRow label="Usos por Cliente" value={coupon.maxUsesPerCustomer?.toString() ?? 'Ilimitado'} />
              </div>
            </div>
            <div className="rounded-lg bg-surface-secondary p-4">
              <SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="ID" value={<CopyableValue value={coupon.id} label="ID" />} mono />
                <DetailRow label="Criado em" value={formatDate(coupon.createdAt)} />
                <DetailRow label="Atualizado em" value={formatDate(coupon.updatedAt)} />
              </div>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="regras" className="p-0">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-secondary p-4">
              <SectionTitle icon={<Icon icon={CalendarSetting01Icon} className="icon-sm" />} title="Período de Validade" />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Início" value={coupon.validFrom ? formatDate(coupon.validFrom) : 'Sem data de início'} />
                <DetailRow label="Expiração" value={coupon.validUntil ? formatDate(coupon.validUntil) : 'Sem expiração'} />
              </div>
            </div>

            <div className="rounded-lg bg-surface-secondary p-4">
              <SectionTitle icon={<Icon icon={PackageIcon} className="icon-sm" />} title="Produtos" />
              {coupon.applyToAllProducts ? (
                <p className="text-sm text-muted">Válido para todos os produtos</p>
              ) : coupon.products.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {coupon.products.map((product) => (
                    <Chip key={product.id} variant="secondary" size="md" className="gap-1">
                      <Avatar size="sm" className="shrink-0">
                        {product.imageUrl ? (
                          <Avatar.Image src={product.imageUrl} alt={product.name} />
                        ) : (
                          <Avatar.Fallback className="bg-accent/10 text-accent">
                            <Icon icon={PackageIcon} className="icon-xs" />
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      {product.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-warning">Nenhum produto vinculado</p>
              )}
            </div>

            <div className="rounded-lg bg-surface-secondary p-4">
              <SectionTitle icon={<Icon icon={ShoppingCart01Icon} className="icon-sm" />} title="Checkouts" />
              {coupon.applyToAllCheckouts ? (
                <p className="text-sm text-muted">Válido para todos os checkouts</p>
              ) : coupon.checkouts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {coupon.checkouts.map((checkout) => (
                    <Chip key={checkout.id} variant="secondary" size="md" className="gap-1">
                      <Avatar size="sm" className="shrink-0">
                        <Avatar.Fallback className="bg-accent/10 text-accent">
                          <Icon icon={ShoppingCart01Icon} className="icon-xs" />
                        </Avatar.Fallback>
                      </Avatar>
                      {checkout.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-warning">Nenhum checkout vinculado</p>
              )}
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="como-funciona" className="p-0">
          <div className="rounded-lg border border-accent-soft-hover bg-accent/5 p-4">
            <SectionTitle icon={<Icon icon={HelpCircleIcon} className="icon-sm text-accent" />} title="Como Funciona" />
            <div className="flex flex-col gap-3 text-sm text-muted">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Cupom vinculado ao Checkout</span>
                <span>
                  O desconto é aplicado no valor total da compra. Todos os produtos do checkout recebem o desconto
                  proporcionalmente.
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Cupom vinculado apenas a Produtos</span>
                <span>
                  O desconto é aplicado somente no valor dos produtos vinculados. Se houver múltiplos produtos no carrinho usando
                  o mesmo cupom, o desconto será aplicado no produto de <strong>maior valor</strong>.
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Cupom vinculado a Checkout e Produtos</span>
                <span>
                  O cupom funcionará como cupom de checkout, aplicando o desconto no valor total da compra, mas somente será válido
                  se ao menos um dos produtos vinculados estiver no carrinho.
                </span>
              </div>
            </div>
          </div>
        </Tabs.Panel>
      </InternalTabs>
    </div>
  );
}

export function CouponDetailsModal({ isOpen, onOpenChange, couponPromise }: CouponDetailsModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-3xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={Coupon01Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Detalhes do Cupom</Modal.Heading>
            <p className="text-sm text-muted">Informações completas do cupom de desconto</p>
          </Modal.Header>
          <Modal.Body>
            {couponPromise && (
              <Suspense fallback={<DetailsContentSkeleton />}>
                <DetailsContent couponPromise={couponPromise} />
              </Suspense>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
