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
	CreditCardIcon,
	Location01Icon,
	Clock01Icon,
	Invoice02Icon,
} from '@hugeicons/core-free-icons';
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
		<div className="flex flex-col gap-6">
			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<DetailRow label="Subtotal" value={formatCurrency(order.subtotalAmount)} />
					<DetailRow label="Desconto" value={formatCurrency(order.discountAmount)} />
					<DetailRow label="Frete" value={formatCurrency(order.shippingAmount)} />
					<DetailRow
						label="Total"
						value={<span className="text-accent font-medium">{formatCurrency(order.totalAmount)}</span>}
					/>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={order.id} label="ID" />} mono />
					<DetailRow label="Criado em" value={formatDate(order.createdAt)} />
					{order.couponCode && <DetailRow label="Cupom usado" value={order.couponCode} mono />}
					{order.notes && (
						<div className="col-span-2">
							<DetailRow label="Observações" value={order.notes} />
						</div>
					)}
				</div>
			</div>

			{order.customer && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm" />} title="Cliente" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Nome" value={order.customer.name ?? '-'} />
						<DetailRow label="Email" value={<EmailLink email={order.customer.email} />} />
						<DetailRow label="Telefone" value={<PhoneLink phone={order.customer.phone} />} />
						<DetailRow label="Documento" value={<DocumentDisplay document={order.customer.document} />} />
					</div>
				</div>
			)}

			{order.shippingAddress && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={Location01Icon} className="icon-sm" />} title="Endereço de Entrega" />
					<div className="grid grid-cols-2 gap-4">
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
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={PackageIcon} className="icon-sm" />} title={`Itens (${order.items.length})`} />
					<div className="flex flex-col gap-3">
						{order.items.map((item, index) => (
							<div key={item.id ?? index} className="flex items-center gap-4 p-3 bg-background rounded-lg">
								{item.imageUrl && (
									<Image
										src={item.imageUrl}
										alt={item.productName ?? 'Produto'}
										width={48}
										height={48}
										className="w-12 h-12 rounded-lg object-cover bg-surface"
									/>
								)}
								<div className="flex-1 min-w-0">
									<span className="text-sm font-medium text-foreground block truncate">
										{item.productName ?? 'Produto'}
									</span>
									{item.variantName && (
										<span className="text-xs text-muted block truncate">Variante: {item.variantName}</span>
									)}
									{item.sku && (
										<span className="text-xs text-muted block font-mono">SKU: {item.sku}</span>
									)}
									<span className="text-xs text-muted block">
										{item.quantity}x {formatCurrency(item.unitPrice)}
									</span>
								</div>
								<div className="text-right shrink-0">
									<span className="text-sm font-medium text-foreground">{formatCurrency(item.totalPrice)}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{order.payment && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={CreditCardIcon} className="icon-sm" />} title="Pagamento" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="ID" value={<CopyableValue value={order.payment.id} label="ID" />} mono />
						<DetailRow
							label="Status"
							value={(() => {
								const paymentStatusParsed = paymentStatusParse[order.payment.status];
								return (
									<Chip variant="soft" color={mapParseColorToChipColor(paymentStatusParsed.color)} size="sm" className="gap-1">
										{paymentStatusParsed.icon}
										{paymentStatusParsed.label}
									</Chip>
								);
							})()}
						/>
						<DetailRow
							label="Método"
							value={(() => {
								const methodParsed = paymentMethodParse[order.payment.method];
								return (
									<Chip variant="soft" color={mapParseColorToChipColor(methodParsed.color)} size="sm" className="gap-1">
										{methodParsed.icon}
										{methodParsed.label}
									</Chip>
								);
							})()}
						/>
						<DetailRow label="Valor" value={formatCurrency(order.payment.amount)} />
						<DetailRow label="Taxa" value={typeof order.payment.fee === 'number' ? formatCurrency(order.payment.fee) : '-'} />
						<DetailRow
							label="Líquido"
							value={typeof order.payment.netAmount === 'number' ? <span className="text-success font-medium">{formatCurrency(order.payment.netAmount)}</span> : '-'}
						/>
					</div>
					{onViewTransaction && (
					<div className="mt-3 pt-3 border-t border-divider">
						<Button variant="secondary" size="sm" className="w-full" onPress={() => onViewTransaction(order.payment!.id)}>
							<Icon icon={CreditCardIcon} className="icon-sm" />
							Ver detalhes da transação
						</Button>
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
	payment: <Icon icon={CreditCardIcon} className="icon-sm" />,
	fulfillment: <Icon icon={PackageIcon} className="icon-sm" />,
	status: <Icon icon={InformationCircleIcon} className="icon-sm" />,
};

const timelineTypeColors: Record<TimelineEvent['type'], string> = {
	created: 'bg-accent text-accent-foreground',
	payment: 'bg-success text-success-foreground',
	fulfillment: 'bg-warning text-warning-foreground',
	status: 'bg-secondary text-secondary-foreground',
};

function OrderTimelineTab({ order }: { order: OrderDetails }) {
	const events: TimelineEvent[] = [];

	events.push({
		id: 'created',
		title: 'Pedido criado',
		description: `Pedido ${order.orderNumber} foi criado`,
		date: order.createdAt,
		type: 'created',
	});

	if (order.payment) {
		if (order.payment.completedAt) {
			events.push({
				id: 'payment-completed',
				title: 'Pagamento confirmado',
				description: `Pagamento via ${paymentMethodParse[order.payment.method].label} confirmado`,
				date: order.payment.completedAt,
				type: 'payment',
			});
		}

		if (order.payment.refundedAt) {
			events.push({
				id: 'payment-refunded',
				title: 'Pagamento estornado',
				description: 'O pagamento foi estornado',
				date: order.payment.refundedAt,
				type: 'payment',
			});
		}
	}

	if (order.updatedAt && order.updatedAt !== order.createdAt) {
		events.push({
			id: 'updated',
			title: 'Pedido atualizado',
			description: `Status: ${orderStatusParse[order.status].label}, Entrega: ${orderFulfillmentStatusParse[order.fulfillmentStatus].label}`,
			date: order.updatedAt,
			type: 'status',
		});
	}

	events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return (
		<div className="flex flex-col">
			{events.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Icon icon={Clock01Icon} className="icon-lg text-muted mb-2" />
					<p className="text-foreground/70">Nenhum evento registrado</p>
				</div>
			) : (
				<div className="relative pl-8">
					<div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />
					<div className="flex flex-col gap-6">
						{events.map((event, _index) => (
							<div key={event.id} className="relative flex gap-4">
								<div className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ${timelineTypeColors[event.type]}`}>
									{timelineTypeIcons[event.type]}
								</div>
								<div className="flex-1 bg-surface-secondary rounded-lg p-3">
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm font-medium text-foreground">{event.title}</p>
										<span className="text-xs text-muted shrink-0">{formatDate(event.date, true)}</span>
									</div>
									{event.description && (
										<p className="text-xs text-muted mt-1">{event.description}</p>
									)}
								</div>
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
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 pb-4 border-b border-divider">
				<div className="flex items-center justify-between">
					<div className="flex flex-col gap-1">
						<span className="text-lg font-mono font-medium text-accent">{order.orderNumber}</span>
						<span className="text-sm text-foreground/70">Número do pedido</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
						<span className="text-sm text-foreground/70 text-right">Total</span>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Status</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="md" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Entrega</span>
						<Chip variant="soft" color={mapParseColorToChipColor(fulfillmentParse.color)} size="md" className="gap-1">
							{fulfillmentParse.icon}
							{fulfillmentParse.label}
						</Chip>
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
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={ShoppingCartCheck01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Pedido</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do pedido</p>
					</Modal.Header>
					<Modal.Body>
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

