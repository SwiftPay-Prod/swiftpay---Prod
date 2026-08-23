'use client';

import { Suspense, use, useState } from 'react';
import { Button, Chip, Link, Modal, Skeleton, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { DetailRow, SectionTitle } from '@/components/ui/detail-components';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import {
	Calendar03Icon,
	Copy01Icon,
	InformationCircleIcon,
	ShoppingCart01Icon,
} from '@hugeicons/core-free-icons';
import {
	approvalRateLevelParse,
	checkoutStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import type { ApiResponse } from '@/types/common';
import type { CheckoutData } from '@/types/merchant/checkouts';
import { ApprovalRateLevel } from '@/types/enums';

type CheckoutPromise = Promise<ApiResponse<CheckoutData>>;

const TAB_ITEMS: InternalTabItem[] = [
	{ id: 'general', label: 'Geral' },
	{ id: 'kpis', label: 'KPIs' },
];

interface CheckoutDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	checkoutPromise: CheckoutPromise | null;
	merchantId: string;
	onEdit: (checkoutId: string) => void;
}

function ContentSkeleton() {
	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={ShoppingCart01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes do Checkout</Modal.Heading>
				<p className="text-sm text-muted">Informações essenciais do checkout.</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-4">
					<div className="flex gap-2">
						<Skeleton className="h-6 w-20 rounded-full" />
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-lg" />
					))}
				</div>
			</Modal.Body>
		</>
	);
}

