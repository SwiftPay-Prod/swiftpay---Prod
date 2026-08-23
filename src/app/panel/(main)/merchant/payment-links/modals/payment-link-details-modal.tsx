'use client';

import { Suspense, use } from 'react';
import { Modal, Chip, Skeleton, Button } from '@heroui/react';
import {
  CreditCard,
  ExternalLink,
  InformationCircleIcon,
  Link01Icon,
  Settings01Icon,
  UserCheck01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { ImageUploader } from '@/components/ui/image-uploader';
import { mapParseColorToChipColor, paymentLinkLifetimeStatusParse, paymentMethodParse, paymentStatusParse } from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import type { PaymentLinkDetails } from '@/types/merchant/payment-links';
import type { ApiResponse } from '@/types/common';
import { PaymentMethod, UploadFolder } from '@/types/enums';

type PaymentLinkPromise = Promise<ApiResponse<PaymentLinkDetails>>;

interface PaymentLinkDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  paymentLinkPromise: PaymentLinkPromise | null;
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function DetailsContent({ paymentLinkPromise }: { paymentLinkPromise: PaymentLinkPromise }) {
  const response = use(paymentLinkPromise);
  const link = response?.data;

  if (response?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
        <p className="text-foreground/70">{response.error.message}</p>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-foreground/70">Link de pagamento não encontrado</p>
      </div>
    );
  }

  const statusParse = paymentStatusParse[link.status];
  const lifetimeParse = paymentLinkLifetimeStatusParse[link.lifetimeStatus];
  const hasPix = link.enabledMethods.includes(PaymentMethod.Pix);
  const hasCallbacks = link.callbackUrl || link.redirectUrl;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 pb-4 border-b border-divider">
        <div className="flex flex-col gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(link.amount)}</span>
          {link.description && <span className="text-sm text-foreground/70">{link.description}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Status da cobrança</span>
            <Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="md" className="gap-1">
              {statusParse.icon}
              {statusParse.label}
            </Chip>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Status do link</span>
            <Chip variant="soft" color={mapParseColorToChipColor(lifetimeParse.color)} size="md" className="gap-1">
              {lifetimeParse.icon}
              {lifetimeParse.label}
            </Chip>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-secondary p-4">
        <SectionTitle icon={<Icon icon={CreditCard} className="icon-sm" />} title="Métodos de pagamento" />
        <div className="flex flex-wrap gap-2">
          {link.enabledMethods.map((method) => {
            const methodParse = paymentMethodParse[method];
            return (
              <Chip key={method} variant="soft" color={mapParseColorToChipColor(methodParse.color)} size="sm" className="gap-1">
                {methodParse.icon}
                {methodParse.label}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-surface-secondary p-4">
        <SectionTitle icon={<Icon icon={Link01Icon} className="icon-sm" />} title="Link público" />
        <div className="flex flex-col gap-3">
          <DetailRow
            label="URL do link"
            value={<CopyableValue value={link.paymentLinkUrl} label="URL" />}
            mono
          />
          <Button
            variant="secondary"
            size="sm"
            className="w-fit"
            onPress={() => window.open(link.paymentLinkUrl, '_blank', 'noopener,noreferrer')}
          >
            <Icon icon={ExternalLink} className="icon-sm" />
            Abrir link
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-surface-secondary p-4">
        <SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações gerais" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="ID do link" value={<CopyableValue value={link.id} label="ID" />} mono />
          <DetailRow label="Payment ID" value={<CopyableValue value={link.paymentId} label="Payment ID" />} mono />
          <DetailRow label="Criado em" value={formatDate(link.createdAt)} />
          <DetailRow
            label="Expira em"
            value={link.lifetimeStatus === 'NeverExpires' ? 'Não expira' : link.expiresAt ? formatDate(link.expiresAt) : '-'}
          />
        </div>
      </div>

      <div className="rounded-lg bg-surface-secondary p-4">
        <SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Conteúdo configurado" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Nome do produto" value={link.productName || '-'} />
          <DetailRow label="Descrição" value={link.description || '-'} />
        </div>

        {(link.logoUrl || link.productImageUrl) && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {link.logoUrl && (
              <ImageUploader
                isAdmin
                folder={UploadFolder.Merchants}
                label="Preview da logo"
                description="Imagem configurada para a logo do link"
                maxFiles={1}
                value={[link.logoUrl]}
                onChange={() => undefined}
                onlyView
                itemHeight="h-24"
                objectFit="contain"
                compact
              />
            )}
            {link.productImageUrl && (
              <ImageUploader
                isAdmin
                folder={UploadFolder.Products}
                label="Preview da imagem do produto"
                description="Imagem configurada para o produto no link"
                maxFiles={1}
                value={[link.productImageUrl]}
                onChange={() => undefined}
                onlyView
                itemHeight="h-24"
                objectFit="cover"
                compact
              />
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-surface-secondary p-4">
        <SectionTitle icon={<Icon icon={Settings01Icon} className="icon-sm" />} title="Configurações" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Exibir taxas ao pagador" value={link.showFees ? 'Sim' : 'Não'} />
          <DetailRow label="Repassar taxa ao pagador" value={link.passFeeToCustomer ? 'Sim' : 'Não'} />
          <DetailRow label="Tema" value={link.themeMode || '-'} />
          <DetailRow label="Modo de cor" value={link.colorMode || '-'} />
          <DetailRow label="Cor primária" value={link.primaryColor || '-'} />
          <DetailRow label="Cor secundária" value={link.secondaryColor || '-'} />
          <DetailRow label="Expiração PIX" value={hasPix && link.pixExpirationMinutes != null ? `${link.pixExpirationMinutes} minutos` : '-'} />
          <DetailRow label="Vencimento do boleto" value={hasBoleto && link.boletoDueDate ? link.boletoDueDate : '-'} />
          <DetailRow label="Instruções do boleto" value={hasBoleto && link.boletoInstructions ? link.boletoInstructions : '-'} />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-xs text-foreground/60">Campos obrigatórios do comprador</span>
          {link.requiredBuyerFields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {link.requiredBuyerFields.map((field) => (
                <Chip key={field} variant="soft" color="default" size="sm">{field}</Chip>
              ))}
            </div>
          ) : (
            <span className="text-sm text-foreground/70">Nenhum campo obrigatório configurado.</span>
          )}
        </div>
      </div>

      {hasCallbacks && (
        <div className="rounded-lg bg-surface-secondary p-4">
          <SectionTitle icon={<Icon icon={Settings01Icon} className="icon-sm" />} title="URLs de integração" />
          <div className="flex flex-col gap-4">
            {link.callbackUrl && (
              <DetailRow
                label="URL de callback"
                value={<CopyableValue value={link.callbackUrl} label="Callback URL" />}
                mono
              />
            )}
            {link.redirectUrl && (
              <DetailRow
                label="URL de redirecionamento"
                value={<CopyableValue value={link.redirectUrl} label="Redirect URL" />}
                mono
              />
            )}
          </div>
        </div>
      )}

      {link.customer && (
        <div className="rounded-lg bg-surface-secondary p-4">
          <SectionTitle icon={<Icon icon={UserCheck01Icon} className="icon-sm" />} title="Cliente" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Nome" value={link.customer.name} />
            <DetailRow label="E-mail" value={link.customer.email ?? '-'} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentLinkDetailsModal({ isOpen, onOpenChange, paymentLinkPromise }: PaymentLinkDetailsModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="center" scroll="outside">
        <Modal.Dialog className="max-w-3xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent text-accent-foreground">
              <Icon icon={Link01Icon} className="icon-md" />
            </Modal.Icon>
            <Modal.Heading>Detalhes do Link de Pagamento</Modal.Heading>
            <p className="text-sm text-muted">Informações completas do link criado</p>
          </Modal.Header>
          <Modal.Body>
            {paymentLinkPromise ? (
              <Suspense fallback={<ContentSkeleton />}>
                <DetailsContent paymentLinkPromise={paymentLinkPromise} />
              </Suspense>
            ) : (
              <ContentSkeleton />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
