'use client';

import { useState, useTransition } from 'react';
import { Button, Chip, AlertDialog, Tooltip } from '@heroui/react';
import { InlineList } from '@/components/ui/inline-list';
import { SectionAccordion } from '@/components/ui/system-accordion';
import { Icon } from '@/components/ui/icon';
import { Coupon02Icon, Add01Icon, Delete02Icon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { formatDiscount } from '@/utils/currency';
import { couponStatusParse, couponDiscountTypeParse, mapParseColorToChipColor } from '@/parse';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import { getMerchantCoupon, updateMerchantCoupon } from '@/app/actions/merchant/coupons';
import { AddCouponModal } from '../modals/add-coupon-modal';
import type { CheckoutData, CheckoutCouponData } from '@/types/merchant/checkouts';

interface CouponsTabProps {
	checkout: CheckoutData;
	merchantId: string;
	onRefresh: () => void;
}

export function CouponsTab({ checkout, merchantId, onRefresh }: CouponsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [removingCoupon, setRemovingCoupon] = useState<CheckoutCouponData | null>(null);

	const existingCouponIds = checkout.coupons.map((c) => c.id);

	function handleRemoveCoupon() {
		if (!removingCoupon) return;

		startTransition(async () => {
			const couponResponse = await getMerchantCoupon(merchantId, removingCoupon.id);
			if (!couponResponse?.data) {
				toast('Cupom não encontrado', {
					description: 'Não foi possível localizar o cupom.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const currentCheckoutIds = couponResponse.data.checkouts.map((c) => c.id).filter((id) => id !== checkout.id);
			const response = await updateMerchantCoupon(merchantId, removingCoupon.id, {
				checkoutIds: currentCheckoutIds,
				environment: checkout.environment,
			});
			if (response?.error) {
				toast('Erro ao remover', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}
			toast('Cupom removido', {
				description: 'O cupom foi removido do checkout.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setRemovingCoupon(null);
			onRefresh();
		});
	}

	function handleAddSuccess() {
		setIsAddOpen(false);
		onRefresh();
	}

	return (
		<div className="flex flex-col gap-4">
			<SectionAccordion
				id="checkout-coupons"
				icon={Coupon02Icon}
				title="Cupons"
				summary="Gerencie os cupons disponíveis neste checkout"
				defaultExpanded={false}
				bodyClassName="p-4"
			>
				<div className="mb-3 flex justify-end">
					<Button variant="secondary" size="sm" onPress={() => setIsAddOpen(true)}>
						<Icon icon={Add01Icon} className="icon-sm" />
						Adicionar Cupom
					</Button>
				</div>

				{checkout.coupons.length === 0 ? (
					<p className="text-sm text-muted">Nenhum cupom vinculado</p>
				) : (
					<InlineList
					items={checkout.coupons}
					getKey={(coupon) => coupon.id}
					getTitle={(coupon) => <code className="font-semibold">{coupon.code}</code>}
					getSubtitle={(coupon) => coupon.name || undefined}
					renderTrailing={(coupon) => {
						const statusParse = couponStatusParse[coupon.status];
						const typeParse = couponDiscountTypeParse[coupon.discountType];
						const hasReachedLimit = coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses;
						return (
							<div className="flex items-center gap-2">
								{coupon.applyToAllCheckouts && (
									<Chip variant="secondary" size="sm">
										Todos os checkouts
									</Chip>
								)}
								{hasReachedLimit && (
									<Chip variant="soft" color="warning" size="sm">
										Limite atingido
									</Chip>
								)}
								<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
									{statusParse.label}
								</Chip>
								<Chip variant="secondary" size="sm">
									{typeParse.icon}
									{formatDiscount(coupon)}
								</Chip>
							</div>
						);
					}}
					renderActions={(coupon) =>
						coupon.applyToAllCheckouts ? (
							<Tooltip>
								<Button isIconOnly variant="tertiary" size="sm" isDisabled>
									<Icon icon={Delete02Icon} className="icon-sm" />
									<Tooltip.Content>Este cupom se aplica automaticamente a todos os checkouts</Tooltip.Content>
								</Button>
							</Tooltip>
						) : (
							<Tooltip>
								<Button
									isIconOnly
									variant="tertiary"
									size="sm"
									className="text-danger"
									onPress={() => setRemovingCoupon(coupon)}
								>
									<Icon icon={Delete02Icon} className="icon-sm" />
									<Tooltip.Content>Remover</Tooltip.Content>
								</Button>
							</Tooltip>
						)
					}
						empty={null}
					/>
				)}
			</SectionAccordion>

			<AddCouponModal
				isOpen={isAddOpen}
				onOpenChange={setIsAddOpen}
				merchantId={merchantId}
				checkoutId={checkout.id}
				environment={checkout.environment}
				existingCouponIds={existingCouponIds}
				onSuccess={handleAddSuccess}
			/>

			<AlertDialog.Backdrop isOpen={!!removingCoupon} onOpenChange={(open) => !open && setRemovingCoupon(null)}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-md">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>Remover cupom</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Tem certeza que deseja remover o cupom <strong>{removingCoupon?.code}</strong> do checkout?
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								Cancelar
							</Button>
							<AsyncButton variant="danger" onPress={handleRemoveCoupon} isPending={isPending}>
								Remover
							</AsyncButton>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</div>
	);
}