function DetailsContent({ checkoutPromise }: { checkoutPromise: CheckoutPromise }) {
	const response = use(checkoutPromise);
	const checkout = response?.data;
	const [selectedTab, setSelectedTab] = useState('general');

	if (response?.error || !checkout) {
		return (
			<>
				<Modal.Header>
					<Modal.Icon className="bg-accent text-accent-foreground">
						<Icon icon={ShoppingCart01Icon} className="icon-md" />
					</Modal.Icon>
					<Modal.Heading>Detalhes do Checkout</Modal.Heading>
					<p className="text-sm text-muted">Não foi possível carregar os detalhes deste checkout.</p>
				</Modal.Header>
				<Modal.Body>
					<div className="rounded-xl border border-danger-soft-hover bg-danger-soft p-3 text-sm text-danger">
						{response?.error?.message ?? 'Erro ao carregar checkout.'}
					</div>
				</Modal.Body>
			</>
		);
	}

	const config = checkout.config;
	const statusParse = checkoutStatusParse[checkout.status];
	const templateName = checkout.template?.name ?? 'Sem template';
	const enabledMethods = [config?.pixEnabled ?? true].filter(Boolean).length;
	const kpis = checkout.kpis;

	function getApprovalRateLevel(rate: number): ApprovalRateLevel {
		if (rate >= 50) return ApprovalRateLevel.Excellent;
		if (rate >= 35) return ApprovalRateLevel.Good;
		if (rate >= 25) return ApprovalRateLevel.Average;
		if (rate >= 15) return ApprovalRateLevel.BelowAverage;
		return ApprovalRateLevel.Critical;
	}

	const approvalRateLevel = getApprovalRateLevel(kpis.approvalRate);
	const approvalRateLevelData = approvalRateLevelParse[approvalRateLevel];
	const approvalRateDisplay = `${kpis.approvalRate.toFixed(1)}%`;
	const isCriticalApprovalRate = approvalRateLevel === ApprovalRateLevel.Critical && kpis.transactionCount > 0;

	function handleCopyCheckoutLink() {
		const checkoutUrl = checkout?.checkoutUrl;

		if (!checkoutUrl) {
			return;
		}

		void navigator.clipboard.writeText(checkoutUrl);
	}

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={ShoppingCart01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>{checkout.name}</Modal.Heading>
				<p className="text-sm text-muted">Informações essenciais e desempenho do checkout.</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
						<Chip variant="soft" color="default" size="sm" className="gap-1">
							<Icon icon={Calendar03Icon} className="icon-xs" />
							Criado em {formatDate(checkout.createdAt)}
						</Chip>
					</div>

					<InternalTabs
						ariaLabel="Abas de detalhes do checkout"
						items={TAB_ITEMS}
						selectedKey={selectedTab}
						onSelectionChange={(key) => setSelectedTab(key as string)}
					/>
					{selectedTab === 'general' && (
						<div className="rounded-lg bg-surface-secondary p-3">
							<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
							<div className="grid grid-cols-2 gap-x-4 gap-y-2">
								<DetailRow
									label="Link do checkout"
									value={
										checkout.checkoutUrl ? (
											<div className="flex items-center gap-2">
												<Link href={checkout.checkoutUrl} target="_blank" rel="noopener noreferrer">
													{checkout.checkoutUrl}
												</Link>
												<Tooltip>
													<Button isIconOnly size="sm" variant="tertiary" onPress={handleCopyCheckoutLink}>
														<Icon icon={Copy01Icon} className="icon-sm" />
														<Tooltip.Content>Copiar link</Tooltip.Content>
													</Button>
												</Tooltip>
											</div>
										) : (
											'-'
										)
									}
									mono
								/>
								<DetailRow label="Nome" value={checkout.name} />
								<DetailRow label="Template selecionado" value={templateName} />
								<DetailRow label="Status" value={statusParse.label} />
								<DetailRow label="Expira em" value={checkout.expiresAt ? formatDate(checkout.expiresAt) : 'Sem expiração'} />
								<DetailRow label="Criado em" value={formatDate(checkout.createdAt)} />
								<DetailRow label="Atualizado em" value={formatDate(checkout.updatedAt)} />
								<DetailRow label="Produtos vinculados" value={checkout.products.length} />
								<DetailRow label="Cupons vinculados" value={checkout.coupons.length} />
								<DetailRow label="Pagamentos gerados" value={kpis.transactionCount} />
								<DetailRow label="Métodos de pagamento ativos" value={enabledMethods} />
							</div>
						</div>
					)}

						{selectedTab === 'kpis' && (
							<div className="flex flex-col gap-4">
								<div className="rounded-xl border border-border bg-surface p-4">
									<div className="flex items-center justify-between gap-3">
										<SectionTitle icon={<Icon icon={ShoppingCart01Icon} className="icon-sm" />} title="KPIs do Checkout" />
									{kpis.transactionCount > 0 && (
										<Chip variant="soft" color={mapParseColorToChipColor(approvalRateLevelData.color)} size="sm">
											{approvalRateLevelData.label}
										</Chip>
									)}
									</div>
									{isCriticalApprovalRate && (
										<div className="mt-2 rounded-lg border border-danger-soft-hover bg-danger-soft px-3 py-2">
											<p className="text-xs text-danger">
												Crítico porque a taxa de aprovação está abaixo de 15%. Isso indica que poucas tentativas estão sendo concluídas com sucesso.
											</p>
										</div>
									)}
									<div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
										<div className="rounded-lg border border-success-soft-hover bg-success/10 px-3 py-2">
											<p className="text-xs text-success">Faturamento</p>
											<p className="text-base font-semibold text-success">{formatCurrency(kpis.revenueAmount)}</p>
										</div>
										<div className="rounded-lg border border-accent-soft-hover bg-accent/10 px-3 py-2">
											<p className="text-xs text-accent">Taxa de aprovação</p>
											<p className="text-base font-semibold text-accent">{approvalRateDisplay}</p>
										</div>
										<div className="rounded-lg border border-warning-soft-hover bg-warning/10 px-3 py-2">
											<p className="text-xs text-warning">Acessos (sessões)</p>
											<p className="text-base font-semibold text-warning">{kpis.accessCount}</p>
										</div>
										<div className="rounded-lg border border-border bg-surface-secondary px-3 py-2">
											<p className="text-xs text-muted">Pedidos criados</p>
											<p className="text-base font-semibold">{kpis.orderCount}</p>
										</div>
										<div className="rounded-lg border border-border bg-surface-secondary px-3 py-2">
											<p className="text-xs text-muted">Transações</p>
											<p className="text-base font-semibold">{kpis.transactionCount}</p>
										</div>
										<div className="rounded-lg border border-border bg-surface-secondary px-3 py-2">
											<p className="text-xs text-muted">Transações aprovadas</p>
											<p className="text-base font-semibold">{kpis.completedTransactions}</p>
										</div>
										<div className="rounded-lg border border-border bg-surface-secondary px-3 py-2 xl:col-span-3">
											<p className="text-xs text-muted">Clientes únicos</p>
											<p className="text-base font-semibold">{kpis.customerCount}</p>
										</div>
									</div>
								</div>
							</div>
						)}
				</div>
			</Modal.Body>
		</>
	);
}

export function CheckoutDetailsModal({ isOpen, onOpenChange, checkoutPromise, merchantId: _merchantId, onEdit: _onEdit }: CheckoutDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-3xl">
					<Modal.CloseTrigger />
					{checkoutPromise && (
						<Suspense fallback={<ContentSkeleton />}>
							<DetailsContent checkoutPromise={checkoutPromise} />
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
