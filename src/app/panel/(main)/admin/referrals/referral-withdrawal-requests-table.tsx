'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Tooltip } from '@heroui/react';
import { Wallet01Icon, ArrowReloadHorizontalIcon, MoneyExchange01Icon, HourglassIcon } from '@hugeicons/core-free-icons';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox, type AsyncComboboxOption } from '@/components/ui/async-combobox';
import { EmailLink } from '@/components/ui/data-links';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import type { ApiResponse, Paginated } from '@/types/common';
import type {
  AdminMinimalReferralCommissionWithdrawalRequest,
  AdminReadListReferralCommissionWithdrawalRequestsRequest,
  AdminReferralCommissionWithdrawalRequestDetails,
} from '@/types/admin/referrals';
import { ReferralCommissionWithdrawalRequestStatus } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { pageSizeFilterOptions } from '@/parse';
import { Icon } from '@/components/ui/icon';
import { adminGetReferralCommissionWithdrawalRequest } from '@/app/actions/admin/referrals';
import { adminListUsers } from '@/app/actions/admin/users';
import { useDebounce } from '@/hooks/use-debounce';
import { ReferralWithdrawalReviewModal } from './referral-withdrawal-review-modal';

type RequestsPromise = Promise<ApiResponse<Paginated<AdminMinimalReferralCommissionWithdrawalRequest>>>;
type RequestDetailsPromise = Promise<ApiResponse<AdminReferralCommissionWithdrawalRequestDetails>>;

interface ReferralWithdrawalRequestsTableProps {
  fetchPromise: RequestsPromise;
  filters: AdminReadListReferralCommissionWithdrawalRequestsRequest;
  initialUserName?: string | null;
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: ReferralCommissionWithdrawalRequestStatus.Requested, label: 'Solicitado' },
  { value: ReferralCommissionWithdrawalRequestStatus.Reviewed, label: 'Analisado' },
  { value: ReferralCommissionWithdrawalRequestStatus.Cancelled, label: 'Cancelado' },
];

function getStatusMeta(status: ReferralCommissionWithdrawalRequestStatus) {
  switch (status) {
    case ReferralCommissionWithdrawalRequestStatus.Requested:
      return { label: 'Solicitado', color: 'warning' as const };
    case ReferralCommissionWithdrawalRequestStatus.Reviewed:
      return { label: 'Analisado', color: 'success' as const };
    case ReferralCommissionWithdrawalRequestStatus.Cancelled:
      return { label: 'Cancelado', color: 'danger' as const };
    default:
      return { label: status, color: 'default' as const };
  }
}

function getColumns(
  onOpenReview: (requestId: string) => void,
  openingRequestId: string | null
): DataTableColumn<AdminMinimalReferralCommissionWithdrawalRequest>[] {
  return [
    {
      key: 'referrer',
      header: 'Gerente / Afiliado',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-white truncate max-w-60">{item.referrerName || 'Sem nome'}</span>
          <EmailLink email={item.referrerEmail} className="text-xs text-white/50" />
        </div>
      ),
    },
    {
      key: 'requestedAt',
      header: 'Solicitado em',
      render: (item) => <span className="text-xs font-mono text-white/50">{formatDate(item.requestedAt)}</span>,
    },
    {
      key: 'amount',
      header: 'Valor da Comissão',
      render: (item) => (
        <span className="font-mono font-bold text-white text-sm tabular-nums">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const mappedStatus =
          item.status === ReferralCommissionWithdrawalRequestStatus.Requested
            ? 'Pending'
            : item.status === ReferralCommissionWithdrawalRequestStatus.Reviewed
            ? 'Completed'
            : 'Cancelled';
        return <RevolutStatusBadge status={mappedStatus} />;
      },
    },
    {
      key: 'notes',
      header: 'Observações',
      render: (item) => <span className="text-xs font-mono text-white/40 truncate max-w-40">{item.notes || '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center">
          <Tooltip>
            <button
              type="button"
              onClick={() => onOpenReview(item.id)}
              disabled={openingRequestId === item.id}
              className={`button-outline-dark cursor-pointer text-xs py-1.5 px-3 ${item.status === ReferralCommissionWithdrawalRequestStatus.Requested ? 'border-[#ec7e00]/40 text-[#ec7e00]' : ''}`}
            >
              <Icon icon={Wallet01Icon} className="icon-xs" />
              <span>
                {item.status === ReferralCommissionWithdrawalRequestStatus.Requested
                  ? 'Avaliar Saque'
                  : 'Detalhes'}
              </span>
            </button>
            <Tooltip.Content>
              {item.status === ReferralCommissionWithdrawalRequestStatus.Requested
                ? 'Liberar ou recusar repasse PIX'
                : 'Ver comprovante e histórico'}
            </Tooltip.Content>
          </Tooltip>
        </div>
      ),
    },
  ];
}

