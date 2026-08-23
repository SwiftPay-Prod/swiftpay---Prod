'use client';

import { Suspense, use, useState } from 'react';
import { Modal, Chip, Skeleton, Button, toast } from '@heroui/react';
import {
	Wallet01Icon,
	InformationCircleIcon,
	DollarCircleIcon,
	ServerStack01Icon,
	PlayIcon,
	UserIcon,
	Key01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HourglassIcon,
	AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import type { AdminPlatformPayoutData, AdminPlatformPayoutItemData } from '@/types/admin/platform-payouts';
import type { ApiResponse } from '@/types/common';
import { adminReprocessPlatformPayoutItemDev } from '@/app/actions/admin/platform-payouts';
import { AdminReprocessConfirmModal } from '@/components/admin/admin-reprocess-confirm-modal';
import {
	platformPayoutStatusParse,
	platformPayoutItemStatusParse,
	mapParseColorToChipColor,
	pixKeyTypeParse,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import Image from 'next/image';

type PayoutPromise = Promise<ApiResponse<AdminPlatformPayoutData>>;

interface AdminPlatformPayoutDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	payoutPromise: PayoutPromise | null;
	onReprocessed?: () => void;
}

function ItemStatusIcon({ status }: { status: AdminPlatformPayoutItemData['status'] }) {
	switch (status) {
		case 'Processing':
			return <Icon icon={HourglassIcon} className="icon-xs" />;
		case 'Completed':
			return <Icon icon={CheckmarkCircle02Icon} className="icon-xs" />;
		case 'Cancelled':
			return <Icon icon={CancelCircleIcon} className="icon-xs" />;
		case 'Failed':
			return <Icon icon={CancelCircleIcon} className="icon-xs" />;
		default:
			return null;
	}
}

function ContentSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-[20px]" />
				))}
			</div>
		</div>
	);
}

