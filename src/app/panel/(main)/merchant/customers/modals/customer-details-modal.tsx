'use client';

import { Suspense, use, useState } from 'react';
import { Modal, Chip, Skeleton, Button, Tabs } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { InternalTabs } from '@/components/ui/internal-tabs';
import {
	InformationCircleIcon,
	Mail01Icon,
	MapPinIcon,
	Task01Icon,
	UserCircleIcon,
	File01Icon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import type { CustomerData } from '@/types/merchant/customers';
import type { ApiResponse, Paginated } from '@/types/common';
import type { MinimalPayment } from '@/types/merchant/payments';
import { customerStatusParse, customerDocumentTypeParse, mapParseColorToChipColor, paymentMethodParse, paymentStatusParse } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { EmailLink, PhoneLink, DocumentDisplay } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { getMerchantPayment } from '@/app/actions/merchant/payments';
import { MerchantTransactionDetailsModal } from '@/app/panel/(main)/merchant/transactions/modals/merchant-transaction-details-modal';
import type { PaymentDetails } from '@/types/merchant/payments';

type CustomerPromise = Promise<ApiResponse<CustomerData>>;
type PaymentsPromise = Promise<ApiResponse<Paginated<MinimalPayment>>>;
type PaymentPromise = Promise<ApiResponse<PaymentDetails>>;

interface CustomerDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	merchantId: string;
	customerId: string | null;
	customerPromise: CustomerPromise | null;
	paymentsPromise: PaymentsPromise | null;
	onPaymentsPageChange: (page: number) => void;
}

function ContentSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-lg" />
				))}
			</div>
		</div>
	);
}

function DetailsContent({ customerPromise }: { customerPromise: CustomerPromise }) {
	const response = use(customerPromise);
	const customer = response?.data;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-foreground/70">{response.error.message}</p>
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-foreground/70">Cliente não encontrado</p>
			</div>
		);
	}

	const statusParsed = customerStatusParse[customer.status];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-border">
				<div className="flex flex-col gap-1">
					<span className="text-xl font-bold text-foreground">{customer.name}</span>
					<span className="text-sm text-foreground/70">Cliente cadastrado na plataforma</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Status</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="md" className="gap-1">
							{statusParsed.icon}
							{statusParsed.label}
						</Chip>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<div className="flex flex-col gap-4">
					<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="ID" value={<CopyableValue value={customer.id} label="ID" />} mono />
						{customer.externalId && (
							<DetailRow label="ID Externo" value={<CopyableValue value={customer.externalId} label="ID Externo" />} mono />
						)}
						<DetailRow label="Criado em" value={formatDate(customer.createdAt)} />
						<DetailRow label="Atualizado em" value={formatDate(customer.updatedAt)} />
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<div className="flex flex-col gap-4">
					<SectionTitle icon={<Icon icon={Mail01Icon} className="icon-sm" />} title="Contato" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Email" value={<EmailLink email={customer.email} className="text-sm" />} />
						<DetailRow label="Telefone" value={<PhoneLink phone={customer.phone} className="text-sm" />} />
					</div>
				</div>
			</div>

			{customer.document && customer.documentType && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<div className="flex flex-col gap-4">
						<SectionTitle icon={<Icon icon={File01Icon} className="icon-sm" />} title="Documento" />
						<div className="grid grid-cols-2 gap-4">
							<DetailRow
								label="Tipo"
								value={
									<Chip variant="soft" color="default" size="sm" className="gap-1">
										{customerDocumentTypeParse[customer.documentType].icon}
										{customerDocumentTypeParse[customer.documentType].label}
									</Chip>
								}
							/>
							<DetailRow label="Número" value={<DocumentDisplay document={customer.document} className="text-sm" />} />
						</div>
					</div>
				</div>
			)}

			{customer.address && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<div className="flex flex-col gap-4">
						<SectionTitle icon={<Icon icon={MapPinIcon} className="icon-sm" />} title="Endereço" />
						<div className="grid grid-cols-2 gap-4">
							{customer.address.street && <DetailRow label="Rua" value={customer.address.street} />}
							{customer.address.number && <DetailRow label="Número" value={customer.address.number} />}
							{customer.address.complement && <DetailRow label="Complemento" value={customer.address.complement} />}
							{customer.address.neighborhood && <DetailRow label="Bairro" value={customer.address.neighborhood} />}
							{customer.address.city && <DetailRow label="Cidade" value={customer.address.city} />}
							{customer.address.state && <DetailRow label="Estado" value={customer.address.state} />}
							{customer.address.postalCode && <DetailRow label="CEP" value={customer.address.postalCode} />}
							{customer.address.country && <DetailRow label="País" value={customer.address.country} />}
						</div>
					</div>
				</div>
			)}

			{customer.metadata && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<div className="flex flex-col gap-4">
						<SectionTitle icon={<Icon icon={Task01Icon} className="icon-sm" />} title="Metadados" />
						<pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-auto max-h-40">
							{customer.metadata}
						</pre>
					</div>
				</div>
			)}
		</div>
	);
}

