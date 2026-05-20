'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Button, Card, Chip, Skeleton } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { listMerchantPayments, getMerchantPayment } from '@/app/actions/merchant/payments';
import {
	CreditCardIcon,
	ShoppingBag02Icon,
	UserIcon,
	Wallet02Icon,
	ViewIcon,
	RefreshIcon,
	ArrowRight01Icon,
	InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { paymentStatusParse, mapParseColorToChipColor, orderStatusParse } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import type { CheckoutData } from '@/types/merchant/checkouts';
import type { MinimalPayment, PaymentDetails } from '@/types/merchant/payments';
import { PaymentStatus } from '@/types/enums';

interface CheckoutOperationsTabProps {
	checkout: CheckoutData;
	merchantId: string;
	isActive: boolean;
}

interface CheckoutCustomerSummary {
	id: string;
	name: string;
	email: string | null;
	document: string | null;
	transactionsCount: number;
	totalAmount: number;
	lastPurchaseAt: string | null;
}

function normalizeText(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

export function CheckoutOperationsTab({ checkout, merchantId, isActive }: CheckoutOperationsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [hasLoaded, setHasLoaded] = useState(false);
	const [payments, setPayments] = useState<MinimalPayment[]>([]);
	const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);

	const checkoutNameNormalized = normalizeText(checkout.name);

	const loadData = useCallback(() => {
		startTransition(async () => {
			const listResponse = await listMerchantPayments(merchantId, {
				environment: checkout.environment,
				search: checkout.name,
				page: 1,
				pageSize: 100,
			});

			const allPayments = listResponse?.data?.items ?? [];
			const checkoutPayments = allPayments.filter((item) => {
				if (!item.isCheckoutPayment) return false;
				return normalizeText(item.checkoutName) === checkoutNameNormalized;
			});

			setPayments(checkoutPayments);

			const detailResponses = await Promise.all(
				checkoutPayments.slice(0, 30).map(async (item) => {
					const response = await getMerchantPayment(merchantId, item.id);
					return response?.data ?? null;
				})
			);

			setPaymentDetails(detailResponses.filter((item): item is PaymentDetails => !!item));
			setHasLoaded(true);
		});
	}, [merchantId, checkout.environment, checkout.name, checkoutNameNormalized]);

	useEffect(() => {
		if (!isActive) return;
		if (hasLoaded) return;
		loadData();
	}, [isActive, hasLoaded, loadData]);

	const orders = useMemo(
		() =>
			paymentDetails
				.filter((item) => item.order)
				.map((item) => ({
					paymentId: item.id,
					paymentStatus: item.status,
					order: item.order!,
				}))
				.filter((item, index, list) => list.findIndex((x) => x.order.id === item.order.id) === index),
		[paymentDetails]
	);

	const customers = useMemo<CheckoutCustomerSummary[]>(() => {
		const grouped = new Map<string, CheckoutCustomerSummary>();

		for (const item of paymentDetails) {
			if (!item.customer) continue;
			const current = grouped.get(item.customer.id);
			if (current) {
				current.transactionsCount += 1;
				current.totalAmount += item.amount;
				if (!current.lastPurchaseAt || (item.createdAt && item.createdAt > current.lastPurchaseAt)) {
					current.lastPurchaseAt = item.createdAt;
				}
				continue;
			}

			grouped.set(item.customer.id, {
				id: item.customer.id,
				name: item.customer.name ?? 'Cliente sem nome',
				email: item.customer.email,
				document: item.customer.document,
				transactionsCount: 1,
				totalAmount: item.amount,
				lastPurchaseAt: item.createdAt,
			});
		}

		return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
	}, [paymentDetails]);

	const completedPaymentsCount = payments.filter((item) => item.status === PaymentStatus.Completed).length;
	const transactionsTotalAmount = payments.reduce((acc, item) => acc + item.amount, 0);
	const accessCount: number | null = null;
	const isLoading = isPending || (!hasLoaded && isActive);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<Skeleton key={index} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-56 rounded-xl" />
				<Skeleton className="h-56 rounded-xl" />
			</div>
		);
	}

	return (
			<div className="flex flex-col gap-4">
			<SectionHeader
				icon={<Icon icon={CreditCardIcon} className="icon-sm" />}
				title="Informações operacionais do checkout"
				description="Veja as transações, pedidos e clientes gerados por este checkout."
				action={
					<Button variant="secondary" onPress={loadData} isPending={isPending}>
						<Icon icon={RefreshIcon} className="icon-sm" />
						Atualizar
					</Button>
				}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				<Card>
					<Card.Content className="flex items-center justify-between py-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted">Pagamentos</span>
							<span className="text-2xl font-semibold">{completedPaymentsCount}</span>
							<span className="text-xs text-muted">confirmados</span>
						</div>
						<Icon icon={Wallet02Icon} className="icon-lg text-success" />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex items-center justify-between py-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted">Transações</span>
							<span className="text-2xl font-semibold">{payments.length}</span>
							<span className="text-xs text-muted">inclui pendentes e concluídas</span>
						</div>
						<Icon icon={CreditCardIcon} className="icon-lg text-accent" />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex items-center justify-between py-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted">Pedidos</span>
							<span className="text-2xl font-semibold">{orders.length}</span>
							<span className="text-xs text-muted">vinculados a transações</span>
						</div>
						<Icon icon={ShoppingBag02Icon} className="icon-lg text-success" />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex items-center justify-between py-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted">Clientes</span>
							<span className="text-2xl font-semibold">{customers.length}</span>
							<span className="text-xs text-muted">únicos nesse checkout</span>
						</div>
						<Icon icon={UserIcon} className="icon-lg text-secondary" />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex items-center justify-between py-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted">Acessos</span>
							<span className="text-2xl font-semibold">{accessCount === null ? '--' : accessCount}</span>
							<span className="text-xs text-muted">
								{accessCount === null ? 'sem telemetria consolidada' : 'visitas registradas'}
							</span>
						</div>
						<Icon icon={ViewIcon} className="icon-lg text-warning" />
					</Card.Content>
				</Card>
			</div>

			<Card>
				<Card.Content className="flex flex-col gap-3 py-4">
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-medium">Transações recentes</p>
						<span className="text-xs text-muted">Volume total: {formatCurrency(transactionsTotalAmount)}</span>
					</div>
					{payments.length === 0 ? (
						<div className="flex items-center gap-2 rounded-lg border border-divider p-3 text-sm text-muted">
							<Icon icon={InformationCircleIcon} className="icon-sm" />
							Nenhuma transação encontrada para este checkout ainda.
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{payments.slice(0, 10).map((item) => {
								const status = paymentStatusParse[item.status];
								return (
									<div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-divider px-3 py-2">
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className="truncate text-sm font-medium">{item.customer?.name ?? 'Cliente não informado'}</span>
											<span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
											<Chip variant="soft" size="sm" color={mapParseColorToChipColor(status.color)}>
												{status.label}
											</Chip>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</Card.Content>
			</Card>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<Card.Content className="flex flex-col gap-3 py-4">
						<p className="text-sm font-medium">Pedidos recentes</p>
						{orders.length === 0 ? (
							<div className="flex items-center gap-2 rounded-lg border border-divider p-3 text-sm text-muted">
								<Icon icon={InformationCircleIcon} className="icon-sm" />
								Nenhum pedido vinculado encontrado até agora.
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{orders.slice(0, 8).map((item) => {
									const orderStatus = orderStatusParse[item.order.status];
									return (
										<div key={item.order.id} className="flex items-center justify-between gap-2 rounded-lg border border-divider px-3 py-2">
											<div className="flex min-w-0 flex-col gap-0.5">
												<span className="truncate text-sm font-medium">{item.order.orderNumber ?? item.order.id}</span>
												<span className="text-xs text-muted">{formatDate(item.order.createdAt)}</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">{formatCurrency(item.order.totalAmount)}</span>
												<Chip variant="soft" size="sm" color={mapParseColorToChipColor(orderStatus.color)}>
													{orderStatus.label}
												</Chip>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</Card.Content>
				</Card>

				<Card>
					<Card.Content className="flex flex-col gap-3 py-4">
						<p className="text-sm font-medium">Clientes recorrentes</p>
						{customers.length === 0 ? (
							<div className="flex items-center gap-2 rounded-lg border border-divider p-3 text-sm text-muted">
								<Icon icon={InformationCircleIcon} className="icon-sm" />
								Nenhum cliente identificado nas vendas deste checkout.
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{customers.slice(0, 8).map((item) => (
									<div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-divider px-3 py-2">
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className="truncate text-sm font-medium">{item.name}</span>
											<span className="truncate text-xs text-muted">{item.email ?? item.document ?? 'Sem contato'}</span>
										</div>
										<div className="flex items-center gap-2 text-sm text-muted">
											<span>{item.transactionsCount}x</span>
											<Icon icon={ArrowRight01Icon} className="icon-xs" />
											<span className="font-medium text-foreground">{formatCurrency(item.totalAmount)}</span>
										</div>
									</div>
								))}
							</div>
						)}
					</Card.Content>
				</Card>
			</div>
		</div>
	);
}
