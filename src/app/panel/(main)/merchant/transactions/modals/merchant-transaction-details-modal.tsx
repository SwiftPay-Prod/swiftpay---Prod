'use client';

import { Suspense, use, useState, useTransition } from 'react';
import { Modal, Skeleton, Button, Accordion } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import Image from 'next/image';
import {
	ArrowExpand01Icon,
	DollarCircleIcon,
	InformationCircleIcon,
	Link01Icon,
	ShoppingCart01Icon,
	UserIcon,
	SentIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HourglassIcon,
	ArrowRight01Icon,
	Copy01Icon,
} from '@hugeicons/core-free-icons';
import { QRCodeSVG } from 'qrcode.react';
import {
	paymentStatusParse,
	callbackStatusParse,
	orderStatusParse,
	orderFulfillmentStatusParse,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { EmailLink, DocumentDisplay, ExternalLink, PhoneLink } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { resendWebhook } from '@/app/actions/merchant/payments';
import { toast } from '@heroui/react';
import { PaymentRequestSource, PaymentStatus } from '@/types/enums';
import type { PaymentDetails } from '@/types/merchant/payments';
import type { ApiResponse } from '@/types/common';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import {
	RevolutPixIcon,
	RevolutWalletIcon,
	RevolutCheckIcon,
	RevolutAlertIcon,
	RevolutRefreshIcon,
} from '@/components/ui/revolut-icons';

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
		: 'Liquidada';

	const finalDate = payment.refundedAt ?? payment.completedAt;

	const steps = [
		{
			label: 'Criada',
			date: payment.createdAt,
			completed: true,
			icon: <Icon icon={HourglassIcon} className="icon-sm" />,
		},
		{
			label: 'Processando SPI',
			date: processingDate,
			completed: !!processingDate,
			icon: <Icon icon={ArrowRight01Icon} className="icon-sm" />,
		},
		{
			label: finalLabel,
			date: finalDate,
			completed: isFinished,
			icon: isFailed ? <Icon icon={CancelCircleIcon} className="icon-sm" /> : <RevolutCheckIcon size={16} />,
			isError: isFailed,
		},
	];

	function getStepStateClasses(step: { completed: boolean; isError?: boolean }) {
		if (step.completed) {
			if (step.isError) {
				return 'bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/30';
			}
			return 'bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30';
		}
		return 'bg-white/5 text-white/40 border border-white/8';
	}

	return (
		<>
			<div className="hidden md:flex md:items-center md:justify-between md:gap-2">
				{steps.map((step, index) => (
					<div key={step.label} className="flex flex-1 items-center gap-2 min-w-0">
						<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${getStepStateClasses(step)}`}>
							{step.icon}
						</div>
						<div className="flex flex-col min-w-0 flex-1">
							<span className="text-xs font-semibold text-white truncate">{step.label}</span>
							<span className="text-[11px] font-mono text-white/40 truncate">
								{step.date ? formatDate(step.date) : 'Aguardando'}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div className={`h-px flex-1 mx-2 ${step.completed ? 'bg-[#00a87e]/40' : 'bg-white/8'}`} />
						)}
					</div>
				))}
			</div>

			<div className="flex flex-col gap-3 md:hidden">
				{steps.map((step) => (
					<div key={step.label} className="flex items-center gap-3">
						<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getStepStateClasses(step)}`}>
							{step.icon}
						</div>
						<div className="flex flex-col flex-1 min-w-0">
							<span className="text-xs font-semibold text-white">{step.label}</span>
							<span className="text-[11px] font-mono text-white/40">
								{step.date ? formatDate(step.date) : 'Aguardando'}
							</span>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function DetailsContentSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-6 flex flex-col gap-4">
				<Skeleton className="h-8 w-48 rounded-lg bg-white/5" />
				<Skeleton className="h-12 w-64 rounded-lg bg-white/5" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Skeleton className="h-40 rounded-[20px] bg-white/5" />
				<Skeleton className="h-40 rounded-[20px] bg-white/5" />
			</div>
		</div>
	);
}

function DetailsContent({ paymentPromise, onOpenQrModal, onResendWebhook, isResendingWebhook }: DetailsContentProps) {
	const response = use(paymentPromise);
	const payment = response?.data;

	if (!payment) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center text-white">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/50 mb-3">
					<Icon icon={InformationCircleIcon} className="icon-md" />
				</div>
				<p className="text-sm font-semibold text-white">Transação não encontrada</p>
				<p className="text-xs text-white/50 mt-1">Não foi possível carregar os detalhes desta cobrança.</p>
			</div>
		);
	}

	const hasCheckoutInfo = !!payment.checkoutId || !!payment.checkoutName;

	return (
		<div className="flex flex-col gap-5 text-white">
			{/* Digital Receipt Hero Header */}
			<div className="rounded-[20px] bg-[#0a0a0a] border border-white/12 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<RevolutStatusBadge status={payment.status} label={paymentStatusParse[payment.status]?.label} size="md" />
						<span className="text-xs font-mono text-white/40">PIX D+0 SPI</span>
					</div>
					<div className="mt-3">
						<span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight tabular-nums">
							{formatCurrency(payment.amount)}
						</span>
						<p className="text-xs font-mono text-[#00a87e] mt-1 font-semibold">
							Líquido recebido: {formatCurrency(payment.netAmount)}
						</p>
					</div>
				</div>

				{payment.pix?.endToEndId && (
					<div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto bg-white/5 p-3 rounded-xl border border-white/8 max-w-sm">
						<span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
							EndToEndId (Banco Central)
						</span>
						<span className="text-xs font-mono text-white font-medium break-all">
							{payment.pix.endToEndId}
						</span>
					</div>
				)}
			</div>

			{/* Timeline Card */}
			<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-5">
				<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40 block mb-4">
					Ciclo de Liquidação PIX
				</span>
				<TransactionStatusTimeline payment={payment} />
			</div>

			{/* Financial Breakdown Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Values */}
				<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-5 flex flex-col gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
						Detalhamento Financeiro
					</span>
					<div className="flex flex-col gap-2.5 text-sm font-mono">
						<div className="flex items-center justify-between border-b border-white/8 pb-2">
							<span className="text-white/60">Valor Bruto</span>
							<span className="font-bold text-white tabular-nums">{formatCurrency(payment.amount)}</span>
						</div>
						<div className="flex items-center justify-between border-b border-white/8 pb-2">
							<span className="text-white/60">Taxa Gateway PIX</span>
							<span className="text-white/80 tabular-nums">-{formatCurrency(payment.fee)}</span>
						</div>
						{payment.reserveDeductedAmount > 0 && (
							<div className="flex items-center justify-between border-b border-white/8 pb-2">
								<span className="text-[#ec7e00]">Reserva Financeira</span>
								<span className="text-[#ec7e00] tabular-nums">-{formatCurrency(payment.reserveDeductedAmount)}</span>
							</div>
						)}
						<div className="flex items-center justify-between pt-1">
							<span className="font-bold text-white">Valor Líquido Merchant</span>
							<span className="font-bold text-[#00a87e] text-base tabular-nums">{formatCurrency(payment.netAmount)}</span>
						</div>
					</div>
				</div>

				{/* Customer & Payer */}
				<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-5 flex flex-col gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
						Dados do Cliente / Pagador
					</span>
					<div className="flex flex-col gap-2.5 text-sm">
						<div className="flex items-center justify-between border-b border-white/8 pb-2">
							<span className="text-white/60">Nome</span>
							<span className="font-medium text-white truncate max-w-48">{payment.customer?.name ?? payment.pix?.payerName ?? '-'}</span>
						</div>
						<div className="flex items-center justify-between border-b border-white/8 pb-2">
							<span className="text-white/60">Email</span>
							<span className="text-white/80 truncate max-w-48">{payment.customer?.email ?? '-'}</span>
						</div>
						<div className="flex items-center justify-between border-b border-white/8 pb-2">
							<span className="text-white/60">Documento</span>
							<span className="font-mono text-white/80">{payment.customer?.document ?? payment.pix?.payerDocument ?? '-'}</span>
						</div>
						{payment.pix?.payerBank && (
							<div className="flex items-center justify-between pt-1">
								<span className="text-white/60">Instituição Bancária</span>
								<span className="text-white/80 font-medium">{payment.pix.payerBank}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* PIX QR Code if Pending */}
			{payment.pix?.copyAndPaste && payment.status === 'Pending' && (
				<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-6 flex flex-col items-center gap-4 text-center">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
						QR Code Dinâmico para Pagamento
					</span>
					<div className="p-4 bg-white rounded-2xl shadow-lg">
						<QRCodeSVG value={payment.pix.copyAndPaste} size={180} level="M" marginSize={0} />
					</div>
					<div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-3 rounded-xl flex items-center justify-between gap-2">
						<span className="text-xs font-mono text-white/70 truncate flex-1 text-left">
							{payment.pix.copyAndPaste}
						</span>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(payment.pix!.copyAndPaste!);
								toast('Código PIX copiado!', { variant: 'success' });
							}}
							className="button-primary text-xs py-1.5 px-3 shrink-0"
						>
							<Icon icon={Copy01Icon} className="icon-xs" />
							Copiar
						</button>
					</div>
				</div>
			)}

			{/* Webhook & Callback Section */}
			<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-5 flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
						Entrega de Webhook
					</span>
					{payment.status === PaymentStatus.Completed && payment.callbackUrl && (
						<button
							type="button"
							disabled={isResendingWebhook}
							onClick={() => onResendWebhook?.(payment.id)}
							className="button-outline-dark text-xs py-1 px-3"
						>
							<Icon icon={SentIcon} className="icon-xs text-[#4f55f1]" />
							{isResendingWebhook ? 'Reenviando...' : 'Reenviar Webhook'}
						</button>
					)}
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
					<div className="bg-[#0a0a0a] border border-white/8 p-3 rounded-xl flex flex-col gap-1">
						<span className="text-white/40">URL de Notificação</span>
						<span className="text-white truncate">{payment.callbackUrl || 'Não configurada'}</span>
					</div>
					<div className="bg-[#0a0a0a] border border-white/8 p-3 rounded-xl flex flex-col gap-1">
						<span className="text-white/40">Tentativas Realizadas</span>
						<span className="text-white">{payment.callbackAttempts} tentativa(s)</span>
					</div>
				</div>
			</div>

			{/* Metadata Payload if exists */}
			{payment.metadata && (
				<div className="rounded-[20px] bg-[#16181a] border border-white/12 p-5 flex flex-col gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
						Payload Customizado (Metadata)
					</span>
					<pre className="text-xs font-mono bg-[#0a0a0a] border border-white/8 p-4 rounded-xl overflow-auto max-h-48 text-white/80">
						{JSON.stringify(JSON.parse(payment.metadata), null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

export function MerchantTransactionDetailsModal({
	isOpen,
	onOpenChange,
	paymentPromise,
	merchantId,
	onRefresh,
}: TransactionDetailsModalProps) {
	const [isResendingWebhook, startResendWebhook] = useTransition();

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
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl bg-[#16181a] border border-white/12 text-white rounded-[20px] p-6 shadow-2xl">
					<Modal.CloseTrigger />
					<Modal.Header className="border-b border-white/10 pb-4 mb-5">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
								<RevolutPixIcon size={20} />
							</div>
							<div>
								<Modal.Heading className="text-lg font-bold text-white">Recibo da Transação PIX</Modal.Heading>
								<p className="text-xs text-white/50">Auditoria completa da liquidação do Banco Central</p>
							</div>
						</div>
					</Modal.Header>
					<Modal.Body className="p-0">
						{paymentPromise && (
							<Suspense fallback={<DetailsContentSkeleton />}>
								<DetailsContent
									paymentPromise={paymentPromise}
									onResendWebhook={handleResendWebhook}
									isResendingWebhook={isResendingWebhook}
								/>
							</Suspense>
						)}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
