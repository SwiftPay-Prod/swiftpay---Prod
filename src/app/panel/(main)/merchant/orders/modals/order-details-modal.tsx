'use client';

import { Suspense, use, useState } from 'react';
import Image from 'next/image';
import { Modal, Chip, Skeleton, Button, Tabs } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	DollarCircleIcon,
	InformationCircleIcon,
	PackageIcon,
	UserIcon,
	ShoppingCartCheck01Icon,
	QrCodeIcon,
	Location01Icon,
	Clock01Icon,
	Invoice02Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	orderStatusParse,
	orderFulfillmentStatusParse,
	paymentStatusParse,
	paymentMethodParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { EmailLink, DocumentDisplay, PhoneLink } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import type { OrderDetails } from '@/types/merchant/orders';
import type { ApiResponse } from '@/types/common';

type OrderPromise = Promise<ApiResponse<OrderDetails>>;

interface OrderDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	orderPromise: OrderPromise | null;
	onViewTransaction?: (paymentId: string) => void;
}

interface DetailsContentProps {
	orderPromise: OrderPromise;
	onViewTransaction?: (paymentId: string) => void;
}

function DetailsContentSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-4">
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-lg" />
				))}
			</div>
		</div>
	);
}

function OrderDetailsTab({ order, onViewTransaction }: { order: OrderDetails; onViewTransaction?: (paymentId: string) => void }) {
	return (
		<div className="flex flex-col gap-4 text-white">
			<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm text-success" />} title="Valores" />
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
					<DetailRow label="Subtotal" value={<span className="font-mono text-white tabular-nums">{formatCurrency(order.subtotalAmount)}</span>} />
					<DetailRow label="Desconto" value={<span className="font-mono text-white/70 tabular-nums">{formatCurrency(order.discountAmount)}</span>} />
					<DetailRow label="Frete" value={<span className="font-mono text-white/70 tabular-nums">{formatCurrency(order.shippingAmount)}</span>} />
					<DetailRow
						label="Total PIX"
						value={<span className="text-success font-bold font-mono text-base tabular-nums">{formatCurrency(order.totalAmount)}</span>}
					/>
				</div>
			</div>

			<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm text-link" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4 mt-2">
					<DetailRow label="ID do Pedido" value={<CopyableValue value={order.id} label="ID" />} mono />
					<DetailRow label="Criado em" value={<span className="font-mono text-white/70">{formatDate(order.createdAt)}</span>} />
					{order.couponCode && <DetailRow label="Cupom usado" value={order.couponCode} mono />}
					{order.notes && (
						<div className="col-span-2">
							<DetailRow label="Observações" value={order.notes} />
						</div>
					)}
				</div>
			</div>

			{order.customer && (
				<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
					<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm text-link" />} title="Cliente" />
					<div className="grid grid-cols-2 gap-4 mt-2">
						<DetailRow label="Nome" value={<span className="font-bold text-white">{order.customer.name ?? '-'}</span>} />
						<DetailRow label="Email" value={<EmailLink email={order.customer.email} />} />
						<DetailRow label="Telefone" value={<PhoneLink phone={order.customer.phone} />} />
						<DetailRow label="Documento" value={<DocumentDisplay document={order.customer.document} />} />
					</div>
				</div>
			)}

			{order.shippingAddress && (
				<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
					<SectionTitle icon={<Icon icon={Location01Icon} className="icon-sm text-link" />} title="Endereço de Entrega" />
					<div className="grid grid-cols-2 gap-4 mt-2">
						<DetailRow label="Rua" value={`${order.shippingAddress.street}, ${order.shippingAddress.number}`} />
						{order.shippingAddress.complement && (
							<DetailRow label="Complemento" value={order.shippingAddress.complement} />
						)}
						<DetailRow label="Bairro" value={order.shippingAddress.neighborhood ?? '-'} />
						<DetailRow label="Cidade" value={order.shippingAddress.city ?? '-'} />
						<DetailRow label="Estado" value={order.shippingAddress.state ?? '-'} />
						<DetailRow label="CEP" value={order.shippingAddress.zipCode ?? '-'} />
					</div>
				</div>
			)}

			{order.items && order.items.length > 0 && (
				<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
					<SectionTitle icon={<Icon icon={PackageIcon} className="icon-sm text-link" />} title={`Itens (${order.items.length})`} />
					<div className="flex flex-col gap-3 mt-2">
						{order.items.map((item, index) => (
							<div key={item.id ?? index} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/8">
								{item.imageUrl && (
									<div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
										<Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="font-bold text-sm text-white truncate">{item.productName}</p>
									<p className="text-xs font-mono text-white/50">
										{item.quantity}x {formatCurrency(item.unitPrice)}
									</p>
								</div>
								<span className="font-mono font-bold text-sm text-white tabular-nums">
									{formatCurrency(item.totalPrice)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{order.payment && (
				<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
					<SectionTitle icon={<Icon icon={QrCodeIcon} className="icon-sm text-success" />} title="Pagamento PIX" />
					<div className="grid grid-cols-2 gap-4 mt-2">
						<DetailRow label="ID da Transação" value={<CopyableValue value={order.payment.id} label="ID" />} mono />
						<DetailRow
							label="Status"
							value={<RevolutStatusBadge status={order.payment.status} />}
						/>
						<DetailRow
							label="Método"
							value={
								<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-400">
									<Icon icon={QrCodeIcon} className="icon-xs" />
									PIX Instantâneo
								</span>
							}
						/>
						<DetailRow label="Valor Bruto" value={<span className="font-mono font-bold text-white">{formatCurrency(order.payment.amount)}</span>} />
						<DetailRow label="Taxa Gateway" value={<span className="font-mono text-danger">{typeof order.payment.fee === 'number' ? formatCurrency(order.payment.fee) : '-'}</span>} />
						<DetailRow
							label="Valor Líquido"
							value={typeof order.payment.netAmount === 'number' ? <span className="text-success font-mono font-bold">{formatCurrency(order.payment.netAmount)}</span> : '-'}
						/>
					</div>
					{onViewTransaction && (
						<div className="mt-4 pt-3 border-t border-white/8">
							<button
								type="button"
								className="button-outline-dark cursor-pointer text-xs w-full py-2"
								onClick={() => onViewTransaction(order.payment!.id)}
							>
								<Icon icon={Wallet01Icon} className="icon-xs" />
								<span>Ver detalhes da transação</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface TimelineEvent {
	id: string;
	title: string;
	description?: string;
	date: string;
	type: 'created' | 'payment' | 'fulfillment' | 'status';
}

const timelineTypeIcons: Record<TimelineEvent['type'], React.ReactNode> = {
	created: <Icon icon={ShoppingCartCheck01Icon} className="icon-sm" />,
	payment: <Icon icon={QrCodeIcon} className="icon-sm" />,
	fulfillment: <Icon icon={PackageIcon} className="icon-sm" />,
	status: <Icon icon={InformationCircleIcon} className="icon-sm" />,
};

const timelineTypeColors: Record<TimelineEvent['type'], string> = {
	created: 'bg-brand/15 text-link border border-brand/30',
	payment: 'bg-success/15 text-success border border-success/30',
	fulfillment: 'bg-warning/15 text-warning border border-warning/30',
	status: 'bg-white/5 text-white/70 border border-white/10',
};

function OrderTimelineTab({ order }: { order: OrderDetails }) {
	const events: TimelineEvent[] = [];

	events.push({
		id: 'created',
		title: 'Pedido criado',
		description: `Pedido ${order.orderNumber} foi registrado`,
		date: order.createdAt,
		type: 'created',
	});

	if (order.payment) {
		if (order.payment.completedAt) {
			events.push({
				id: 'payment-completed',
				title: 'Pagamento PIX confirmado',
				description: 'Liquidação instantânea confirmada pelo Banco Central / SPI',
				date: order.payment.completedAt,
				type: 'payment',
			});
		}

		if (order.payment.refundedAt) {
			events.push({
				id: 'payment-refunded',
				title: 'Pagamento estornado',
				description: 'O pagamento PIX foi estornado',
				date: order.payment.refundedAt,
				type: 'status',
			});
		}
	}


	return (
		<div className="flex flex-col text-white">
			{events.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-white/40">
					<Icon icon={Clock01Icon} className="icon-lg mb-2" />
					<p className="text-xs">Nenhum evento registrado</p>
				</div>
			) : (
				<div className="relative pl-8">
					<div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
					<div className="flex flex-col gap-6">
						{events.map((event) => (
							<div key={event.id} className="relative flex flex-col gap-1">
								<div
									className={`absolute -left-8 top-0 flex size-6 items-center justify-center rounded-full ${timelineTypeColors[event.type]}`}
								>
									{timelineTypeIcons[event.type]}
								</div>
								<div className="flex items-center justify-between">
									<span className="font-bold text-sm text-white">{event.title}</span>
									<span className="text-xs font-mono text-white/40">{formatDate(event.date)}</span>
								</div>
								{event.description && <p className="text-xs text-white/60">{event.description}</p>}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function DetailsContent({ orderPromise, onViewTransaction }: DetailsContentProps) {
	const response = use(orderPromise);
	const order = response?.data;
	const [selectedTab, setSelectedTab] = useState<string>('details');

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-foreground/70">{response.error.message ?? 'Erro ao carregar pedido'}</p>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-foreground/70">Pedido não encontrado</p>
			</div>
		);
	}

	const statusParse = orderStatusParse[order.status];
	const fulfillmentParse = orderFulfillmentStatusParse[order.fulfillmentStatus];
	const tabItems: InternalTabItem[] = [
		{ id: 'details', label: 'Detalhes', icon: <Icon icon={Invoice02Icon} className="icon-sm" /> },
		{ id: 'timeline', label: 'Timeline', icon: <Icon icon={Clock01Icon} className="icon-sm" /> },
	];

	return (
		<div className="flex flex-col gap-4 text-white">
			<div className="flex flex-col gap-4 pb-4 border-b border-white/8">
				<div className="flex items-center justify-between">
					<div className="flex flex-col gap-0.5">
						<span className="text-base font-mono font-bold text-link">{order.orderNumber}</span>
						<span className="text-xs text-white/50">Número do pedido</span>
					</div>
					<div className="flex flex-col gap-0.5 items-end">
						<span className="text-2xl font-extrabold font-mono text-success tabular-nums">{formatCurrency(order.totalAmount)}</span>
						<span className="text-xs text-white/50">Total PIX</span>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<span className="text-xs text-white/50">Status:</span>
						<RevolutStatusBadge status={order.status} label={statusParse.label} />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-white/50">Entrega:</span>
						<RevolutStatusBadge status={order.fulfillmentStatus} label={fulfillmentParse.label} />
					</div>
				</div>
			</div>

			<InternalTabs
				ariaLabel="Abas do pedido"
				items={tabItems}
				selectedKey={selectedTab}
				onSelectionChange={(key) => setSelectedTab(key as string)}
			>
				<Tabs.Panel id="details" className="p-0">
					<OrderDetailsTab order={order} onViewTransaction={onViewTransaction} />
				</Tabs.Panel>
				<Tabs.Panel id="timeline" className="p-0">
					<OrderTimelineTab order={order} />
				</Tabs.Panel>
			</InternalTabs>
		</div>
	);
}

export function OrderDetailsModal({
	isOpen,
	onOpenChange,
	orderPromise,
	onViewTransaction,
}: OrderDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl rounded-[28px] border border-white/12 bg-card p-6 text-white">
					<Modal.CloseTrigger className="text-white/40 hover:text-white" />
					<Modal.Header className="pb-4 border-b border-white/8">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-link border border-brand/30">
								<Icon icon={ShoppingCartCheck01Icon} className="icon-md" />
							</div>
							<div>
								<Modal.Heading className="text-base font-bold text-white">Detalhes do Pedido</Modal.Heading>
								<p className="text-xs text-white/50">Auditoria completa do checkout e entrega</p>
							</div>
						</div>
					</Modal.Header>
					<Modal.Body className="py-4">
						{orderPromise && (
							<Suspense fallback={<DetailsContentSkeleton />}>
								<DetailsContent orderPromise={orderPromise} onViewTransaction={onViewTransaction} />
							</Suspense>
						)}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
