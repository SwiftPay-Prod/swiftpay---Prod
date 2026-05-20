'use client';

import { Suspense, use, useState, useTransition } from 'react';
import { Modal, Chip, Skeleton, Button, Accordion } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import Image from 'next/image';
import {
	ArrowExpand01Icon,
	CreditCardIcon,
	DollarCircleIcon,
	File01Icon,
	InformationCircleIcon,
	Link01Icon,
	ShoppingCart01Icon,
	SourceCodeSquareIcon,
	UserIcon,
	Wallet01Icon,
	SentIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HourglassIcon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { QRCodeSVG } from 'qrcode.react';
import {
	paymentStatusParse,
	paymentMethodParse,
	callbackStatusParse,
	orderStatusParse,
	orderFulfillmentStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate, formatDateOnly } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { EmailLink, DocumentDisplay, ExternalLink, PhoneLink } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { BoletoBarcodeImage } from '@/components/ui/boleto-barcode-image';
import { resendWebhook } from '@/app/actions/merchant/payments';
import { toast } from '@heroui/react';
import { PaymentRequestSource, PaymentStatus } from '@/types/enums';
import type { PaymentDetails } from '@/types/merchant/payments';
import type { ApiResponse } from '@/types/common';

type PaymentPromise = Promise<ApiResponse<PaymentDetails>>;

interface TransactionDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	paymentPromise: PaymentPromise | null;
	merchantId: string;
	onRefresh?: () => void;
}

interface DetailsContentProps {
	paymentPromise: PaymentPromise;
	onOpenQrModal?: (copyAndPaste: string) => void;
	onNavigateToOrder?: (orderId: string) => void;
	onResendWebhook?: (paymentId: string) => void;
	isResendingWebhook?: boolean;
}

