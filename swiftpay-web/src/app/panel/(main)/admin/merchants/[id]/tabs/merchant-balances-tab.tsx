'use client';

import { use, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Skeleton, Accordion, Avatar, SearchField, Tooltip } from '@heroui/react';
import { CheckmarkCircle02Icon, Cancel01Icon, ServerStack01Icon, Search01Icon, PencilEdit01Icon, TransactionHistoryIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { CreateMerchantAdjustmentModal } from './modals/create-merchant-adjustment-modal';
import { AdjustmentHistoryModal } from '@/app/panel/(main)/admin/balances/adjustment-history-modal';
import { adminListPlatformBalanceAdjustments } from '@/app/actions/admin/dashboard';
import type { AdminMerchantBalancesData, AdminMerchantAcquirerBucket } from '@/types/admin/merchants';
import type { ApiResponse } from '@/types/common';
import { UserRole } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';

type BalancesPromise = Promise<ApiResponse<AdminMerchantBalancesData>>;

interface MerchantBalancesTabProps {
	fetchPromise: BalancesPromise;
	merchantId: string;
	merchantName: string;
	currentUserRole?: UserRole;
}

function MerchantBalancesTabSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-10 rounded-lg" />
			{[...Array(2)].map((_, i) => (
				<Skeleton key={i} className="h-16 rounded-lg" />
			))}
			<Skeleton className="h-32 rounded-lg" />
		</div>
	);
}

function BalanceItem({ label, value, colorClass }: { label: string; value: number; colorClass?: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-border p-3">
			<span className="text-xs text-muted">{label}</span>
			<span className={`text-sm font-semibold ${colorClass ?? ''}`}>{formatCurrency(value)}</span>
		</div>
	);
}

