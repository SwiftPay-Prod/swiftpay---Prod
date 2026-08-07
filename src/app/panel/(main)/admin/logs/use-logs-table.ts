'use client';

import { useState, useCallback, useTransition, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { adminListMerchants } from '@/app/actions/admin/merchants';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';
import type { AdminLogType } from '@/types/admin/logs';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { AsyncComboboxOption } from '@/components/ui/async-combobox';
import { formatDocument } from '@/utils/input-masks';
import type { Filters } from './page';

interface FiltersState {
	search: string;
	type: AdminLogType;
	merchantId: string;
	acquirerType: string;
	statusCode: string;
	action: string;
	pageSize: string;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

interface MerchantComboboxState {
	search: string;
	options: AdminMinimalMerchant[];
	isLoading: boolean;
	selected: AdminMinimalMerchant | null;
}

interface AcquirerComboboxState {
	search: string;
	options: AdminAcquirerData[];
	isLoading: boolean;
	selected: AdminAcquirerData | null;
}

const initialFilters: FiltersState = {
	search: '',
	type: 'Api',
	merchantId: '',
	acquirerType: '',
	statusCode: '',
	action: '',
	pageSize: '10',
	sortBy: 'createdAt',
	sortOrder: 'desc',
};

const initialMerchantCombobox: MerchantComboboxState = {
	search: '',
	options: [],
	isLoading: false,
	selected: null,
};

const initialAcquirerCombobox: AcquirerComboboxState = {
	search: '',
	options: [],
	isLoading: false,
	selected: null,
};

function toFilterState(filters: Filters): FiltersState {
	return {
		search: filters.search ?? '',
		type: filters.type ?? 'Api',
		merchantId: filters.merchantId ?? '',
		acquirerType: filters.acquirerType ?? '',
		statusCode: filters.statusCode ? String(filters.statusCode) : '',
		action: filters.action ?? '',
		pageSize: String(filters.pageSize ?? 10),
		sortBy: filters.sortBy ?? 'createdAt',
		sortOrder: filters.sortOrder ?? 'desc',
	};
}

function getAcquirerDisplayName(acquirer: { displayName?: string | null; name: string }): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

function normalizeSearchValue(value?: string | null): string {
	return value?.trim().toLowerCase() ?? '';
}

function filterAcquirersBySearch(acquirers: AdminAcquirerData[], search: string): AdminAcquirerData[] {
	const normalizedSearch = normalizeSearchValue(search);
	if (!normalizedSearch) return [];

	return acquirers.filter((acquirer) => {
		const normalizedDisplayName = normalizeSearchValue(getAcquirerDisplayName(acquirer));
		const normalizedName = normalizeSearchValue(acquirer.name);
		const normalizedCode = normalizeSearchValue(acquirer.code);
		const normalizedType = normalizeSearchValue(acquirer.type);
		const normalizedNominal = normalizeSearchValue(acquirer.nominal);

		return (
			normalizedDisplayName.includes(normalizedSearch) ||
			normalizedName.includes(normalizedSearch) ||
			normalizedCode.includes(normalizedSearch) ||
			normalizedType.includes(normalizedSearch) ||
			normalizedNominal.includes(normalizedSearch)
		);
	});
}

function mergeUniqueAcquirers(
	primary: AdminAcquirerData[],
	secondary: AdminAcquirerData[],
	limit = 10
): AdminAcquirerData[] {
	const map = new Map<string, AdminAcquirerData>();

	for (const acquirer of primary) {
		if (!map.has(acquirer.id)) map.set(acquirer.id, acquirer);
		if (map.size >= limit) return Array.from(map.values());
	}

	for (const acquirer of secondary) {
		if (!map.has(acquirer.id)) map.set(acquirer.id, acquirer);
		if (map.size >= limit) break;
	}

	return Array.from(map.values());
}

function getAcquirerOptionDescription(acquirer: AdminAcquirerData): string | null {
	const nominalOrName = acquirer.nominal?.trim() || acquirer.name;
	const code = acquirer.code?.trim();

	if (code && nominalOrName && nominalOrName.toLowerCase() !== code.toLowerCase()) {
		return `${code} - ${nominalOrName}`;
	}

	return code || nominalOrName || null;
}

interface UseLogsTableProps {
	filters: Filters;
}

function getFiltersSignature(filters: Filters): string {
	return [
		filters.search ?? '',
		filters.type ?? 'Api',
		filters.merchantId ?? '',
		filters.acquirerType ?? '',
		filters.statusCode ? String(filters.statusCode) : '',
		filters.action ?? '',
		String(filters.pageSize ?? 10),
		filters.sortBy ?? 'createdAt',
		filters.sortOrder ?? 'desc',
	].join('|');
}

export function useLogsTable({ filters }: UseLogsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [acquirerCatalog, setAcquirerCatalog] = useState<AdminAcquirerData[]>([]);
	const [merchantCombobox, setMerchantCombobox] = useState<MerchantComboboxState>(initialMerchantCombobox);
	const [acquirerCombobox, setAcquirerCombobox] = useState<AcquirerComboboxState>(initialAcquirerCombobox);
	const [filterDraft, setFilterDraft] = useState<{ sourceSignature: string; overrides: Partial<FiltersState> }>(() => ({
		sourceSignature: getFiltersSignature(filters),
		overrides: {},
	}));

	const filtersSignature = getFiltersSignature(filters);
	const filterValues = useMemo<FiltersState>(() => {
		const baseFilterValues = toFilterState(filters);
		const activeOverrides = filterDraft.sourceSignature === filtersSignature ? filterDraft.overrides : {};
		return {
			...baseFilterValues,
			...activeOverrides,
		};
	}, [filters, filterDraft, filtersSignature]);

	const debouncedMerchantSearch = useDebounce(merchantCombobox.search);
	const debouncedAcquirerSearch = useDebounce(acquirerCombobox.search);
	const isMerchantSearchActive = merchantCombobox.search.trim().length > 0;
	const isAcquirerSearchActive = acquirerCombobox.search.trim().length > 0;

	useEffect(() => {
		let cancelled = false;

		adminListAcquirers({
			page: 1,
			pageSize: 200,
		}).then((response) => {
			if (!cancelled) {
				setAcquirerCatalog(response?.data?.items ?? []);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const trimmedSearch = debouncedMerchantSearch.trim();
		if (trimmedSearch.length < 1) return;

		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setMerchantCombobox((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListMerchants({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
		}).then((response) => {
			if (!cancelled) {
				setMerchantCombobox((prev) => ({
					...prev,
					options: response?.data?.items ?? [],
					isLoading: false,
				}));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [debouncedMerchantSearch]);

	useEffect(() => {
		const trimmedSearch = debouncedAcquirerSearch.trim();
		if (trimmedSearch.length < 1) return;

		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setAcquirerCombobox((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListAcquirers({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
		}).then((response) => {
			if (!cancelled) {
				const apiOptions = response?.data?.items ?? [];
				const catalogMatches = filterAcquirersBySearch(acquirerCatalog, trimmedSearch);
				const mergedOptions = mergeUniqueAcquirers(apiOptions, catalogMatches, 10);

				setAcquirerCombobox((prev) => ({
					...prev,
					options: mergedOptions,
					isLoading: false,
				}));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [acquirerCatalog, debouncedAcquirerSearch]);

	const hasFilters =
		filterValues.search !== '' ||
		filterValues.type !== 'Api' ||
		filterValues.merchantId !== '' ||
		filterValues.acquirerType !== '' ||
		filterValues.statusCode !== '' ||
		filterValues.action !== '' ||
		filterValues.pageSize !== '10';

	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === '' || (key === 'pageSize' && value === '10')) {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				if (!('page' in newParams)) params.delete('page');

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[pathname, router, searchParams]
	);

	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilterDraft((prev) => {
			const currentOverrides = prev.sourceSignature === filtersSignature ? prev.overrides : {};
			return {
				sourceSignature: filtersSignature,
				overrides: { ...currentOverrides, [key]: value },
			};
		});
	}, [filtersSignature]);

	const applyFilters = useCallback(() => {
		navigate({
			search: filterValues.search,
			type: filterValues.type === 'Api' ? null : filterValues.type,
			merchantId: filterValues.merchantId,
			acquirerType: filterValues.acquirerType,
			statusCode: filterValues.statusCode,
			action: filterValues.action,
			pageSize: filterValues.pageSize,
			sortBy: filterValues.sortBy,
			sortOrder: filterValues.sortOrder,
			page: null,
		});
	}, [filterValues, navigate]);

	const clearFilters = useCallback(() => {
		setFilterDraft({
			sourceSignature: filtersSignature,
			overrides: initialFilters,
		});
		setMerchantCombobox(initialMerchantCombobox);
		setAcquirerCombobox(initialAcquirerCombobox);
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
	}, [filtersSignature, pathname, router]);

	const setType = useCallback(
		(type: AdminLogType) => {
			setFilterDraft({
				sourceSignature: filtersSignature,
				overrides: { ...initialFilters, type },
			});
			setMerchantCombobox(initialMerchantCombobox);
			setAcquirerCombobox(initialAcquirerCombobox);
			startTransition(() => {
				if (type === 'Api') {
					const params = new URLSearchParams();
					params.set('sortBy', initialFilters.sortBy);
					params.set('sortOrder', initialFilters.sortOrder);
					router.push(`${pathname}?${params.toString()}`, { scroll: false });
					return;
				}
				const params = new URLSearchParams();
				params.set('type', type);
				params.set('sortBy', initialFilters.sortBy);
				params.set('sortOrder', initialFilters.sortOrder);
				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[filtersSignature, pathname, router]
	);

	const handleMerchantSearchChange = useCallback((value: string) => {
		setMerchantCombobox((prev) => {
			if (value.trim().length < 1) {
				return { ...prev, search: value, options: [], isLoading: false };
			}
			return { ...prev, search: value };
		});
	}, []);

	const handleMerchantChange = useCallback(
		(key: string | null) => {
			const nextMerchant = merchantCombobox.options.find((merchant) => merchant.id === key) ?? null;
			updateFilter('merchantId', key ?? '');
			setMerchantCombobox((prev) => ({
				...prev,
				selected: nextMerchant,
				search: key ? prev.search : '',
			}));
		},
		[merchantCombobox.options, updateFilter]
	);

	const handleAcquirerSearchChange = useCallback((value: string) => {
		setAcquirerCombobox((prev) => {
			if (value.trim().length < 1) {
				return { ...prev, search: value, options: [], isLoading: false };
			}
			return { ...prev, search: value };
		});
	}, []);

	const handleAcquirerChange = useCallback(
		(key: string | null) => {
			const nextAcquirer = acquirerCombobox.options.find((acquirer) => acquirer.id === key) ?? null;
			updateFilter('acquirerType', nextAcquirer?.type ?? '');
			setAcquirerCombobox((prev) => ({
				...prev,
				selected: nextAcquirer,
				search: key ? prev.search : '',
			}));
		},
		[acquirerCombobox.options, updateFilter]
	);

	const merchantComboboxOptions: AsyncComboboxOption[] = (isMerchantSearchActive ? merchantCombobox.options : []).map(
		(merchant) => ({
			key: merchant.id,
			label: merchant.name ?? 'Sem nome',
			description: merchant.document ? formatDocument(merchant.document) : null,
		})
	);

	const acquirerComboboxOptions: AsyncComboboxOption[] = (isAcquirerSearchActive ? acquirerCombobox.options : []).map(
		(acquirer) => ({
			key: acquirer.id,
			label: getAcquirerDisplayName(acquirer),
			description: getAcquirerOptionDescription(acquirer),
		})
	);

	const handleSortChange = useCallback(
		(sortBy: string, sortOrder: 'asc' | 'desc') => {
			setFilterDraft((prev) => {
				const currentOverrides = prev.sourceSignature === filtersSignature ? prev.overrides : {};
				return {
					sourceSignature: filtersSignature,
					overrides: { ...currentOverrides, sortBy, sortOrder },
				};
			});
			navigate({ sortBy, sortOrder, page: 1 });
		},
		[filtersSignature, navigate]
	);

	const handlePageChange = useCallback(
		(page: number) => {
			navigate({ page: page > 1 ? page : null });
		},
		[navigate]
	);

	const refresh = useCallback(() => {
		startTransition(() => {
			router.refresh();
		});
	}, [router]);

	return {
		filters: {
			values: filterValues,
			hasFilters,
			updateFilter,
			clear: clearFilters,
			merchant: {
				search: merchantCombobox.search,
				options: merchantComboboxOptions,
				isLoading: isMerchantSearchActive && merchantCombobox.isLoading,
				selectedName: merchantCombobox.selected?.name ?? (filterValues.merchantId || undefined),
				value: merchantCombobox.selected?.id ?? null,
				onSearchChange: handleMerchantSearchChange,
				onChange: handleMerchantChange,
			},
			acquirer: {
				search: acquirerCombobox.search,
				options: acquirerComboboxOptions,
				rawOptions: acquirerCombobox.options,
				catalog: acquirerCatalog,
				isLoading: isAcquirerSearchActive && acquirerCombobox.isLoading,
				selectedDisplayName: acquirerCombobox.selected
					? getAcquirerDisplayName(acquirerCombobox.selected)
					: filterValues.acquirerType || undefined,
				value: acquirerCombobox.selected?.id ?? null,
				onSearchChange: handleAcquirerSearchChange,
				onChange: handleAcquirerChange,
			},
		},
		actions: {
			applyFilters,
			refresh,
			changePage: handlePageChange,
			setType,
			handleSortChange,
		},
		isPending,
	};
}