function ItemsTable({
	items,
	isPending,
	onReprocessItem,
}: {
	items: AdminPlatformPayoutItemData[];
	isPending: boolean;
	onReprocessItem: (item: AdminPlatformPayoutItemData) => void;
}) {
	if (items.length === 0) return null;

	return (
		<div className="rounded-[20px] border border-white/12 bg-card p-5 overflow-hidden">
			<SectionTitle icon={<Icon icon={ServerStack01Icon} className="icon-sm" />} title="Itens por Adquirente" />
			<div className="mt-3 flex flex-col gap-3">
				{items.map((item) => {
					const statusParse = platformPayoutItemStatusParse[item.status];
					const hasExtra = !!(
						item.acquirerTransactionId ||
						item.pixEndToEndId ||
						item.processedAt ||
						item.completedAt ||
						item.failureReason
					);
					return (
						<div key={item.id} className="rounded-[20px] border border-white/12 bg-surface-deep overflow-hidden">
							<div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/12 bg-surface-deep">
								<div className="flex items-center gap-2.5 min-w-0">
									{item.acquirerLogoUrl ? (
										<Image
											src={item.acquirerLogoUrl}
											alt={item.acquirerName}
											className="h-5 w-5 rounded shrink-0 object-contain"
											width={20}
											height={20}
										/>
									) : (
										<Icon icon={ServerStack01Icon} className="icon-sm text-white/50 shrink-0" />
									)}
									<div className="flex items-baseline gap-2 min-w-0">
										<span className="font-medium truncate text-white">{item.acquirerName}</span>
										<span className="text-xs text-white/50 font-mono shrink-0">{item.acquirerCode}</span>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<RevolutStatusBadge status={item.status} label={statusParse.label} />
									{(item.status === 'Processing' || item.status === 'Failed') && (
										<Button
											variant="primary"
											size="sm"
											isIconOnly
											onPress={() => onReprocessItem(item)}
											isDisabled={isPending}
											className="button-primary"
										>
											<Icon icon={PlayIcon} className="icon-xs" />
										</Button>
									)}
								</div>
							</div>
							<div className="grid grid-cols-3 divide-x divide-white/12 px-4 py-3">
								<div className="flex flex-col gap-0.5 pr-4">
									<span className="text-xs text-white/50">Valor</span>
									<span className="font-mono tabular-nums font-medium text-white">{formatCurrency(item.amount)}</span>
								</div>
								<div className="flex flex-col gap-0.5 px-4">
									<span className="text-xs text-white/50">Taxa</span>
									<span className="font-mono tabular-nums text-sm text-danger">{formatCurrency(item.acquirerFee)}</span>
								</div>
								<div className="flex flex-col gap-0.5 pl-4">
									<span className="text-xs text-white/50">Líquido</span>
									<span className="font-mono tabular-nums text-sm text-success font-medium">{formatCurrency(item.netAmount)}</span>
								</div>
							</div>
							{hasExtra && (
								<div className="border-t border-white/12 px-4 py-3 grid grid-cols-2 gap-3">
									{item.acquirerTransactionId && (
										<DetailRow
											label="ID Adquirente"
											value={<CopyableValue value={item.acquirerTransactionId} label="ID Adquirente" />}
											mono
										/>
									)}
									{item.pixEndToEndId && (
										<DetailRow
											label="EndToEnd ID"
											value={<CopyableValue value={item.pixEndToEndId} label="EndToEnd ID" />}
											mono
										/>
									)}
									{item.processedAt && <DetailRow label="Processado em" value={formatDate(item.processedAt)} />}
									{item.completedAt && <DetailRow label="Concluído em" value={formatDate(item.completedAt)} />}
									{item.failureReason && (
										<div className="col-span-2">
											<DetailRow
												label="Motivo da Falha"
												value={<span className="text-danger">{item.failureReason}</span>}
											/>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
			<div className="mt-3 flex items-center justify-between rounded-[20px] bg-surface-deep border border-white/12 px-4 py-2.5">
				<span className="text-sm font-medium text-white/70">Total</span>
				<div className="flex items-center gap-6">
					<div className="flex flex-col items-end">
						<span className="text-xs text-white/50">Valor</span>
						<span className="font-mono tabular-nums text-sm font-medium text-white">{formatCurrency(items.reduce((sum, i) => sum + i.amount, 0))}</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs text-white/50">Taxa</span>
						<span className="font-mono tabular-nums text-sm text-danger">
							{formatCurrency(items.reduce((sum, i) => sum + i.acquirerFee, 0))}
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs text-white/50">Líquido</span>
						<span className="font-mono tabular-nums text-sm text-success font-medium text-white">
							{formatCurrency(items.reduce((sum, i) => sum + i.netAmount, 0))}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailsContent({
	payout,
	isPending,
	onReprocessItem,
}: {
	payout: AdminPlatformPayoutData;
	isPending: boolean;
	onReprocessItem: (item: AdminPlatformPayoutItemData) => void;
}) {
	const statusParse = platformPayoutStatusParse[payout.status];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-white/12">
				<div className="flex flex-col gap-1">
					<span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">{formatCurrency(payout.totalAmount)}</span>
					<span className="text-sm text-white/70">Valor total do saque</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-white/50">Status</span>
						<RevolutStatusBadge status={payout.status} label={statusParse.label} size="md" />
					</div>
				</div>
				{payout.status === 'PartiallyCompleted' && (
					<div className="flex items-start gap-3 rounded-[20px] border border-warning/40 bg-warning/10 p-4">
						<Icon icon={AlertCircleIcon} className="icon-sm text-warning shrink-0 mt-0.5" />
						<div className="flex flex-col gap-1">
							<span className="text-sm font-medium text-warning">Saque parcialmente concluído</span>
							<span className="text-xs text-white/70">
								Parte das adquirentes processou o saque com sucesso. Os valores das adquirentes que falharam foram
								devolvidos ao saldo disponível da plataforma e podem ser sacados novamente.
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<DetailRow label="Valor Total" value={<span className="font-mono tabular-nums text-white">{formatCurrency(payout.totalAmount)}</span>} />
					<DetailRow
						label="Taxa Total"
						value={<span className="font-mono tabular-nums text-danger">{formatCurrency(payout.totalFee)}</span>}
					/>
					<DetailRow
						label="Valor Líquido"
						value={<span className="font-mono tabular-nums text-success">{formatCurrency(payout.totalNetAmount)}</span>}
					/>
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-card p-5">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={payout.id} label="ID" />} mono />
					<DetailRow label="Ambiente" value={payout.environment} />
					<DetailRow label="Solicitado em" value={formatDate(payout.requestedAt)} />
					{payout.completedAt && <DetailRow label="Concluído em" value={formatDate(payout.completedAt)} />}
					{payout.notes && (
						<div className="col-span-2">
							<DetailRow label="Observações" value={payout.notes} />
						</div>
					)}
				</div>
			</div>

			{payout.payoutAccount && (
				<div className="rounded-[20px] border border-white/12 bg-card p-5">
					<SectionTitle icon={<Icon icon={Key01Icon} className="icon-sm" />} title="Conta de Destino" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow
							label="Chave PIX"
							value={<CopyableValue value={payout.payoutAccount.pixKey} label="Chave PIX" />}
							mono
						/>
						<DetailRow
							label="Tipo de Chave"
							value={
								<RevolutStatusBadge status={payout.payoutAccount.pixKeyType} label={pixKeyTypeParse[payout.payoutAccount.pixKeyType as keyof typeof pixKeyTypeParse]?.label ?? payout.payoutAccount.pixKeyType} />
							}
						/>
						<DetailRow label="Titular" value={payout.payoutAccount.holderName ?? '-'} />
						{payout.payoutAccount.bankName && <DetailRow label="Banco" value={payout.payoutAccount.bankName} />}
					</div>
				</div>
			)}

			<div className="rounded-[20px] border border-white/12 bg-card p-5">
				<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm" />} title="Solicitante" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={payout.requestedByUserId} label="ID do Usuário" />} mono />
					<DetailRow label="Nome" value={payout.requestedByUserName ?? '-'} />
				</div>
			</div>

			<ItemsTable items={payout.items} isPending={isPending} onReprocessItem={onReprocessItem} />
		</div>
	);
}

function ModalContent({
	payoutPromise,
	onOpenChange,
	onReprocessed,
}: {
	payoutPromise: PayoutPromise;
	onOpenChange: (isOpen: boolean) => void;
	onReprocessed?: () => void;
}) {
	const [isReprocessPending, setIsReprocessPending] = useState(false);
	const [isReprocessModalOpen, setIsReprocessModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AdminPlatformPayoutItemData | null>(null);
	const isBusy = isReprocessPending;
	const response = use(payoutPromise);
	const payout = response?.data;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-muted">{response.error.message}</p>
			</div>
		);
	}

	if (!payout) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted">Saque não encontrado</p>
			</div>
		);
	}

	function handleOpenReprocessItem(item: AdminPlatformPayoutItemData) {
		setSelectedItem(item);
		setIsReprocessModalOpen(true);
	}

	async function handleReprocessItem(targetStatus: string): Promise<void> {
		if (!selectedItem) return;

		setIsReprocessPending(true);

		try {
			const result = await adminReprocessPlatformPayoutItemDev(selectedItem.id, { targetStatus });

			if (result?.error) {
				toast('Erro ao reprocessar saque', {
					description: result.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			toast('Item reprocessado', {
				description: result?.message ?? 'O item do saque de plataforma foi reprocessado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setIsReprocessModalOpen(false);
			setSelectedItem(null);
			onReprocessed?.();
		} finally {
			setIsReprocessPending(false);
		}
	}

	return (
		<>
			<AdminReprocessConfirmModal
				isOpen={isReprocessModalOpen}
				onOpenChange={(isOpen) => {
					setIsReprocessModalOpen(isOpen);
					if (!isOpen) setSelectedItem(null);
				}}
				title="Reprocessar item do saque"
				description={
					selectedItem
						? `Selecione o status de destino para o item da adquirente ${selectedItem.acquirerName}.`
						: 'Selecione o status de destino para o item em processamento.'
				}
				confirmLabel="Reprocessar item"
				statusLabel="Status de destino"
				acknowledgeLabel="Estou ciente do impacto operacional deste reprocessamento."
				options={[
					{
						value: 'Completed',
						label: platformPayoutItemStatusParse.Completed.label,
						color: platformPayoutItemStatusParse.Completed.color,
						icon: platformPayoutItemStatusParse.Completed.icon,
					},
					{
						value: 'Failed',
						label: platformPayoutItemStatusParse.Failed.label,
						color: platformPayoutItemStatusParse.Failed.color,
						icon: platformPayoutItemStatusParse.Failed.icon,
					},
				]}
				defaultStatus="Completed"
				isPending={isBusy}
				onConfirm={handleReprocessItem}
			/>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={Wallet01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes do Saque</Modal.Heading>
				<p className="text-sm text-muted">Informações do saque da plataforma</p>
			</Modal.Header>
			<Modal.Body>
				<DetailsContent payout={payout} isPending={isBusy} onReprocessItem={handleOpenReprocessItem} />
			</Modal.Body>
			<Modal.Footer className="flex justify-end gap-2">
				<Button variant="secondary" onPress={() => onOpenChange(false)} isDisabled={isBusy} className="button-outline-dark">
					Fechar
				</Button>
			</Modal.Footer>
		</>
	);
}

export function AdminPlatformPayoutDetailsModal({
	isOpen,
	onOpenChange,
	payoutPromise,
	onReprocessed,
}: AdminPlatformPayoutDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl rounded-[20px] border border-white/12 bg-card">
					<Modal.CloseTrigger />
					{payoutPromise && (
						<Suspense
							fallback={
								<>
									<Modal.Header>
										<Modal.Icon className="bg-accent text-accent-foreground">
											<Icon icon={Wallet01Icon} className="icon-md" />
										</Modal.Icon>
										<Modal.Heading>Detalhes do Saque</Modal.Heading>
										<p className="text-sm text-muted">Informações do saque da plataforma</p>
									</Modal.Header>
									<Modal.Body>
										<ContentSkeleton />
									</Modal.Body>
								</>
							}
						>
							<ModalContent payoutPromise={payoutPromise} onOpenChange={onOpenChange} onReprocessed={onReprocessed} />
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
