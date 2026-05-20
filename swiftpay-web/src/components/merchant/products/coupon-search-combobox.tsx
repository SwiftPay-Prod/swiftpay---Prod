'use client';

import type { Key } from 'react';
import { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
import { ComboBox, Input, Label, ListBox, Chip, Spinner } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { listMerchantCoupons } from '@/app/actions/merchant/coupons';
import { formatCurrency } from '@/utils/currency';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import { CouponStatus, type PaymentEnvironment } from '@/types/enums';

interface CouponSearchComboboxProps {
	merchantId: string;
	environment: PaymentEnvironment;
	selectedCouponIds: string[];
	selectedCoupons: MinimalCoupon[];
	onSelect: (coupon: MinimalCoupon) => void;
	onRemove: (couponId: string) => void;
	isDisabled?: boolean;
}

export function CouponSearchCombobox({
	merchantId,
	environment,
	selectedCouponIds,
	selectedCoupons,
	onSelect,
	onRemove,
	isDisabled,
}: CouponSearchComboboxProps) {
	const [inputValue, setInputValue] = useState('');
	const [items, setItems] = useState<MinimalCoupon[]>([]);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [lastFetchedSearch, setLastFetchedSearch] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const deferredSearch = useDeferredValue(inputValue);
	const isSearching = inputValue !== deferredSearch;
	const isFetching = hasLoaded && lastFetchedSearch !== deferredSearch;

	useEffect(() => {
		if (!hasLoaded) return;
		if (lastFetchedSearch === deferredSearch) return;

		abortControllerRef.current?.abort();
		abortControllerRef.current = new AbortController();

		let cancelled = false;

		listMerchantCoupons(merchantId, {
			environment,
			search: deferredSearch || undefined,
			status: CouponStatus.Active,
			pageSize: 20,
		}).then((response) => {
			if (!cancelled && !abortControllerRef.current?.signal.aborted) {
				setItems(response?.data?.items ?? []);
				setLastFetchedSearch(deferredSearch);
			}
		});

		return () => {
			cancelled = true;
			abortControllerRef.current?.abort();
		};
	}, [deferredSearch, merchantId, environment, hasLoaded, lastFetchedSearch]);

	function handleOpenChange(isOpen: boolean) {
		if (isOpen && !hasLoaded) {
			setHasLoaded(true);

			listMerchantCoupons(merchantId, {
				environment,
				status: CouponStatus.Active,
				pageSize: 20,
			}).then((response) => {
				setItems(response?.data?.items ?? []);
				setLastFetchedSearch('');
			});
		}
	}

	const filteredItems = useMemo(() => {
		return items.filter((item) => !selectedCouponIds.includes(item.id));
	}, [items, selectedCouponIds]);

	function handleSelectionChange(key: Key | null) {
		if (key === null) return;

		const selectedCoupon = items.find((item) => item.id === String(key));
		if (selectedCoupon) {
			onSelect(selectedCoupon);
			setInputValue('');
		}
	}

	function formatCouponLabel(coupon: MinimalCoupon): string {
		if (coupon.discountType === 'Percentage' && coupon.discountPercentage !== null) {
			return `${coupon.code} (${coupon.discountPercentage / 100}% off)`;
		}
		if (coupon.discountFixedAmount !== null) {
			return `${coupon.code} (${formatCurrency(coupon.discountFixedAmount)} off)`;
		}
		return coupon.code;
	}

	const showLoading = isFetching || isSearching;

	return (
		<div className="flex flex-col gap-3">
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
				<Label>Cupons (opcional)</Label>
				<ComboBox.InputGroup>
					<Input variant="secondary" placeholder="Buscar cupom..." />
					{showLoading && <Spinner size="sm" className="mr-2" />}
					<ComboBox.Trigger />
				</ComboBox.InputGroup>
				<ComboBox.Popover>
					<ListBox
						items={filteredItems}
						renderEmptyState={() => (
							<p className="p-4 text-center text-sm text-muted">
								{showLoading ? 'Buscando...' : 'Nenhum cupom encontrado'}
							</p>
						)}
					>
						{(item) => (
							<ListBox.Item key={item.id} textValue={item.code}>
								<div className="flex flex-col">
									<span className="font-medium">{item.code}</span>
									<span className="text-xs text-muted">{formatCouponLabel(item)}</span>
								</div>
							</ListBox.Item>
						)}
					</ListBox>
				</ComboBox.Popover>
			</ComboBox>

			{selectedCoupons.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedCoupons.map((coupon) => (
						<Chip key={coupon.id} variant="secondary" className="gap-1 pr-1">
							{formatCouponLabel(coupon)}
							{!isDisabled && (
								<button
									type="button"
									onClick={() => onRemove(coupon.id)}
									className="flex items-center justify-center rounded-full p-0.5 hover:bg-foreground/10"
								>
									<Icon icon={CancelCircleIcon} className="icon-xs" />
								</button>
							)}
						</Chip>
					))}
				</div>
			)}
		</div>
	);
}

