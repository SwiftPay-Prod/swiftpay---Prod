'use client';

import { useState, useCallback, useRef, useEffect, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, Avatar, Chip, Button, Modal } from '@heroui/react';
import {
	AnalyticsUpIcon,
	Building02Icon,
	ServerStack01Icon,
	Settings02Icon,
	Delete02Icon,
	CheckListIcon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	UserCheck01Icon,
} from '@hugeicons/core-free-icons';
import { acquirerOperationTypeParse } from '@/parse';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { AsyncButton } from '@/components/ui/async-button';
import { useSignalR } from '@/contexts/signalr-context';
import { SignalRMethods } from '@/lib/signalr/methods';
import { UserRole } from '@/types/enums';
import { Routes } from '@/router/routes';
import { GeneralTab } from './tabs/general-tab';
import { ConfigTab } from './tabs/config-tab';
import { StatsTab } from './tabs/stats-tab';
import { RequiredFieldsTab } from './tabs/required-fields-tab';
import { PixNominalHistoryTab } from './tabs/pix-nominal-history-tab';
import { KycTab } from './tabs/kyc-tab';
import { adminGetAcquirerStats, adminDeleteAcquirer } from '@/app/actions/admin/acquirers';
import { toast } from '@heroui/react';
import type { AdminAcquirerData, AdminAcquirerStatsData } from '@/types/admin/acquirers';
import type { DashboardPeriod } from '@/types/merchant/dashboard';
import { getAcquirerDisplayTitle, getAcquirerDisplaySubtitle } from '@/utils/acquirer-display';
import {
	ACQUIRER_STATS_PERIOD_OPTIONS,
	ACQUIRER_STATS_PERIOD_STORAGE_KEY,
	ACQUIRER_STATS_CUSTOM_START_STORAGE_KEY,
	ACQUIRER_STATS_CUSTOM_END_STORAGE_KEY,
} from './acquirer-stats.constants';
import { ProviderCategoryChip } from '@/components/admin/provider-category-chip';

function getStoredPeriod(): DashboardPeriod {
	if (typeof window === 'undefined') return 'this_week';
	const stored = localStorage.getItem(ACQUIRER_STATS_PERIOD_STORAGE_KEY);
	if (stored && ACQUIRER_STATS_PERIOD_OPTIONS.some((opt) => opt.key === stored)) {
		return stored as DashboardPeriod;
	}
	return 'this_week';
}

function formatIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getDefaultCustomRange(): { startDate: string; endDate: string } {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - 6);

	return {
		startDate: formatIsoDate(startDate),
		endDate: formatIsoDate(endDate),
	};
}

function getStoredCustomRange(): { startDate: string; endDate: string } {
	if (typeof window === 'undefined') {
		return getDefaultCustomRange();
	}

	const defaultRange = getDefaultCustomRange();
	const startDate = localStorage.getItem(ACQUIRER_STATS_CUSTOM_START_STORAGE_KEY) ?? defaultRange.startDate;
	const endDate = localStorage.getItem(ACQUIRER_STATS_CUSTOM_END_STORAGE_KEY) ?? defaultRange.endDate;

	return { startDate, endDate };
}

interface AcquirerDetailsProps {
	acquirer: AdminAcquirerData;
	currentUserRole: UserRole;
}