function AcquirerBucketItem({ bucket }: { bucket: AdminMerchantAcquirerBucket }) {
	const displayName = bucket.acquirerDisplayName?.trim() || bucket.acquirerName;

	return (
		<Accordion hideSeparator className="px-0" key={bucket.merchantAcquirerId ?? 'legacy'}>
			<Accordion.Item id={bucket.merchantAcquirerId ?? 'legacy'} className="rounded-lg border border-divider bg-surface">
				<Accordion.Heading>
					<Accordion.Trigger className="flex w-full items-center justify-between p-4">
						<div className="flex flex-1 items-center gap-3">
							{bucket.acquirerLogoUrl ? (
								<Avatar size="sm" className="size-8 shrink-0">
									<Avatar.Image src={bucket.acquirerLogoUrl} alt={displayName} />
									<Avatar.Fallback>
										<Icon icon={ServerStack01Icon} className="icon-sm text-muted" />
									</Avatar.Fallback>
								</Avatar>
							) : (
								<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-content1">
									<Icon icon={ServerStack01Icon} className="icon-sm text-muted" />
								</div>
							)}
							<div className="flex min-w-0 flex-1 flex-col text-left">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium">{displayName}</span>
									{bucket.acquirerCode && (
										<span className="text-xs text-muted">· {bucket.acquirerCode}</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-3 pr-2">
								<span className="text-sm font-semibold text-success">{formatCurrency(bucket.available)}</span>
								{bucket.isActive ? (
									<Chip size="sm" variant="soft" color="success">
										<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
										<Chip.Label>Ativa</Chip.Label>
									</Chip>
								) : (
									<Chip size="sm" variant="soft" color="default">
										<Icon icon={Cancel01Icon} className="icon-xs" />
										<Chip.Label>Inativa</Chip.Label>
									</Chip>
								)}
							</div>
						</div>
						<Accordion.Indicator className="text-muted" />
					</Accordion.Trigger>
				</Accordion.Heading>
				<Accordion.Panel>
					<Accordion.Body className="flex flex-col gap-3 p-4">
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<BalanceItem label="Disponível" value={bucket.available} colorClass="text-success" />
							<BalanceItem label="Pendente" value={bucket.pending} colorClass="text-warning" />
							<BalanceItem label="Bloqueado" value={bucket.blocked} colorClass="text-danger" />
							<BalanceItem label="Sacado" value={bucket.payoutsOut} colorClass="text-muted" />
						</div>					<div className="border-t border-border pt-3">
						<span className="mb-2 block text-xs text-muted">Fluxo Histórico</span>
						<div className="grid grid-cols-2 gap-3">
							<BalanceItem label="Total entrada" value={bucket.totalIn} colorClass="text-success" />
							<BalanceItem label="Total saída" value={bucket.payoutsOut} colorClass="text-danger" />
						</div>
					</div>					</Accordion.Body>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion>
	);
}

function MerchantBalancesTabContent({
	fetchPromise,
	merchantId,
	merchantName,
	currentUserRole,
	onAdjustmentSuccess,
}: {
	fetchPromise: BalancesPromise;
	merchantId: string;
	merchantName: string;
	currentUserRole?: UserRole;
	onAdjustmentSuccess: () => void;
}) {
	const response = use(fetchPromise);
	const data = response?.data;
	const [searchQuery, setSearchQuery] = useState('');
	const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [historyPromise, setHistoryPromise] = useState<ReturnType<typeof adminListPlatformBalanceAdjustments> | null>(null);

	if (response?.error) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-sm text-danger">{response.error.message}</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-sm text-muted">Nenhum dado disponível.</p>
			</div>
		);
	}

	const filteredAcquirers = data.acquirers
		.filter((bucket) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		const displayName = (bucket.acquirerDisplayName?.trim() || bucket.acquirerName).toLowerCase();
		return (
			displayName.includes(query) ||
			bucket.acquirerName.toLowerCase().includes(query) ||
			bucket.acquirerCode?.toLowerCase().includes(query)
		);
		})
		.sort((a, b) => {
			if (a.isActive === b.isActive) {
				const aDisplayName = a.acquirerDisplayName?.trim() || a.acquirerName;
				const bDisplayName = b.acquirerDisplayName?.trim() || b.acquirerName;
				return aDisplayName.localeCompare(bDisplayName, 'pt-BR');
			}

			return a.isActive ? -1 : 1;
		});

	function handleAdjustmentSuccess() {
		setIsAdjustmentModalOpen(false);
		onAdjustmentSuccess();
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<SearchField
					variant="secondary"
					value={searchQuery}
					onChange={setSearchQuery}
					aria-label="Buscar adquirente"
					className="flex-1"
				>
					<SearchField.Group>
						<SearchField.SearchIcon>
							<Icon icon={Search01Icon} className="icon-sm" />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Buscar adquirente..." />
						<SearchField.ClearButton />
					</SearchField.Group>
				</SearchField>
				{currentUserRole === UserRole.God && (
					<Tooltip>
						<Button
							variant="secondary"
							onPress={() => setIsAdjustmentModalOpen(true)}
						>
							<Icon icon={PencilEdit01Icon} className="icon-sm" />
							Ajustar Saldo
							<Tooltip.Content>Registrar ajuste manual de saldo</Tooltip.Content>
						</Button>
					</Tooltip>
				)}
				{(currentUserRole === UserRole.God || currentUserRole === UserRole.Admin) && (
					<Tooltip>
						<Button
							variant="secondary"
							onPress={() => {
								setHistoryPromise(adminListPlatformBalanceAdjustments({ page: 1, pageSize: 10, merchantId, scope: 'Merchant' }));
								setIsHistoryOpen(true);
							}}
						>
							<Icon icon={TransactionHistoryIcon} className="icon-sm" />
							Ver Ajustes
							<Tooltip.Content>Histórico de ajustes de saldo</Tooltip.Content>
						</Button>
					</Tooltip>
				)}
			</div>

			{filteredAcquirers.length === 0 ? (
				<div className="flex items-center justify-center py-8">
					<p className="text-sm text-muted">Nenhuma adquirente encontrada.</p>
				</div>
			) : (
			<div className="flex flex-col gap-2">
				{filteredAcquirers.map((bucket) => (
					<AcquirerBucketItem key={bucket.merchantAcquirerId ?? 'legacy'} bucket={bucket} />
				))}
			</div>
			)}

			<Card>
				<Card.Content className="p-4">
					<div className="flex flex-col gap-3">
						<span className="text-sm font-semibold">Totais Históricos</span>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<BalanceItem label="Volume Total" value={data.totals.lifetimeVolume} />
							<BalanceItem label="Total Sacado" value={data.totals.lifetimePayouts} />
							<BalanceItem label="Total Estornado" value={data.totals.lifetimeRefunds} />
							<BalanceItem label="Total em Taxas" value={data.totals.lifetimeFeesPaid} />
						</div>
					</div>
				</Card.Content>
			</Card>

			{currentUserRole === UserRole.God && (
				<CreateMerchantAdjustmentModal
					isOpen={isAdjustmentModalOpen}
					onOpenChange={setIsAdjustmentModalOpen}
					onSuccess={handleAdjustmentSuccess}
					merchantId={merchantId}
					merchantName={merchantName}				acquirers={data.acquirers}				/>
			)}
			<AdjustmentHistoryModal
				isOpen={isHistoryOpen}
				onOpenChange={setIsHistoryOpen}
				merchantId={merchantId}
				merchantName={merchantName}
				initialDataPromise={historyPromise}
			/>
		</div>
	);
}

export function MerchantBalancesTab({
	fetchPromise,
	merchantId,
	merchantName,
	currentUserRole,
}: MerchantBalancesTabProps) {
	const router = useRouter();

	function handleAdjustmentSuccess() {
		router.refresh();
	}

	return (
		<Suspense fallback={<MerchantBalancesTabSkeleton />}>
			<MerchantBalancesTabContent
				fetchPromise={fetchPromise}
				merchantId={merchantId}
				merchantName={merchantName}
				currentUserRole={currentUserRole}
				onAdjustmentSuccess={handleAdjustmentSuccess}
			/>
		</Suspense>
	);
}