function TransactionStatusTimeline({ payment }: { payment: PaymentDetails }) {
	const isFailed =
		payment.status === PaymentStatus.Failed ||
		payment.status === PaymentStatus.Cancelled ||
		payment.status === PaymentStatus.Expired;
	const isFinished =
		payment.status === PaymentStatus.Completed ||
		payment.status === PaymentStatus.Refunded ||
		payment.status === PaymentStatus.PartiallyRefunded ||
		isFailed;

	const processingDate =
		payment.status === PaymentStatus.Processing || payment.status === PaymentStatus.Confirming || isFinished
			? payment.completedAt ?? payment.createdAt
			: null;

	const finalLabel = payment.status === PaymentStatus.Refunded || payment.status === PaymentStatus.PartiallyRefunded
		? 'Reembolsada'
		: isFailed
		? 'Falhou'
		: 'Concluída';

	const finalDate = payment.refundedAt ?? payment.completedAt;

	const steps = [
		{
			label: 'Criada',
			date: payment.createdAt,
			completed: true,
			icon: <Icon icon={HourglassIcon} className="icon-sm" />,
		},
		{
			label: 'Processando',
			date: processingDate,
			completed: !!processingDate,
			icon: <Icon icon={ArrowRight01Icon} className="icon-sm" />,
		},
		{
			label: finalLabel,
			date: finalDate,
			completed: isFinished,
			icon: isFailed ? <Icon icon={CancelCircleIcon} className="icon-sm" /> : <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			isError: isFailed,
		},
	];

	function getStepStateClasses(step: { completed: boolean; isError?: boolean }) {
		if (step.completed) {
			if (step.isError) {
				return 'bg-danger text-danger-foreground';
			}

			return 'bg-success text-success-foreground';
		}

		return 'bg-content3 text-foreground/70';
	}

	return (
		<>
			<div className="hidden md:flex md:items-center md:justify-between md:gap-2">
				{steps.map((step, index) => (
					<div key={step.label} className="flex items-center gap-2 flex-1">
						<div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${getStepStateClasses(step)}`}>
							{step.icon}
						</div>
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-medium text-foreground">{step.label}</span>
							<span className="text-xs text-muted truncate">{step.date ? formatDate(step.date) : '-'}</span>
						</div>
						{index < steps.length - 1 && (
							<div className={`flex-1 h-0.5 ${step.completed ? 'bg-success' : 'bg-default-200'}`} />
						)}
					</div>
				))}
			</div>

			<div className="md:hidden relative flex flex-col gap-4">
				<div className="absolute left-4 top-0 bottom-0 w-px bg-content3" />
				{steps.map((step, index) => (
					<div key={`${step.label}-${index}`} className="relative flex items-start gap-3">
						<div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${getStepStateClasses(step)}`}>
							{step.icon}
						</div>
						<div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
							<span className="text-sm font-medium text-foreground">{step.label}</span>
							<span className="text-xs text-muted">{step.date ? formatDate(step.date) : '-'}</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
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

function DetailsContent({ paymentPromise, onOpenQrModal, onResendWebhook, isResendingWebhook }: DetailsContentProps) {
	const response = use(paymentPromise);
	const payment = response?.data;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-foreground/70">{response.error.message ?? 'Erro ao carregar transação'}</p>
			</div>
		);
	}

	if (!payment) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-foreground/70">Transação não encontrada</p>
			</div>
		);
	}

	const statusParse = paymentStatusParse[payment.status];
	const methodParse = paymentMethodParse[payment.method];
	const requestSourceData = payment.requestSource === PaymentRequestSource.PaymentLink
		? { label: 'Link de Pagamento', color: 'secondary' as const, icon: Link01Icon }
		: payment.requestSource === PaymentRequestSource.Checkout
		? { label: 'Checkout', color: 'accent' as const, icon: ShoppingCart01Icon }
		: { label: 'API', color: 'default' as const, icon: SourceCodeSquareIcon };
	const hasCheckoutInfo =
		payment.requestSource === PaymentRequestSource.Checkout ||
		payment.isCheckoutPayment ||
		!!payment.checkoutId ||
		!!payment.checkoutName;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-divider">
				<div className="flex flex-col gap-1">
					<span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(payment.amount)}</span>
					<span className="text-sm text-foreground/70">Valor da transação</span>
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
						<span className="text-xs text-foreground/60">Método</span>
						<Chip variant="soft" color={mapParseColorToChipColor(methodParse.color)} size="md" className="gap-1">
							{methodParse.icon}
							{methodParse.label}
						</Chip>
					</div>
				</div>
			</div>

			<div className="hidden md:block">
				<Accordion hideSeparator className="px-0">
					<Accordion.Item id="transaction-progress-desktop" defaultExpanded className="rounded-lg border border-divider bg-surface-secondary">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between p-4">
								<div className="flex items-center gap-2">
									<Icon icon={HourglassIcon} className="icon-sm" />
									<span className="text-sm font-medium text-foreground">Progresso</span>
								</div>
								<Accordion.Indicator className="text-muted" />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="p-4">
								<TransactionStatusTimeline payment={payment} />
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>

			<div className="md:hidden">
				<Accordion hideSeparator className="px-0">
					<Accordion.Item id="transaction-progress-mobile" className="rounded-lg border border-divider bg-surface-secondary">
						<Accordion.Heading>
							<Accordion.Trigger className="flex w-full items-center justify-between p-4">
								<div className="flex items-center gap-2">
									<Icon icon={HourglassIcon} className="icon-sm" />
									<span className="text-sm font-medium text-foreground">Progresso</span>
								</div>
								<Accordion.Indicator className="text-muted" />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="p-4">
								<TransactionStatusTimeline payment={payment} />
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="Valor bruto" value={formatCurrency(payment.amount)} />
					<DetailRow label="Taxa plataforma" value={formatCurrency(payment.fee)} />
					{payment.checkoutFeeAmount > 0 && (
						<DetailRow label="Taxa do Checkout" value={formatCurrency(payment.checkoutFeeAmount)} />
					)}
					{payment.reserveDeductedAmount > 0 && (
						<DetailRow
							label="Desconto de reserva financeira"
							value={<span className="font-medium text-warning">-{formatCurrency(payment.reserveDeductedAmount)}</span>}
						/>
					)}
					<DetailRow
						label="Valor Líquido"
						value={<span className="text-success font-medium">{formatCurrency(payment.netAmount)}</span>}
					/>
				</div>
			</div>

			{hasCheckoutInfo && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={ShoppingCart01Icon} className="icon-sm" />} title="Informações do Checkout" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow
							label="Origem"
							value={
								<Chip variant="soft" color={mapParseColorToChipColor(requestSourceData.color)} size="sm" className="gap-1">
									<Icon icon={requestSourceData.icon} className="icon-xs" />
									{requestSourceData.label}
								</Chip>
							}
						/>
						<DetailRow label="Nome do Checkout" value={payment.checkoutName ?? '-'} />
						<DetailRow
							label="ID do Checkout"
							value={payment.checkoutId ? <CopyableValue value={payment.checkoutId} label="ID do Checkout" /> : '-'}
							mono
						/>
					</div>
				</div>
			)}

			{payment.order && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={ShoppingCart01Icon} className="icon-sm" />} title="Pedido" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow
							label="Número do Pedido"
							value={<CopyableValue value={payment.order.orderNumber} label="Número do Pedido" />}
							mono
						/>
						<DetailRow label="Valor Total" value={formatCurrency(payment.order.totalAmount)} />
						<DetailRow
							label="Status"
							value={
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(orderStatusParse[payment.order.status].color)}
									size="sm"
									className="gap-1"
								>
									{orderStatusParse[payment.order.status].icon}
									{orderStatusParse[payment.order.status].label}
								</Chip>
							}
						/>
						<DetailRow
							label="Entrega"
							value={
								<Chip
									variant="soft"
									color={mapParseColorToChipColor(orderFulfillmentStatusParse[payment.order.fulfillmentStatus].color)}
									size="sm"
									className="gap-1"
								>
									{orderFulfillmentStatusParse[payment.order.fulfillmentStatus].icon}
									{orderFulfillmentStatusParse[payment.order.fulfillmentStatus].label}
								</Chip>
							}
						/>
						<DetailRow label="Criado em" value={formatDate(payment.order.createdAt)} />
					</div>

					{payment.order.items.length > 0 && (
						<div className="mt-4">
							<span className="text-sm font-medium text-foreground/70">Itens do Pedido</span>
							<div className="mt-2 flex flex-col gap-2">
								{payment.order.items.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 p-3 bg-background rounded-lg border border-divider"
									>
										{item.imageUrl && (
											<Image
												src={item.imageUrl}
												alt={item.productName}
												width={48}
												height={48}
												className="size-12 rounded-md object-cover bg-surface"
											/>
										)}
										<div className="flex flex-col flex-1 min-w-0">
											<span className="text-sm font-medium text-foreground truncate">{item.productName}</span>
											{item.variantName && (
												<span className="text-xs text-foreground/60 truncate">{item.variantName}</span>
											)}
										</div>
										<div className="flex flex-col items-end shrink-0">
											<span className="text-sm font-medium text-foreground">{formatCurrency(item.totalPrice)}</span>
											<span className="text-xs text-foreground/60">
												{item.quantity}x {formatCurrency(item.unitPrice)}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={payment.id} label="ID" />} mono />
					<DetailRow label="ID Externo" value={payment.externalId ?? '-'} mono />
					<div className="col-span-2">
						<DetailRow
							label="Link de visualização"
							value={
								<ExternalLink
									url={payment.transactionVisualizationUrl}
									fallback="Não configurado"
								/>
							}
							mono
						/>
					</div>
					<DetailRow label="Descrição" value={payment.description ?? '-'} />
					<DetailRow label="Criado em" value={formatDate(payment.createdAt)} />
					<DetailRow label="Concluído em" value={formatDate(payment.completedAt)} />
					<DetailRow label="Expira em" value={formatDate(payment.expiresAt)} />
					{payment.refundedAt && <DetailRow label="Reembolsado em" value={formatDate(payment.refundedAt)} />}
					{payment.failureReason && (
						<div className="col-span-2">
							<DetailRow label="Motivo da Falha" value={payment.failureReason} />
						</div>
					)}
				</div>
			</div>

			{payment.customer && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm" />} title="Cliente" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Nome" value={payment.customer.name ?? '-'} />
						<DetailRow label="Email" value={<EmailLink email={payment.customer.email} />} />
						<DetailRow label="Telefone" value={<PhoneLink phone={payment.customer.phone} />} />
						<DetailRow label="Documento" value={<DocumentDisplay document={payment.customer.document} />} />
					</div>
				</div>
			)}

			{payment.pix && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={Wallet01Icon} className="icon-sm" />} title="Dados PIX" />
					{payment.pix.copyAndPaste && payment.status === 'Pending' && (
						<div className="flex flex-col items-center gap-4 mb-6 p-6 bg-white rounded-xl border border-divider shadow-sm">
							<QRCodeSVG value={payment.pix.copyAndPaste} size={180} level="M" marginSize={2} className="rounded-lg" />
							<div className="flex flex-col items-center gap-1">
								<span className="text-sm font-medium text-black/80">Escaneie o QR Code</span>
								<span className="text-xs text-black/50">ou use o código Pix Copia e Cola abaixo</span>
							</div>
							<Button variant="secondary" className="gap-2" onPress={() => onOpenQrModal?.(payment.pix!.copyAndPaste!)}>
								<Icon icon={ArrowExpand01Icon} className="icon-sm" />
								Ver QR Code em tela cheia
							</Button>
						</div>
					)}
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="TxId" value={<CopyableValue value={payment.pix.txId} label="TxId" />} mono />
						<DetailRow
							label="EndToEndId"
							value={<CopyableValue value={payment.pix.endToEndId} label="EndToEndId" />}
							mono
						/>
						<DetailRow label="Nome do Pagador" value={payment.pix.payerName ?? '-'} />
						<DetailRow label="Documento do Pagador" value={<DocumentDisplay document={payment.pix.payerDocument} />} />
						<DetailRow label="Banco do Pagador" value={payment.pix.payerBank ?? '-'} />
						<DetailRow label="Pago em" value={formatDate(payment.pix.paidAt)} />
						{payment.pix.expiresAt && <DetailRow label="Expira em" value={formatDate(payment.pix.expiresAt)} />}
					</div>
					{payment.pix.copyAndPaste && (
						<div className="mt-4">
							<DetailRow
								label="Copia e Cola"
								value={<CopyableValue value={payment.pix.copyAndPaste} label="PIX Copia e Cola" />}
								mono
							/>
						</div>
					)}
				</div>
			)}

			{payment.boleto && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={File01Icon} className="icon-sm" />} title="Dados do Boleto" />
					<BoletoBarcodeImage
						barcode={payment.boleto.barcode}
						digitableLine={payment.boleto.digitableLine}
						className="mb-4"
					/>
					<div className="grid grid-cols-2 gap-4">
						<DetailRow
							label="Código de Barras"
							value={<CopyableValue value={payment.boleto.barcode} label="Código de Barras" />}
							mono
						/>
						<DetailRow
							label="Linha Digitável"
							value={<CopyableValue value={payment.boleto.digitableLine} label="Linha Digitável" />}
							mono
						/>
						<DetailRow label="Vencimento" value={formatDateOnly(payment.boleto.dueDate)} />
					</div>
				</div>
			)}

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Link01Icon} className="icon-sm" />} title="Callback/Webhook" />
				{(() => {
					const callbackParse = callbackStatusParse[payment.callbackStatus];
					return (
						<div className="grid grid-cols-2 gap-4">
							<DetailRow
								label="Status"
								value={
									<Chip
										variant="soft"
										color={mapParseColorToChipColor(callbackParse.color)}
										size="sm"
										className="gap-1"
									>
										{callbackParse.icon}
										{callbackParse.label}
									</Chip>
								}
							/>
							<DetailRow label="Tentativas" value={String(payment.callbackAttempts)} />
							<div className="col-span-2">
								<DetailRow label="URL" value={<ExternalLink url={payment.callbackUrl} fallback="Não configurado" />} />
							</div>
							{payment.callbackLastAttemptAt && (
								<DetailRow label="Última Tentativa" value={formatDate(payment.callbackLastAttemptAt)} />
							)}
							{payment.callbackError && (
								<div className="col-span-2">
									<DetailRow label="Erro" value={payment.callbackError} />
								</div>
							)}
							{payment.status === PaymentStatus.Completed && payment.callbackUrl && (
								<div className="col-span-2 pt-2 border-t border-divider">
									<Button
										variant="secondary"
										size="sm"
										className="gap-2"
										isPending={isResendingWebhook}
										onPress={() => onResendWebhook?.(payment.id)}
									>
										<Icon icon={SentIcon} className="icon-sm" />
										Reenviar Webhook
									</Button>
								</div>
							)}
						</div>
					);
				})()}
			</div>

			{payment.metadata && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Metadata" />
					<pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-auto max-h-40">
						{JSON.stringify(JSON.parse(payment.metadata), null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

function QrCodeModal({
	isOpen,
	onOpenChange,
	copyAndPaste,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	copyAndPaste: string;
}) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>QR Code PIX</Modal.Heading>
						<p className="text-sm text-muted">Escaneie o código ou use o PIX Copia e Cola</p>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col items-center gap-6">
							<div className="p-6 bg-white rounded-xl border border-divider shadow-sm">
								<QRCodeSVG value={copyAndPaste} size={280} level="M" marginSize={2} className="rounded-lg" />
							</div>
							<div className="w-full">
								<CopyableValue value={copyAndPaste} label="PIX Copia e Cola" />
							</div>
						</div>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

export function MerchantTransactionDetailsModal({ isOpen, onOpenChange, paymentPromise, merchantId, onRefresh }: TransactionDetailsModalProps) {
	const [isQrModalOpen, setIsQrModalOpen] = useState(false);
	const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
	const [isResendingWebhook, startResendWebhook] = useTransition();

	function handleOpenQrModal(copyAndPaste: string) {
		setQrCodeValue(copyAndPaste);
		setIsQrModalOpen(true);
	}

	function handleResendWebhook(paymentId: string) {
		startResendWebhook(async () => {
			const response = await resendWebhook(merchantId, paymentId);

			if (response?.error) {
				toast('Erro ao reenviar webhook', {
					description: response.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Webhook reenviado', {
				description: response?.message ?? 'O webhook foi enviado para a fila de processamento.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			onRefresh?.();
		});
	}

	return (
		<>
			<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-3xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={CreditCardIcon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Detalhes da Transação</Modal.Heading>
							<p className="text-sm text-muted">Informações completas da transação</p>
						</Modal.Header>
						<Modal.Body>
							{paymentPromise && (
								<Suspense fallback={<DetailsContentSkeleton />}>
									<DetailsContent
										paymentPromise={paymentPromise}
										onOpenQrModal={handleOpenQrModal}

										onResendWebhook={handleResendWebhook}
										isResendingWebhook={isResendingWebhook}
									/>
								</Suspense>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			{qrCodeValue && <QrCodeModal isOpen={isQrModalOpen} onOpenChange={setIsQrModalOpen} copyAndPaste={qrCodeValue} />}
		</>
	);
}