export function AcquirerDetails({ acquirer, currentUserRole }: AcquirerDetailsProps) {
	const router = useRouter();
	const { isConnected, subscribe, invoke } = useSignalR();
	const [selectedTab, setSelectedTab] = useState<string>('general');
	const [statsData, setStatsData] = useState<AdminAcquirerStatsData | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(getStoredPeriod);
	const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>(getStoredCustomRange);
	const statsLoadedRef = useRef(false);
	const fetchKeyRef = useRef(0);
	const lastFiltersRef = useRef<string | null>(null);

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [deleteState, deleteAction, isDeleting] = useActionState(
		async (_prev: { error: string | null }) => {
			const response = await adminDeleteAcquirer(acquirer.id);

			if (response?.error) {
				return { error: response.error.message };
			}

			toast('Processadora deletada', {
				description: response?.message ?? 'A processadora foi deletada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			setIsDeleteModalOpen(false);
			router.push(Routes.panel.admin.acquirers);
			return { error: null };
		},
		{ error: null }
	);

	function handlePeriodChange(period: DashboardPeriod) {
		setSelectedPeriod(period);
		localStorage.setItem(ACQUIRER_STATS_PERIOD_STORAGE_KEY, period);
		statsLoadedRef.current = false;
		const nextFilters =
			period === 'custom'
				? { period, startDate: customRange.startDate, endDate: customRange.endDate }
				: { period };
		startTransition(() => {
			fetchStats(true, nextFilters);
		});
	}

	function handleCustomRangeChange(startDate: string, endDate: string) {
		setCustomRange({ startDate, endDate });
		localStorage.setItem(ACQUIRER_STATS_CUSTOM_START_STORAGE_KEY, startDate);
		localStorage.setItem(ACQUIRER_STATS_CUSTOM_END_STORAGE_KEY, endDate);

		if (selectedPeriod !== 'custom') {
			return;
		}

		statsLoadedRef.current = false;
		startTransition(() => {
			fetchStats(true, { period: 'custom', startDate, endDate });
		});
	}

	const fetchStats = useCallback(async (
		force = false,
		filtersOverride?: { period: DashboardPeriod; startDate?: string; endDate?: string }
	) => {
		const filters = filtersOverride ?? (
			selectedPeriod === 'custom'
				? { period: selectedPeriod, startDate: customRange.startDate, endDate: customRange.endDate }
				: { period: selectedPeriod }
		);
		const filtersKey = JSON.stringify(filters);

		if (!force && statsLoadedRef.current && statsData !== null && lastFiltersRef.current === filtersKey) return;

		const currentKey = ++fetchKeyRef.current;
		
		// Only show loading skeleton on initial load (when no data exists)
		if (!statsData) {
			setIsLoadingStats(true);
		}

		const response = await adminGetAcquirerStats(acquirer.id, filters);

		if (currentKey !== fetchKeyRef.current) return;

		if (response?.data) {
			setStatsData(response.data);
			statsLoadedRef.current = true;
			lastFiltersRef.current = filtersKey;
		}
		setIsLoadingStats(false);
	}, [acquirer.id, statsData, selectedPeriod, customRange.startDate, customRange.endDate]);

	const handleAcquirerDashboardUpdated = useCallback(() => {
		fetchStats(true);
	}, [fetchStats]);

	useEffect(() => {
		return subscribe(SignalRMethods.AcquirerDashboardUpdated, handleAcquirerDashboardUpdated);
	}, [subscribe, handleAcquirerDashboardUpdated]);

	useEffect(() => {
		if (!isConnected || !acquirer.id) return;
		invoke('JoinAcquirerDashboard', acquirer.id);
		return () => {
			invoke('LeaveAcquirerDashboard', acquirer.id);
		};
	}, [isConnected, acquirer.id, invoke]);

	function handleTabChange(key: string) {
		setSelectedTab(key);
		if (key === 'stats' && !statsLoadedRef.current) {
			setIsLoadingStats(true);
			startTransition(() => {
				fetchStats();
			});
		}
	}

	function handleBack() {
		router.push(Routes.panel.admin.acquirers);
	}

	function handleRefresh() {
		startTransition(() => router.refresh());
	}

	async function handleRefreshStats() {
		startTransition(() => {
			fetchStats(true);
		});
	}

	const headerContent = (
		<div className="flex items-center gap-3">
			{acquirer.logoUrl ? (
				<Avatar size="lg">
					<Avatar.Image src={acquirer.logoUrl} alt={acquirer.name} />
					<Avatar.Fallback>
						<Icon icon={ServerStack01Icon} size={24} className="text-accent" />
					</Avatar.Fallback>
				</Avatar>
			) : (
				<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
					<Icon icon={ServerStack01Icon} size={24} className="text-accent" />
				</div>
			)}
		</div>
	);

	const tabItems: InternalTabItem[] = [
		{ id: 'general', label: 'Geral', icon: <Icon icon={Building02Icon} className="icon-sm" /> },
		{ id: 'stats', label: 'Estatísticas', icon: <Icon icon={AnalyticsUpIcon} className="icon-sm" /> },
		{ id: 'config', label: 'Configurações', icon: <Icon icon={Settings02Icon} className="icon-sm" /> },
		{ id: 'required-fields', label: 'Campos', icon: <Icon icon={CheckListIcon} className="icon-sm" /> },
		{ id: 'pix-nominal-history', label: 'Nominais PIX', icon: <Icon icon={Clock01Icon} className="icon-sm" /> },
		...(acquirer.providerCategory === 'PaymentInstitution'
			? [{ id: 'kyc', label: 'KYC Submerchants', icon: <Icon icon={UserCheck01Icon} className="icon-sm" /> }]
			: []),
	];

	const acquirerTitle = getAcquirerDisplayTitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});
	const acquirerSubtitle = getAcquirerDisplaySubtitle({
		displayName: acquirer.displayName ?? acquirer.name,
		nominal: acquirer.nominal,
	});

	return (
		<div className="flex flex-col gap-6">
			<FormPageHeader
				icon={headerContent}
				title={acquirerTitle}
				description={(
					<>
						<span className="block font-mono">{acquirer.code}</span>
						<span className="block text-muted">{acquirerSubtitle}</span>
					</>
				)}
				onBack={handleBack}
				backLabel="Voltar para processadoras"
				actions={
					currentUserRole === UserRole.God && (
						<button
							type="button"
							onClick={() => setIsDeleteModalOpen(true)}
							className="button-outline-dark cursor-pointer text-xs border-danger/40 text-danger hover:bg-danger/10"
						>
							<Icon icon={Delete02Icon} className="icon-xs" />
							<span>Deletar Processadora</span>
						</button>
					)
				}
			/>

			<div className="-mt-4 flex gap-1">
				<ProviderCategoryChip category={acquirer.providerCategory} />
				{acquirer.operationTypes.map((type) => {
					const parsed = acquirerOperationTypeParse[type];
					return (
						<Chip key={type} size="sm" variant="soft" className={`gap-1 ${parsed?.className ?? ''}`}>
							{parsed?.icon}
							{parsed?.label ?? type}
						</Chip>
					);
				})}
			</div>

			<InternalTabs
				ariaLabel="Abas de detalhes da processadora"
				items={tabItems}
				selectedKey={selectedTab}
				onSelectionChange={(key) => handleTabChange(key as string)}
			>
				<Tabs.Panel id="general" className="min-w-0 p-0">
					<GeneralTab acquirer={acquirer} />
				</Tabs.Panel>
				<Tabs.Panel id="stats" className="min-w-0 p-0">
					<StatsTab 
						statsData={statsData} 
						isLoading={isLoadingStats}
						isPending={isPending}
						selectedPeriod={selectedPeriod}
						onPeriodChange={handlePeriodChange}
						customStartDate={customRange.startDate}
						customEndDate={customRange.endDate}
						onCustomRangeChange={handleCustomRangeChange}
						onRefresh={handleRefreshStats}
					/>
				</Tabs.Panel>
				<Tabs.Panel id="config" className="min-w-0 p-0">
					<ConfigTab acquirer={acquirer} currentUserRole={currentUserRole} onRefresh={handleRefresh} />
				</Tabs.Panel>
				<Tabs.Panel id="required-fields" className="min-w-0 p-0">
					<RequiredFieldsTab acquirerId={acquirer.id} />
				</Tabs.Panel>
				<Tabs.Panel id="pix-nominal-history" className="min-w-0 p-0">
					<PixNominalHistoryTab acquirerId={acquirer.id} />
				</Tabs.Panel>
				{acquirer.providerCategory === 'PaymentInstitution' && (
					<Tabs.Panel id="kyc" className="min-w-0 p-0">
						<KycTab acquirerId={acquirer.id} />
					</Tabs.Panel>
				)}
			</InternalTabs>

			<Modal.Backdrop isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-danger text-danger-foreground">
								<Icon icon={Delete02Icon} className="icon-md" />
							</Modal.Icon>
							<Modal.Heading>Deletar Processadora</Modal.Heading>
							<p className="text-sm text-muted">Esta ação não pode ser desfeita.</p>
						</Modal.Header>
						<form action={deleteAction}>
							<Modal.Body>
								<div className="flex flex-col gap-4">
									<p className="text-sm">
										Tem certeza que deseja deletar a processadora{' '}
										<strong>{acquirer.displayName ?? acquirer.name}</strong>? Merchants com vínculo ativo não podem ser removidos.
									</p>
									{deleteState.error && (
										<p className="text-sm text-danger">{deleteState.error}</p>
									)}
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="tertiary" onPress={() => setIsDeleteModalOpen(false)} isDisabled={isDeleting}>
									Cancelar
								</Button>
								<AsyncButton type="submit" variant="danger" isPending={isDeleting}>
									Deletar
								</AsyncButton>
							</Modal.Footer>
						</form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
