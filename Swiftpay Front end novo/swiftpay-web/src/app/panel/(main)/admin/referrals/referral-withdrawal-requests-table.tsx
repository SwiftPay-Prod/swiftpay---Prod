'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Chip, Tooltip } from '@heroui/react';
import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { AsyncCombobox, type AsyncComboboxOption } from '@/components/ui/async-combobox';
import { EmailLink } from '@/components/ui/data-links';
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
      header: 'Gerente de contas',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{item.referrerName || 'Sem nome'}</span>
          <EmailLink email={item.referrerEmail} className="text-sm" />
        </div>
      ),
    },
    {
      key: 'requestedAt',
      header: 'Solicitado em',
      render: (item) => <span className="text-sm text-muted">{formatDate(item.requestedAt)}</span>,
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (item) => <span className="font-medium">{formatCurrency(item.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const meta = getStatusMeta(item.status);
        return (
          <Chip variant="soft" color={meta.color} size="sm">
            {meta.label}
          </Chip>
        );
      },
    },
    {
      key: 'notes',
      header: 'Observações',
      render: (item) => <span className="text-sm text-muted">{item.notes || '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center">
          <Tooltip>
            <Button
              isIconOnly
              size="sm"
              variant={item.status === ReferralCommissionWithdrawalRequestStatus.Requested ? 'primary' : 'tertiary'}
              isPending={openingRequestId === item.id}
              onPress={() => onOpenReview(item.id)}
            >
              <Icon icon={Wallet01Icon} className="icon-sm" />
              <Tooltip.Content>
                {item.status === ReferralCommissionWithdrawalRequestStatus.Requested
                  ? 'Marcar pagamento'
                  : 'Ver detalhes do pagamento'}
              </Tooltip.Content>
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];
}

function renderMobileAdminWithdrawalRequestCard(item: AdminMinimalReferralCommissionWithdrawalRequest, _index: number, openActions?: () => void) {
  const meta = getStatusMeta(item.status);
  return (
    <div
      className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
      onClick={openActions}
      role={openActions ? 'button' : undefined}
      tabIndex={openActions ? 0 : undefined}
      onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground truncate">{item.referrerName || 'Sem nome'}</span>
          <EmailLink email={item.referrerEmail} className="text-xs" />
        </div>
        <Chip variant="soft" color={meta.color} size="sm">
          {meta.label}
        </Chip>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Valor</span>
          <span className="font-medium">{formatCurrency(item.amount)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Solicitado em</span>
          <span>{formatDate(item.requestedAt)}</span>
        </div>
        {item.notes && (
          <div className="flex justify-between text-xs">
            <span className="text-muted">Observações</span>
            <span className="truncate max-w-40">{item.notes}</span>
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

  return (
    <>
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
    </>
  );
}
