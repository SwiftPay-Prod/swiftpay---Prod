'use client';

import { useRouter } from 'next/navigation';
import { Button, Chip, Dropdown, Link, Tooltip } from '@heroui/react';
import { Routes } from '@/router/routes';
import { Copy01Icon, Copy02Icon, Delete02Icon, ExternalLink, Link02Icon, MoreHorizontalCircle01Icon, PencilEdit01Icon, ViewIcon, WhatsappIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import {
  mapParseColorToChipColor,
  pageSizeFilterOptions,
  parseToFilterOptions,
  paymentLinkLifetimeStatusParse,
  paymentMethodParse,
  paymentStatusParse,
} from '@/parse';
import { PaymentStatus } from '@/types/enums';
import { DataTable } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { toast } from '@heroui/react';
import type { MinimalPaymentLink } from '@/types/merchant/payment-links';
import type { DataTableColumn } from '@/components/ui/data-table';
import { usePaymentLinksTable } from './use-payment-links-table';
import { PaymentLinkDetailsModal } from '@/app/panel/(main)/merchant/payment-links/modals/payment-link-details-modal';
import { DeletePaymentLinkModal } from './modals/delete-payment-link-modal';

interface PaymentLinksTableProps {
  merchantId: string;
}

const statusOptions = parseToFilterOptions(paymentStatusParse, 'Todos os status');
const methodOptions = parseToFilterOptions(paymentMethodParse, 'Todos os métodos');

function copyPaymentLink(url: string) {
  void navigator.clipboard.writeText(url).catch(() => undefined);
  toast.success('Link copiado com sucesso.');
}

function getColumns(
  onView: (id: string) => void,
  onClone: (paymentLink: MinimalPaymentLink) => void,
  onEdit: (id: string) => void,
  onDelete: (paymentLink: MinimalPaymentLink) => void,
): DataTableColumn<MinimalPaymentLink>[] {
  return [
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (link) => <span className="text-sm text-muted">{formatDate(link.createdAt)}</span>,
    },
    {
      key: 'paymentLinkUrl',
      header: 'Link',
      render: (link) => (
        <div className="flex max-w-68 items-center gap-2">
          <Link
            href={link.paymentLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block min-w-0 grow truncate text-sm"
          >
            {link.paymentLinkUrl}
          </Link>
          <Tooltip>
            <Button
              isIconOnly
              variant="tertiary"
              className="shrink-0 text-accent"
              onPress={() => copyPaymentLink(link.paymentLinkUrl)}
            >
              <Icon icon={Copy01Icon} className="icon-sm text-accent" />
              <Tooltip.Content>Copiar link</Tooltip.Content>
            </Button>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (link) => <span className="font-medium">{formatCurrency(link.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Método',
      render: (link) => {
        const method = paymentMethodParse[link.method];
        return (
          <Chip variant="soft" color={mapParseColorToChipColor(method.color)} size="sm" className="gap-1">
            {method.icon}
            {method.label}
          </Chip>
        );
      },
    },
    {
      key: 'status',
      header: 'Status do link',
      render: (link) => {
        const status = paymentLinkLifetimeStatusParse[link.lifetimeStatus];
        return (
          <Chip variant="soft" color={mapParseColorToChipColor(status.color)} size="sm" className="gap-1">
            {status.icon}
            {status.label}
          </Chip>
        );
      },
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (link) => <span className="text-sm truncate max-w-40">{link.customer?.name ?? '-'}</span>,
    },
    {
      key: 'expiresAt',
      header: 'Expira em',
      render: (link) => (
        <span className={`text-sm ${link.isExpired ? 'text-danger' : 'text-muted'}`}>
          {link.lifetimeStatus === 'NeverExpires' ? 'Não expira' : link.expiresAt ? formatDate(link.expiresAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (link) => {
        const canEdit = link.status === PaymentStatus.Pending && !link.isExpired;
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip>
              <Button isIconOnly variant="tertiary" onPress={() => onView(link.id)}>
                <Icon icon={ViewIcon} className="icon-sm" />
                <Tooltip.Content>Ver detalhes</Tooltip.Content>
              </Button>
            </Tooltip>
            <Tooltip>
              <Button
                isIconOnly
                variant="tertiary"
                className="text-accent"
                onPress={() => copyPaymentLink(link.paymentLinkUrl)}
              >
                <Icon icon={Copy01Icon} className="icon-sm text-accent" />
                <Tooltip.Content>Copiar link</Tooltip.Content>
              </Button>
            </Tooltip>
            <Dropdown>
              <Tooltip>
                <Button isIconOnly variant="tertiary" aria-label="Mais ações">
                  <Icon icon={MoreHorizontalCircle01Icon} className="icon-sm" />
                  <Tooltip.Content>Mais ações</Tooltip.Content>
                </Button>
              </Tooltip>
              <Dropdown.Popover className="min-w-44">
                <Dropdown.Menu
                  aria-label="Ações do link de pagamento"
                  onAction={(key) => {
                    if (key === 'open') {
                      window.open(link.paymentLinkUrl, '_blank', 'noopener,noreferrer');
                    } else if (key === 'edit') {
                      onEdit(link.id);
                    } else if (key === 'clone') {
                      onClone(link);
                    } else if (key === 'whatsapp') {
                      window.open(`https://wa.me/?text=${encodeURIComponent(link.paymentLinkUrl)}`, '_blank', 'noopener,noreferrer');
                    } else if (key === 'delete') {
                      onDelete(link);
                    }
                  }}
                >
                  {canEdit && (
                    <Dropdown.Item id="edit" textValue="Editar link" className="text-accent">
                      <Icon icon={PencilEdit01Icon} className="icon-xs text-accent" />
                      Editar link
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item id="clone" textValue="Clonar link" className="text-warning">
                    <Icon icon={Copy02Icon} className="icon-xs text-warning" />
                    Clonar link
                  </Dropdown.Item>
                  <Dropdown.Item id="whatsapp" textValue="Compartilhar no WhatsApp" className="text-success">
                    <Icon icon={WhatsappIcon} className="icon-xs text-success" />
                    Compartilhar no WhatsApp
                  </Dropdown.Item>
                  <Dropdown.Item id="open" textValue="Abrir link" className="text-secondary">
                    <Icon icon={ExternalLink} className="icon-xs text-secondary" />
                    Abrir link
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="Excluir link" className="text-danger">
                    <Icon icon={Delete02Icon} className="icon-xs text-danger" />
                    Excluir link
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        );
      },
      width: '88px',
    },
  ];
}

function renderMobilePaymentLinkCard(
  link: MinimalPaymentLink,
  _index: number,
  onOpenActions?: () => void,
) {
  const method = paymentMethodParse[link.method];
  const status = paymentLinkLifetimeStatusParse[link.lifetimeStatus];

  return (
    <div
      className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${
        onOpenActions ? 'cursor-pointer' : ''
      }`}
      onClick={onOpenActions}
      role={onOpenActions ? 'button' : undefined}
      tabIndex={onOpenActions ? 0 : undefined}
      onKeyDown={
        onOpenActions
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpenActions();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-sm truncate block">{link.customer?.name ?? 'Cliente não informado'}</span>
          <p className="mt-0.5 text-xs text-muted truncate">Toque para ver ações</p>
        </div>
        <Chip variant="soft" color={mapParseColorToChipColor(status.color)} size="sm" className="gap-1 shrink-0">
          {status.icon}
          {status.label}
        </Chip>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-muted">Criado em</p>
          <p className="mt-1 text-sm font-medium">{formatDate(link.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Método</p>
          <div className="mt-1">
            <Chip variant="soft" color={mapParseColorToChipColor(method.color)} size="sm" className="gap-1">
              {method.icon}
              {method.label}
            </Chip>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted">Cliente</p>
          <p className="mt-1 text-sm font-medium truncate">{link.customer?.name ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Valor</p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(link.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Expiração</p>
          <p className={`mt-1 text-sm font-semibold ${link.isExpired ? 'text-danger' : 'text-foreground'}`}>
            {link.lifetimeStatus === 'NeverExpires' ? 'Não expira' : link.expiresAt ? formatDate(link.expiresAt) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PaymentLinksTable({ merchantId }: PaymentLinksTableProps) {
  const router = useRouter();
  const { data, filters, modals, actions } = usePaymentLinksTable({ merchantId });

  const columns = getColumns(
    actions.openDetails,
    (link) => {
      router.push(
        `${Routes.panel.merchant.paymentLinksNew}?cloneId=${link.id}`,      );
    },
    (id) => router.push(Routes.panel.merchant.paymentLinksEdit(id)),
    modals.delete.open,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={<Icon icon={Link02Icon} className="icon-md text-accent-foreground" />}
        title="Link de pagamento"
        description="Gerencie links de pagamento e acompanhe o status de cada cobrança"
        action={{
          label: 'Novo link de pagamento',
          icon: <Icon icon={Link02Icon} className="icon-sm" />,
          onPress: () => router.push(Routes.panel.merchant.paymentLinksNew),
        }}
      />

      <DataTable
        columns={columns}
        data={data.paymentLinks.items}
        keyExtractor={(item) => item.id}
        renderMobileCard={(paymentLink, index, openActions) =>
          renderMobilePaymentLinkCard(paymentLink, index, openActions)
        }
        mobileActions={{
          title: (paymentLink) => paymentLink.customer?.name ?? 'Cliente não informado',
          subtitle: (paymentLink) => formatCurrency(paymentLink.amount),
          renderActions: (paymentLink, close) => (
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onPress={() => {
                  actions.openDetails(paymentLink.id);
                  close();
                }}
              >
                <Icon icon={ViewIcon} className="icon-sm" />
                Ver detalhes
              </Button>
              {paymentLink.status === PaymentStatus.Pending && !paymentLink.isExpired && (
                <Button
                  variant="secondary"
                  className="w-full justify-start text-accent"
                  onPress={() => {
                    router.push(Routes.panel.merchant.paymentLinksEdit(paymentLink.id));
                    close();
                  }}
                >
                  <Icon icon={PencilEdit01Icon} className="icon-sm text-accent" />
                  Editar link
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full justify-start text-secondary"
                onPress={() => {
                  router.push(
                    `${Routes.panel.merchant.paymentLinksNew}?cloneId=${paymentLink.id}`,                  );
                  close();
                }}
              >
                <Icon icon={Copy02Icon} className="icon-sm text-secondary" />
                Clonar link
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-foreground"
                onPress={() => {
                  copyPaymentLink(paymentLink.paymentLinkUrl);
                  close();
                }}
              >
                <Icon icon={Copy01Icon} className="icon-sm text-foreground" />
                Copiar link
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-success"
                onPress={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(paymentLink.paymentLinkUrl)}`, '_blank', 'noopener,noreferrer');
                  close();
                }}
              >
                <Icon icon={WhatsappIcon} className="icon-sm text-success" />
                Compartilhar no WhatsApp
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-warning"
                onPress={() => {
                  window.open(paymentLink.paymentLinkUrl, '_blank', 'noopener,noreferrer');
                  close();
                }}
              >
                <Icon icon={ExternalLink} className="icon-sm text-warning" />
                Abrir link
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-danger"
                onPress={() => {
                  modals.delete.open(paymentLink);
                  close();
                }}
              >
                <Icon icon={Delete02Icon} className="icon-sm text-danger" />
                Excluir link
              </Button>
            </div>
          ),
        }}
        isLoading={data.isLoading}
        skeletonRows={data.pageSizeValue}
        emptyMessage="Nenhum link de pagamento encontrado"
        minWidth="min-w-220"
        filters={{
          children: (
            <>
              <SearchFilter
                label="Buscar"
                placeholder="Link, pagamento, descrição ou cliente"
                value={filters.values.search}
                onChange={filters.handleSearchChange}
              />

              <SelectFilter
                label="Status da cobrança"
                value={filters.values.status}
                options={statusOptions}
                onChange={filters.handleStatusChange}
                allLabel="Todos os status"
              />

              <SelectFilter
                label="Método"
                value={filters.values.method}
                options={methodOptions}
                onChange={filters.handleMethodChange}
                allLabel="Todos os métodos"
              />

              <SelectFilter
                label="Por página"
                value={filters.values.pageSize}
                options={pageSizeFilterOptions}
                onChange={filters.handlePageSizeChange}
                showChips={false}
              />
            </>
          ),
          hasFilters: filters.hasFilters,
          onClear: filters.handleClearFilters,
          onRefresh: filters.handleRefresh,
          isRefreshing: data.isRefreshing,
        }}
        pagination={{
          page: filters.values.page,
          pageSize: data.pageSizeValue,
          totalItems: data.paymentLinks.totalItems,
          totalPages: data.paymentLinks.totalPages,
          onPageChange: filters.handlePageChange,
          sortBy: filters.values.sortBy,
          sortOrder: filters.values.sortOrder,
          onSortChange: (sortBy, sortOrder) => {
            filters.updateFilter('sortBy', sortBy);
            filters.updateFilter('sortOrder', sortOrder);
            filters.updateFilter('page', 1);
          },
          isNavigating: data.isLoading,
        }}
      />

      <PaymentLinkDetailsModal
		isOpen={modals.details.isOpen}
		onOpenChange={modals.details.close}
		paymentLinkPromise={modals.details.paymentLinkPromise}
	/>

      <DeletePaymentLinkModal
        isOpen={modals.delete.isOpen}
        onOpenChange={modals.delete.close}
        merchantId={merchantId}
        paymentLink={modals.delete.paymentLink}
        onSuccess={modals.delete.onSuccess}
      />
    </div>
  );
}
