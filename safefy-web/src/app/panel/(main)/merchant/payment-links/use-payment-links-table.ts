'use client';

import { createElement, useEffect, useState } from 'react';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import {
  deleteMerchantPaymentLink,
  expireMerchantPaymentLink,
  getMerchantPaymentLink,
  listMerchantPaymentLinks,
} from '@/app/actions/merchant/payment-links';
import { useDebounce } from '@/hooks/use-debounce';
import { PaymentMethod, PaymentStatus } from '@/types/enums';
import type { ApiResponse, Paginated } from '@/types/common';
import type { MinimalPaymentLink, PaymentLinkDetails } from '@/types/merchant/payment-links';

interface FiltersState {
  search: string;
  status: PaymentStatus | 'all';
  method: PaymentMethod | 'all';
  pageSize: string;
  page: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

type PaymentLinkPromise = Promise<ApiResponse<PaymentLinkDetails>>;

interface DetailsModalState {
  isOpen: boolean;
  paymentLinkPromise: PaymentLinkPromise | null;
}

interface DeleteModalState {
  isOpen: boolean;
  paymentLink: MinimalPaymentLink | null;
}

const initialFilters: FiltersState = {
  search: '',
  status: 'all',
  method: 'all',
  pageSize: '10',
  page: 1,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const emptyPaginated: Paginated<MinimalPaymentLink> = {
  items: [],
  totalItems: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

const initialDetailsModal: DetailsModalState = {
  isOpen: false,
  paymentLinkPromise: null,
};

const initialDeleteModal: DeleteModalState = {
  isOpen: false,
  paymentLink: null,
};

interface UsePaymentLinksTableOptions {
  merchantId: string;
}

export function usePaymentLinksTable({ merchantId }: UsePaymentLinksTableOptions) {
  const [data, setData] = useState<Paginated<MinimalPaymentLink> | null>(null);
  const [fetchedParams, setFetchedParams] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);

  const debouncedSearch = useDebounce(filters.search);
  const pageSizeValue = Number.parseInt(filters.pageSize, 10) || 10;

  const currentParams = JSON.stringify({
    merchantId,
    status: filters.status,
    method: filters.method,
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    search: debouncedSearch,
    refreshKey,
  });

  const isLoading = fetchedParams !== currentParams;

  const paymentLinks = data ?? {
    ...emptyPaginated,
    page: filters.page,
    pageSize: pageSizeValue,
  };

  const hasFilters =
    filters.status !== 'all' ||
    filters.method !== 'all' ||
    filters.pageSize !== '10' ||
    filters.search.trim() !== '';

  useEffect(() => {
    if (fetchedParams === currentParams) {
      return;
    }

    let cancelled = false;

    const requestStatus = filters.status === 'all' ? undefined : filters.status;
    const requestMethod = filters.method === 'all' ? undefined : filters.method;
    const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

    listMerchantPaymentLinks(merchantId, {
      status: requestStatus,
      method: requestMethod,
      search: requestSearch,
      page: filters.page,
      pageSize: pageSizeValue,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }).then((response) => {
      if (cancelled) {
        return;
      }

      if (response?.error) {
        toast('Erro ao listar links', {
          description: response.error.message,
          variant: 'danger',
          indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
        });
        setData(emptyPaginated);
        setFetchedParams(currentParams);
        if (isRefreshing) {
          setIsRefreshing(false);
        }
        return;
      }

      const items = response?.data?.items ?? [];
      setData(response?.data ?? emptyPaginated);
      setFetchedParams(currentParams);
      if (isRefreshing) {
        setIsRefreshing(false);
      }

      const toExpire = items.filter(
        (l) => l.isExpired && l.status === PaymentStatus.Pending && l.paymentId !== null,
      );
      if (toExpire.length > 0) {
        const expireIds = new Set(toExpire.map((l) => l.id));
        Promise.all(toExpire.map((l) => expireMerchantPaymentLink(merchantId, l.id))).then(() => {
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: prev.items.map((item) =>
                expireIds.has(item.id) ? { ...item, status: PaymentStatus.Expired } : item,
              ),
            };
          });
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    merchantId,
    filters.status,
    filters.method,
    filters.page,
    filters.sortBy,
    filters.sortOrder,
    pageSizeValue,
    currentParams,
    fetchedParams,
    debouncedSearch,
    isRefreshing,
  ]);

  function updateFilter<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  }

  function handleSearchChange(value: string) {
    updateFilter('search', value);
  }

  function handleStatusChange(key: string) {
    updateFilter('status', (key || 'all') as PaymentStatus | 'all');
  }

  function handleMethodChange(key: string) {
    updateFilter('method', (key || 'all') as PaymentMethod | 'all');
  }

  function handlePageSizeChange(key: string) {
    updateFilter('pageSize', key || '10');
  }

  function handlePageChange(nextPage: number) {
    setFilters((previous) => ({ ...previous, page: nextPage }));
  }

  function handleClearFilters() {
    setFilters(initialFilters);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setRefreshKey((value) => value + 1);
  }

  function openDetails(id: string) {
    setDetailsModal({
      isOpen: true,
      paymentLinkPromise: getMerchantPaymentLink(merchantId, id),
    });
  }

  function closeDetails(open: boolean) {
    setDetailsModal(open ? detailsModal : initialDetailsModal);
  }

  function openDeleteModal(paymentLink: MinimalPaymentLink) {
    setDeleteModal({
      isOpen: true,
      paymentLink,
    });
  }

  function closeDeleteModal(open: boolean) {
    if (!open) {
      setDeleteModal(initialDeleteModal);
    }
  }

  function handleDeleteSuccess() {
    setDeleteModal(initialDeleteModal);
    handleRefresh();
  }

  async function deletePaymentLink(id: string) {
    const response = await deleteMerchantPaymentLink(merchantId, id);
    if (response?.error) {
      toast('Erro ao excluir link', {
        description: response.error.message,
        variant: 'danger',
        indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
      });
      return;
    }

    toast('Link excluído', {
      description: response?.message ?? 'Link de pagamento removido com sucesso.',
      variant: 'success',
      indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
    });

    handleRefresh();
  }

  return {
    data: {
      paymentLinks,
      isLoading,
      isRefreshing,
      pageSizeValue,
    },
    filters: {
      values: filters,
      hasFilters,
      updateFilter,
      handleSearchChange,
      handleStatusChange,
      handleMethodChange,
      handlePageSizeChange,
      handlePageChange,
      handleClearFilters,
      handleRefresh,
    },
    modals: {
      details: {
        isOpen: detailsModal.isOpen,
        paymentLinkPromise: detailsModal.paymentLinkPromise,
        close: closeDetails,
      },
      delete: {
        isOpen: deleteModal.isOpen,
        paymentLink: deleteModal.paymentLink,
        open: openDeleteModal,
        close: closeDeleteModal,
        onSuccess: handleDeleteSuccess,
      },
    },
    actions: {
      openDetails,
      deletePaymentLink,
    },
  };
}
