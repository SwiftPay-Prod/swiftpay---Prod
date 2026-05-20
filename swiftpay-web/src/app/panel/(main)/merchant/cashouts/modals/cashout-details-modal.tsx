'use client';

import { Suspense, use } from 'react';
import { Modal, Chip, Skeleton, Accordion } from '@heroui/react';
import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	DollarCircleIcon,
	HourglassIcon,
	InformationCircleIcon,
	UserCheck01Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { payoutStatusParse, pixKeyTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { PayoutStatus } from '@/types/enums';
import type { CashoutDetailData } from '@/types/merchant/cashouts';
import type { ApiResponse } from '@/types/common';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';

type CashoutPromise = Promise<ApiResponse<CashoutDetailData>>;

interface CashoutDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	cashoutPromise: CashoutPromise | null;
}

function StatusTimeline({ cashout }: { cashout: CashoutDetailData }) {
	const failedStatuses: PayoutStatus[] = [PayoutStatus.Failed, PayoutStatus.Rejected, PayoutStatus.Cancelled];
	const isFailed = failedStatuses.includes(cashout.status);

	const steps = [
		{
			label: 'Solicitado',
			date: cashout.requestedAt,
			completed: true,
			icon: <Icon icon={HourglassIcon} className="icon-sm" />,
		},
		{
			label: 'Processando',
			date: cashout.processedAt,
			completed: !!cashout.processedAt,
			icon: <Icon icon={HourglassIcon} className="icon-sm" />,
		},
		{
			label: isFailed ? 'Falhou' : 'Concluído',
			date: cashout.completedAt,
			completed: !!cashout.completedAt,
			icon: cashout.status === 'Completed' ? <Icon icon={CheckmarkCircle02Icon} className="icon-sm" /> : isFailed ? <Icon icon={CancelCircleIcon} className="icon-sm" /> : <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
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
					<div key={`${step.label}-${index}`} className="relative flex items-start gap-3 pl-0">
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

function ContentSkeleton() {
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

function DetailsContent({ cashoutPromise }: { cashoutPromise: CashoutPromise }) {
	const response = use(cashoutPromise);
	const cashout = response?.data;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-foreground/70">{response.error.message}</p>
			</div>
		);
	}

	if (!cashout) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-foreground/70">Saque não encontrado</p>
			</div>
		);
	}

	const statusParse = payoutStatusParse[cashout.status];
	const keyTypeParse = pixKeyTypeParse[cashout.payoutAccount.pixKeyType];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-divider">
				<div className="flex flex-col gap-1">
					<span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(cashout.amount)}</span>
					<span className="text-sm text-foreground/70">Total debitado da conta</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Status</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="md" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>
				</div>
			</div>

			<div className="hidden md:block">
				<Accordion hideSeparator className="px-0">
					<Accordion.Item id="cashout-progress-desktop" defaultExpanded className="rounded-lg border border-divider bg-surface-secondary">
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
								<StatusTimeline cashout={cashout} />
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>

			<div className="md:hidden">
				<Accordion hideSeparator className="px-0">
					<Accordion.Item id="cashout-progress-mobile" className="rounded-lg border border-divider bg-surface-secondary">
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
								<StatusTimeline cashout={cashout} />
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-3 gap-4">
					<DetailRow label="Total Debitado" value={formatCurrency(cashout.amount)} />
					<DetailRow label="Taxa" value={<span className="text-danger">{formatCurrency(cashout.feeAmount)}</span>} />
					<DetailRow
						label="Valor Recebido"
						value={<span className="text-success font-medium">{formatCurrency(cashout.netAmount)}</span>}
					/>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Wallet01Icon} className="icon-sm" />} title="Conta de Destino" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow
						label="Tipo de Chave"
						value={
							<Chip variant="soft" color="default" size="sm" className="gap-1">
								{keyTypeParse.icon}
								{keyTypeParse.label}
							</Chip>
						}
					/>
					<DetailRow label="Chave PIX" value={<CopyableValue value={cashout.payoutAccount.pixKey} label="Chave PIX" />} mono />
					<DetailRow label="Titular" value={cashout.payoutAccount.holderName ?? '-'} />
					<DetailRow label="Banco" value={cashout.payoutAccount.bankName ?? '-'} />
				</div>
			</div>

			{cashout.evaluation && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserCheck01Icon} className="icon-sm" />} title="Avaliação" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Avaliado em" value={formatDate(cashout.evaluation.evaluatedAt)} />
					</div>
				</div>
			)}

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={cashout.id} label="ID" />} mono />
					{cashout.pixEndToEndId && (
						<DetailRow label="EndToEndId" value={<CopyableValue value={cashout.pixEndToEndId} label="EndToEndId" />} mono />
					)}
					<DetailRow label="Solicitado em" value={formatDate(cashout.requestedAt)} />
					<DetailRow label="Processado em" value={formatDate(cashout.processedAt)} />
					<DetailRow label="Concluído em" value={formatDate(cashout.completedAt)} />
					{cashout.failureReason && (
						<div className="col-span-2">
							<DetailRow label="Motivo da Falha" value={cashout.failureReason} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function CashoutDetailsModal({
	isOpen,
	onOpenChange,
	cashoutPromise,
}: CashoutDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do Saque</Modal.Heading>
						<p className="text-sm text-muted">Informações completas do saque</p>
					</Modal.Header>
					<Modal.Body>
						{cashoutPromise && (
							<Suspense fallback={<ContentSkeleton />}>
								<DetailsContent cashoutPromise={cashoutPromise} />
							</Suspense>
						)}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