function PaymentsContent({
	paymentsPromise,
	onPaymentsPageChange,
	onViewPayment,
}: {
	paymentsPromise: PaymentsPromise;
	onPaymentsPageChange: (page: number) => void;
	onViewPayment: (paymentId: string) => void;
}) {
	const response = use(paymentsPromise);
	const payments = response?.data ?? {
		items: [],
		totalItems: 0,
		page: 1,
		pageSize: 10,
		totalPages: 0,
	};
	const canGoBack = payments.page > 1;
	const canGoNext = payments.page < payments.totalPages;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-8 gap-3">
				<Icon icon={InformationCircleIcon} className="icon-md text-danger" />
				<p className="text-foreground/70">{response.error.message}</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg bg-surface-secondary p-4 mt-6">
			<div className="flex flex-col gap-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Cobranças" />
				<div className="flex flex-col gap-3">
				{payments.items.length === 0 ? (
					<div className="py-6 text-center text-sm text-muted">Nenhuma cobrança encontrada</div>
				) : (
					payments.items.map((payment) => {
						const method = paymentMethodParse[payment.method];
						const statusParsed = paymentStatusParse[payment.status];
						return (
							<div
								key={payment.id}
								className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4"
							>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex flex-col gap-1">
										<span className="text-sm text-muted">ID da cobrança</span>
										<span className="text-sm font-medium text-foreground break-all">{payment.id}</span>
									</div>
									<Button variant="tertiary" onPress={() => onViewPayment(payment.id)}>
										<Icon icon={ViewIcon} className="icon-sm" />
										Ver detalhes
									</Button>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
									<div className="flex flex-col gap-1">
										<span className="text-xs text-muted">Método</span>
										<span className="flex items-center gap-2 text-sm font-medium">
											{method.icon}
											{method.label}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-xs text-muted">Valor</span>
										<span className="text-sm font-medium">{formatCurrency(payment.amount)}</span>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-xs text-muted">Status</span>
										<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
											{statusParsed.icon}
											{statusParsed.label}
										</Chip>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-xs text-muted">Criado em</span>
										<span className="text-sm text-muted">{formatDate(payment.createdAt)}</span>
									</div>
								</div>
							</div>
						);
					})
				)}
				</div>
				{payments.totalPages > 1 && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span className="text-xs text-muted">
							Pagina {payments.page} de {payments.totalPages}
						</span>
						<div className="flex gap-2">
							<Button variant="tertiary" onPress={() => onPaymentsPageChange(payments.page - 1)} isDisabled={!canGoBack}>
								Anterior
							</Button>
							<Button variant="tertiary" onPress={() => onPaymentsPageChange(payments.page + 1)} isDisabled={!canGoNext}>
								Próxima
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export function CustomerDetailsModal({
	isOpen,
	onOpenChange,
	merchantId,
	customerId,
	customerPromise,
	paymentsPromise,
	onPaymentsPageChange,
}: CustomerDetailsModalProps) {
	const [selectedTab, setSelectedTab] = useState('informacoes');
	const [transactionPromise, setTransactionPromise] = useState<PaymentPromise | null>(null);
	const [isTransactionOpen, setIsTransactionOpen] = useState(false);

	function handleClose() {
		onOpenChange(false);
	}

	function handleOpenTransaction(paymentId: string) {
		setTransactionPromise(getMerchantPayment(merchantId, paymentId));
		setIsTransactionOpen(true);
	}

	function handleCloseTransaction(isOpen: boolean) {
		setIsTransactionOpen(isOpen);
		if (!isOpen) {
			setTransactionPromise(null);
		}
	}

	return (
		<>
			<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-2xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={UserCircleIcon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Detalhes do Cliente</Modal.Heading>
							<p className="text-sm text-muted">Informações completas do cliente</p>
						</Modal.Header>
						<Modal.Body>
							<InternalTabs
								ariaLabel="Detalhes do cliente"
								items={[
									{ id: 'informacoes', label: 'Informações' },
									{ id: 'pagamentos', label: 'Cobranças' },
								]}
								selectedKey={selectedTab}
								onSelectionChange={(key) => setSelectedTab(key as string)}
							>
								<Tabs.Panel id="informacoes" className="p-0">
									{customerPromise && (
										<Suspense fallback={<ContentSkeleton />}>
											<DetailsContent customerPromise={customerPromise} />
										</Suspense>
									)}
								</Tabs.Panel>
								<Tabs.Panel id="pagamentos" className="p-0">
									{merchantId && customerId && paymentsPromise && (
										<Suspense fallback={<ContentSkeleton />}>
											<PaymentsContent
												paymentsPromise={paymentsPromise}
												onPaymentsPageChange={onPaymentsPageChange}
												onViewPayment={handleOpenTransaction}
											/>
										</Suspense>
									)}
								</Tabs.Panel>
							</InternalTabs>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			<MerchantTransactionDetailsModal
				isOpen={isTransactionOpen}
				onOpenChange={handleCloseTransaction}
				paymentPromise={transactionPromise}
				merchantId={merchantId}
			/>
		</>
	);
}

