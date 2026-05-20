'use client';

import type { Key } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ComboBox, Input, Label, ListBox, Spinner } from '@heroui/react';
import { listMerchantCategories } from '@/app/actions/merchant/products';
import type { MinimalCategoryData } from '@/types/merchant/products';
import type { PaymentEnvironment } from '@/types/enums';
import { useDebounce } from '@/hooks/use-debounce';

interface CategorySearchComboboxProps {
	merchantId: string;
	environment: PaymentEnvironment;
	selectedCategoryIds: string[];
	onSelect: (category: MinimalCategoryData) => void;
	isDisabled?: boolean;
}

export function CategorySearchCombobox({
	merchantId,
	environment,
	selectedCategoryIds,
	onSelect,
	isDisabled,
}: CategorySearchComboboxProps) {
	const [inputValue, setInputValue] = useState('');
	const [items, setItems] = useState<MinimalCategoryData[]>([]);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [lastFetchedSearch, setLastFetchedSearch] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const debouncedSearch = useDebounce(inputValue);
	const isSearching = inputValue !== debouncedSearch;
	const isFetching = hasLoaded && lastFetchedSearch !== debouncedSearch;

	useEffect(() => {
		if (!hasLoaded) return;
		if (lastFetchedSearch === debouncedSearch) return;

		abortControllerRef.current?.abort();
		abortControllerRef.current = new AbortController();

		let cancelled = false;

		listMerchantCategories(merchantId, {
			environment,
			search: debouncedSearch || undefined,
			pageSize: 20,
		}).then((response) => {
			if (!cancelled && !abortControllerRef.current?.signal.aborted) {
				setItems(response?.data?.items ?? []);
				setLastFetchedSearch(debouncedSearch);
			}
		});

		return () => {
			cancelled = true;
			abortControllerRef.current?.abort();
		};
	}, [debouncedSearch, merchantId, environment, hasLoaded, lastFetchedSearch]);

	function handleOpenChange(isOpen: boolean) {
		if (isOpen && !hasLoaded) {
			setHasLoaded(true);

			listMerchantCategories(merchantId, {
				environment,
				pageSize: 20,
			}).then((response) => {
				setItems(response?.data?.items ?? []);
				setLastFetchedSearch('');
			});
		}
	}

	const filteredItems = useMemo(() => {
		return items.filter((item) => !selectedCategoryIds.includes(item.id));
	}, [items, selectedCategoryIds]);

	function handleSelectionChange(key: Key | null) {
		if (key === null) return;

		const category = items.find((item) => item.id === String(key));
		if (category) {
			onSelect(category);
			setInputValue('');
		}
	}

	const showLoading = isFetching || isSearching;

	return (
		<ComboBox
			allowsCustomValue={false}
			allowsEmptyCollection
			inputValue={inputValue}
			onInputChange={setInputValue}
			items={filteredItems}
			selectedKey={null}
			onSelectionChange={handleSelectionChange}
			onOpenChange={handleOpenChange}
			isDisabled={isDisabled}
			menuTrigger="focus"
		>
			<Label>Categoria</Label>
			<ComboBox.InputGroup>
				<Input variant="secondary" placeholder="Buscar categoria..." />
				{showLoading && <Spinner size="sm" className="mr-2" />}
				<ComboBox.Trigger />
			</ComboBox.InputGroup>
			<ComboBox.Popover>
				<ListBox
					items={filteredItems}
					renderEmptyState={() => (
						<p className="p-4 text-center text-sm text-muted">
							{showLoading ? 'Buscando...' : 'Nenhuma categoria encontrada'}
						</p>
					)}
				>
					{(item) => (
						<ListBox.Item key={item.id} textValue={item.name}>
							{item.name}
						</ListBox.Item>
					)}
				</ListBox>
			</ComboBox.Popover>
		</ComboBox>
	);
}

