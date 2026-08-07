'use client';

import { useState, useTransition, useDeferredValue, useEffect, useRef, useCallback } from 'react';
import {
	Modal,
	Button,
	TextField,
	Input,
	Label,
	Skeleton,
	Chip,
	ListBox,
	Description,
	Avatar,
	Surface,
	type Selection,
} from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Search01Icon, PercentIcon, Add01Icon, Coupon01Icon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { AsyncButton } from '@/components/ui/async-button';
import { listMerchantCoupons, getMerchantCoupon, updateMerchantCoupon } from '@/app/actions/merchant/coupons';
import { formatDiscount } from '@/utils/currency';
import { toast } from '@heroui/react';
import { EmptyState } from '@/components/ui/empty-state';
import { couponStatusParse } from '@/parse';
import { mapParseColorToChipColor } from '@/parse';
import type { MinimalCoupon } from '@/types/merchant/coupons';
import { type PaymentEnvironment, CouponStatus } from '@/types/enums';

interface AddCouponModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	checkoutId: string;
	environment: PaymentEnvironment;
	existingCouponIds: string[];
	onSuccess: () => void;
}

const PAGE_SIZE = 10;

export function AddCouponModal({
	isOpen,
	onOpenChange,
	merchantId,
	checkoutId,
	environment,
	existingCouponIds,
	onSuccess,
}: AddCouponModalProps) {
	const [isPending, startTransition] = useTransition();
	const [searchValue, setSearchValue] = useState('');
	const deferredSearch = useDeferredValue(searchValue);
	const [coupons, setCoupons] = useState<MinimalCoupon[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [lastFetchedSearch, setLastFetchedSearch] = useState<string | null>(null);
	const [selectedCoupons, setSelectedCoupons] = useState<Selection>(new Set());

	function resetState() {
		setSearchValue('');
		setCoupons([]);
		setSelectedCoupons(new Set());
		setPage(1);
		setHasMore(false);
		setLastFetchedSearch(null);
	}

	const fetchCoupons = useCallback(
		async (searchTerm: string, pageNumber: number, append: boolean) => {
			if (pageNumber === 1) {
				setIsLoading(true);
			} else {
				setIsLoadingMore(true);
			}

			const response = await listMerchantCoupons(merchantId, {
				environment,
				search: searchTerm || undefined,
				status: CouponStatus.Active,
				page: pageNumber,
				pageSize: PAGE_SIZE,
			});

			const newItems = response?.data?.items ?? [];
			const totalPages = response?.data?.totalPages ?? 1;

			if (append) {
				setCoupons((prev) => [...prev, ...newItems]);
			} else {
				setCoupons(newItems);
			}

			setHasMore(pageNumber < totalPages);
			setIsLoading(false);
			setIsLoadingMore(false);
			setLastFetchedSearch(searchTerm);
			setPage(pageNumber);
		},
		[merchantId, environment],
	);

	const availableCoupons = coupons.filter((c) => {
		const isAlreadyAdded = existingCouponIds.includes(c.id);
		const appliesAutomatically = c.applyToAllCheckouts;
		return !isAlreadyAdded && !appliesAutomatically;
	});

	const selectedCouponIds =
		selectedCoupons === 'all' ? availableCoupons.map((c) => c.id) : Array.from(selectedCoupons as Set<string>);

	function handleLoadMore() {
		fetchCoupons(deferredSearch, page + 1, true);
	}

	function handleSearchChange(value: string) {
		setSearchValue(value);
	}

	function handleAdd() {
		if (selectedCouponIds.length === 0) return;

		startTransition(async () => {
			let successCount = 0;
			let errorCount = 0;

			for (const couponId of selectedCouponIds) {
				const couponResponse = await getMerchantCoupon(merchantId, couponId);

				if (!couponResponse?.data) {
					errorCount++;
					continue;
				}

				const currentCheckoutIds = couponResponse.data.checkouts.map((c) => c.id);
				const newCheckoutIds = [...currentCheckoutIds, checkoutId];

				const updateResponse = await updateMerchantCoupon(merchantId, couponId, {
					checkoutIds: newCheckoutIds,
					environment,
				});

				if (updateResponse?.error) {
					errorCount++;
				} else {
					successCount++;
				}
			}

			if (successCount > 0) {
				toast('Cupom vinculado', {
					description: `${successCount} cupom${successCount > 1 ? 'ns' : ''} vinculado${successCount > 1 ? 's' : ''} ao checkout!`,
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				onSuccess();
			}

			if (errorCount > 0) {
				toast('Erro ao vincular', {
					description: `Não foi possível vincular ${errorCount} cupom${errorCount > 1 ? 'ns' : ''}.`,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			}

			onOpenChange(false);
			resetState();
		});
	}

	function handleClose() {
		onOpenChange(false);
		resetState();
	}

	async function handleOpenChange(open: boolean) {
		if (open) {
			await fetchCoupons('', 1, false);
		} else {
			handleClose();
		}
	}

	const isFirstRender = useRef(true);
	const [, startSearchTransition] = useTransition();

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		if (!isOpen) return;
		if (deferredSearch === lastFetchedSearch) return;

		startSearchTransition(() => {
			fetchCoupons(deferredSearch, 1, false);
		});
	}, [deferredSearch, isOpen, lastFetchedSearch, fetchCoupons]);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Coupon01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Adicionar Cupons</Modal.Heading>
						<p className="text-sm text-muted">Selecione os cupons que deseja vincular a este checkout</p>
					</Modal.Header>
					<Modal.Body className="space-y-4">
						<TextField variant="secondary" value={searchValue} onChange={handleSearchChange}>
							<Label className="sr-only">Buscar cupom</Label>
							<div className="relative">
								<Icon icon={Search01Icon} className="icon-sm text-muted absolute left-3 top-1/2 -translate-y-1/2" />
								<Input variant="secondary" placeholder="Buscar por código ou nome..." className="pl-10" />
							</div>
						</TextField>

						{isLoading ? (
							<div className="space-y-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<Skeleton key={i} className="h-20 rounded-lg" />
								))}
							</div>
						) : availableCoupons.length === 0 ? (
							<EmptyState>
								<EmptyState.Indicator>
									<Icon icon={Coupon01Icon} className="icon-lg" />
								</EmptyState.Indicator>
								<EmptyState.Heading>Nenhum cupom disponível</EmptyState.Heading>
								<EmptyState.Description>
									{coupons.length > 0 && coupons.every((c) => c.applyToAllCheckouts || existingCouponIds.includes(c.id))
										? 'Todos os cupons disponíveis já se aplicam automaticamente a todos os checkouts ou já estão vinculados.'
										: searchValue
											? 'Tente buscar por outro termo'
											: 'Cadastre cupons ativos para vincular ao checkout'}
								</EmptyState.Description>
							</EmptyState>
						) : (
							<Surface className="max-h-80 overflow-y-auto rounded-xl">
								<ListBox
									aria-label="Selecionar cupons"
									selectionMode="multiple"
									selectedKeys={selectedCoupons}
									onSelectionChange={setSelectedCoupons}
								>
									{availableCoupons.map((coupon) => {
										const statusParse = couponStatusParse[coupon.status];
										const hasReachedLimit = coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses;

										return (
											<ListBox.Item key={coupon.id} id={coupon.id} textValue={coupon.code}>
												<Avatar className="size-10 rounded-lg bg-surface-secondary">
													<Avatar.Fallback className="rounded-lg">
														<Icon icon={PercentIcon} className="icon-md" />
													</Avatar.Fallback>
												</Avatar>
												<div className="flex flex-col gap-0.5">
													<div className="flex items-center gap-2">
														<Label className="font-mono font-semibold">{coupon.code}</Label>
														<Chip size="sm" variant="soft" color={mapParseColorToChipColor(statusParse.color)}>
															{statusParse.label}
														</Chip>
														{hasReachedLimit && (
															<Chip size="sm" variant="soft" color="warning">
																Limite atingido
															</Chip>
														)}
													</div>
													<Description>
														{coupon.name ? `${coupon.name} • ` : ''}
														{formatDiscount(coupon)} • Usos: {coupon.currentUses}
														{coupon.maxUses ? `/${coupon.maxUses}` : ''}
													</Description>
												</div>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										);
									})}
								</ListBox>
							</Surface>
						)}

						{hasMore && !isLoading && (
							<Button variant="tertiary" className="w-full" onPress={handleLoadMore} isPending={isLoadingMore}>
								Carregar mais
							</Button>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={handleClose} isDisabled={isPending}>
							Cancelar
						</Button>
						<AsyncButton
							variant="primary"
							onPress={handleAdd}
							isPending={isPending}
							isDisabled={selectedCouponIds.length === 0}
						>
							<Icon icon={Add01Icon} className="icon-sm" />
							Vincular {selectedCouponIds.length > 0 ? `(${selectedCouponIds.length})` : ''}
						</AsyncButton>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