function renderMobileAdminWithdrawalRequestCard(item: AdminMinimalReferralCommissionWithdrawalRequest, _index: number, openActions?: () => void) {
  const mappedStatus =
    item.status === ReferralCommissionWithdrawalRequestStatus.Requested
      ? 'Pending'
      : item.status === ReferralCommissionWithdrawalRequestStatus.Reviewed
      ? 'Completed'
      : 'Cancelled';

  return (
    <div
      className="rounded-[20px] border border-white/10 bg-[#0a0a0a] p-4 flex flex-col gap-3"
      onClick={openActions}
      role={openActions ? 'button' : undefined}
      tabIndex={openActions ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/8 pb-3">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm text-white truncate">{item.referrerName || 'Sem nome'}</span>
          <EmailLink email={item.referrerEmail} className="text-xs text-white/50" />
        </div>
        <RevolutStatusBadge status={mappedStatus} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Valor Solicitado</span>
          <span className="font-mono font-bold text-white tabular-nums">{formatCurrency(item.amount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Data do Pedido</span>
          <span className="font-mono text-white/60">{formatDate(item.requestedAt)}</span>
        </div>
        {item.notes && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40">Observações</span>
            <span className="font-mono text-white/60 truncate max-w-44">{item.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReferralWithdrawalRequestsTable({
  fetchPromise,
  filters,
  initialUserName,
}: ReferralWithdrawalRequestsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [requestDetailsPromise, setRequestDetailsPromise] = useState<RequestDetailsPromise | null>(null);
  const [openingRequestId, setOpeningRequestId] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [fetchedUserOptions, setFetchedUserOptions] = useState<AsyncComboboxOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(initialUserName ?? null);

  const debouncedUserSearch = useDebounce(userSearch, 300);
  const userOptions = debouncedUserSearch.trim() ? fetchedUserOptions : [];

  const response = use(fetchPromise);

  useEffect(() => {
    if (!debouncedUserSearch.trim()) {
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setIsLoadingUsers(true);
    });

    adminListUsers({ search: debouncedUserSearch, pageSize: 10 }).then((res) => {
      if (cancelled) return;
      setIsLoadingUsers(false);
      const users = res?.data?.items ?? [];
      setFetchedUserOptions(
        users.map((user) => ({
          key: user.id,
          label: user.name ?? user.email,
          description: user.name ? user.email : undefined,
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedUserSearch]);

  const items = response?.data ?? {
    items: [],
    totalItems: 0,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 10,
    totalPages: 0,
  };

  function navigate(newParams: Record<string, string | number | undefined | null>) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === 'all' || (key === 'withdrawalPageSize' && value === 10)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      if (!('withdrawalPage' in newParams)) {
        params.delete('withdrawalPage');
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleOpenReview(requestId: string) {
    setOpeningRequestId(requestId);
    const detailsPromise = adminGetReferralCommissionWithdrawalRequest(requestId).finally(() => {
      setOpeningRequestId(null);
    });
    setRequestDetailsPromise(detailsPromise);
    setIsReviewOpen(true);
  }

  function handleCloseReview() {
    setIsReviewOpen(false);
    setRequestDetailsPromise(null);
  }

  const columns = getColumns(handleOpenReview, openingRequestId);

  const renderFiltersContent = () => (
    <>
      <SearchFilter
        label="Buscar"
        placeholder="Nome, e-mail ou ID do pagamento"
        defaultValue={filters.search ?? ''}
        onChange={(value) => navigate({ withdrawalSearch: value })}
      />
      <AsyncCombobox
        label="Gerente de contas"
        placeholder="Todos os gerentes de contas"
        searchPlaceholder="Buscar usuário..."
        searchValue={userSearch}
        selectedValue={selectedUserName}
        isLoading={isLoadingUsers}
        options={userOptions}
        value={filters.userId ?? null}
        onSearchChange={setUserSearch}
        onChange={(key) => {
          const option = userOptions.find((o) => o.key === key);
          setSelectedUserName(option?.label ?? null);
          navigate({ withdrawalUserId: key });
        }}
      />
      <SelectFilter
        label="Status"
        value={filters.status ?? 'all'}
        options={statusOptions}
        onChange={(value) => navigate({ withdrawalStatus: value as ReferralCommissionWithdrawalRequestStatus | 'all' })}
        allLabel="Todos os status"
      />
      <SelectFilter
        label="Por página"
        value={String(filters.pageSize ?? 10)}
        options={pageSizeFilterOptions}
        onChange={(value) => navigate({ withdrawalPageSize: value ? Number(value) : 10 })}
        showChips={false}
      />
    </>
  );

  const totalRequests = items.totalItems;
  const pendingRequests = items.items.filter((r) => r.status === ReferralCommissionWithdrawalRequestStatus.Requested).length;
  const totalAmountSum = items.items.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-6 text-white">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
              <Icon icon={Wallet01Icon} className="icon-sm text-[#4f55f1]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Saques das Indicações</h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Auditoria, liberação e liquidação PIX de comissões de afiliados e gerentes de contas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="button-outline-dark cursor-pointer text-xs"
          >
            <Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${isPending ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* 3-Tile High Contrast KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Total de Pedidos
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
              <Icon icon={Wallet01Icon} className="icon-xs" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
              {totalRequests}
            </span>
            <p className="text-xs text-white/40 font-mono mt-0.5">Solicitações de saque registradas</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Aguardando Liberação
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ec7e00]/15 text-[#ec7e00] border border-[#ec7e00]/30">
              <Icon icon={HourglassIcon} className="icon-xs text-[#ec7e00]" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-[#ec7e00] tracking-tight tabular-nums block">
              {pendingRequests}
            </span>
            <p className="text-xs text-[#ec7e00]/80 font-mono mt-0.5">Pendentes de aprovação e pagamento PIX</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Volume na Página
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
              <Icon icon={MoneyExchange01Icon} className="icon-xs text-[#00a87e]" />
            </div>
          </div>
          <div>
            <AnimatedCurrency
              value={totalAmountSum}
              className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
            />
            <p className="text-xs text-white/40 font-mono mt-0.5">Soma dos pedidos filtrados</p>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={items.items}
          keyExtractor={(item) => item.id}
          isLoading={isPending}
          skeletonRows={items.pageSize || 10}
          emptyMessage="Nenhuma solicitação de saque encontrada"
          minWidth="min-w-220"
          renderMobileCard={renderMobileAdminWithdrawalRequestCard}
          filters={{
            children: renderFiltersContent,
            hasFilters: !!(filters.search || filters.status || filters.userId),
            onClear: () => {
              setSelectedUserName(null);
              setUserSearch('');
              navigate({ withdrawalSearch: null, withdrawalStatus: null, withdrawalUserId: null, withdrawalPage: 1, withdrawalPageSize: 10 });
            },
            onRefresh: handleRefresh,
            isRefreshing: isPending,
          }}
          pagination={{
            page: items.page,
            pageSize: items.pageSize,
            totalItems: items.totalItems,
            totalPages: items.totalPages,
            onPageChange: (page) => navigate({ withdrawalPage: page }),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            onSortChange: (sortBy, sortOrder) => navigate({ sortBy, sortOrder, withdrawalPage: 1 }),
            isNavigating: isPending,
          }}
        />
      </div>

      <ReferralWithdrawalReviewModal
        isOpen={isReviewOpen}
        onOpenChange={(value) => {
          if (!value) {
            handleCloseReview();
            return;
          }
          setIsReviewOpen(true);
        }}
        requestPromise={requestDetailsPromise}
        onPaid={handleRefresh}
      />
    </div>
  );
}
