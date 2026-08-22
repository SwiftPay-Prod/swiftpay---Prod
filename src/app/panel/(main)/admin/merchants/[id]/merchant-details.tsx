'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, Button, Chip, Avatar } from '@heroui/react';
import { toast } from '@heroui/react';
import {
	Building02Icon,
	CancelCircleIcon,
	ServerStack01Icon,
	CheckmarkCircle02Icon,
	ArrowReloadHorizontalIcon,
	RepeatIcon,
	DashboardCircleIcon,
	QrCodeIcon,
	UserGroupIcon,
	Wallet03Icon,
	UserIcon,
	Clock02Icon,
	Money02Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { FormPageHeader } from '@/components/ui/form-page-header';
import { MerchantActionsDropdown } from '@/components/admin/merchant-actions-dropdown';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SetAcquirerModal } from '@/components/admin/set-acquirer-modal';
import { adminActivateMerchant, adminSuspendMerchant, adminInactivateMerchant } from '@/app/actions/admin/merchants';
import { merchantStatusParse, merchantKycStatusParse, mapParseColorToChipColor } from '@/parse';
import type {
	AdminMerchantDetails,
	AdminMerchantSettingsData,
	AdminMerchantBalancesData,
	AcquirerHistoryItem,
	SettingsHistoryItem,
} from '@/types/admin/merchants';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import type { AdminWayneProtocolSettingsData } from '@/types/admin/wayne-protocol';
import type { AdminMinimalReconciliation } from '@/types/admin/reconciliation';
import type { ApiResponse, Paginated } from '@/types/common';
import { UserRole } from '@/types/enums';
import { Routes } from '@/router/routes';
import { GeneralTab } from './tabs/general-tab';
import { SettingsTab } from './tabs/settings-tab';
import { ReconciliationTab } from './tabs/reconciliation-tab';
import { MerchantDashboardTab } from './tabs/merchant-dashboard-tab';
import { MerchantTransactionsTab } from './tabs/merchant-transactions-tab';
import { MerchantCustomersTab } from './tabs/merchant-customers-tab';
import { MerchantCashoutsTab } from './tabs/merchant-cashouts-tab';
import { HistoryTab } from './tabs/history-tab';
import { MerchantBalancesTab } from './tabs/merchant-balances-tab';

type SettingsPromise = Promise<ApiResponse<AdminMerchantSettingsData>>;
type ReconciliationsPromise = Promise<ApiResponse<Paginated<AdminMinimalReconciliation>>>;
type AcquirerHistoryPromise = Promise<ApiResponse<Paginated<AcquirerHistoryItem>>>;
type SettingsHistoryPromise = Promise<ApiResponse<Paginated<SettingsHistoryItem>>>;
type BalancesPromise = Promise<ApiResponse<AdminMerchantBalancesData>>;
type WayneSettingsPromise = Promise<ApiResponse<AdminWayneProtocolSettingsData>>;

interface MerchantDetailsProps {
	merchant: AdminMerchantDetails;
	currentUserRole: UserRole;
	currentUserId: string;
	platformSettings: AdminPlatformSettingsData;
	settingsPromise: SettingsPromise;
	reconciliationsPromise: ReconciliationsPromise;
	acquirerHistoryPromise: AcquirerHistoryPromise;
	settingsHistoryPromise: SettingsHistoryPromise;
	balancesPromise: BalancesPromise;
	wayneSettingsPromise: WayneSettingsPromise | null;
}

export function MerchantDetails({
	merchant,
	currentUserRole,
	currentUserId,
	platformSettings,
	settingsPromise,
	reconciliationsPromise,
	acquirerHistoryPromise,
	settingsHistoryPromise,
	balancesPromise,
	wayneSettingsPromise,
}: MerchantDetailsProps) {
	const router = useRouter();
	const [selectedTab, setSelectedTab] = useState<string>('general');
	const [isPending, startTransition] = useTransition();
	const [activateModal, setActivateModal] = useState(false);
	const [suspendModal, setSuspendModal] = useState(false);
	const [inactivateModal, setInactivateModal] = useState(false);
	const [setAcquirerModal, setSetAcquirerModal] = useState(false);

	const isOwner = merchant.user.id === currentUserId;

	function handleBack() {
		router.push(Routes.panel.admin.merchants);
	}

	function handleRefresh() {
		startTransition(() => router.refresh());
	}

	function handleActivate() {
		startTransition(async () => {
			const response = await adminActivateMerchant(merchant.id);
			if (response.error) {
				toast('Erro ao ativar', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}
			toast('Organização ativada', {
				description: 'A organização foi ativada com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			setActivateModal(false);
			handleRefresh();
		});
	}

	function handleSuspend(reason?: string) {
		if (!reason) return;
		startTransition(async () => {
			const response = await adminSuspendMerchant(merchant.id, reason);
			if (response.error) {
				toast('Erro ao suspender', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}
			toast('Organização suspensa', {
				description: 'A organização foi suspensa com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			setSuspendModal(false);
			handleRefresh();
		});
	}

	function handleInactivate(reason?: string) {
		if (!reason) return;
		startTransition(async () => {
			const response = await adminInactivateMerchant(merchant.id, reason);
			if (response.error) {
				toast('Erro ao inativar', {
					description: response.error.message,
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}
			toast('Organização inativada', {
				description: 'A organização foi inativada com sucesso.',
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			setInactivateModal(false);
			handleRefresh();
		});
	}

	function handleEvaluate() {
		router.push(Routes.panel.admin.merchantEvaluate(merchant.id));
	}

	function handleViewOwnerUser() {
		router.push(`${Routes.panel.admin.users}/${merchant.user.id}`);
	}

	const metaContent = (
		<div className="flex flex-wrap items-center gap-2">
			<Chip size="sm" variant="soft" color={mapParseColorToChipColor(merchantStatusParse[merchant.status].color)}>
				{merchantStatusParse[merchant.status].label}
			</Chip>
			<Chip size="sm" variant="soft" color={mapParseColorToChipColor(merchantKycStatusParse[merchant.kycStatus].color)}>
				{merchantKycStatusParse[merchant.kycStatus].label}
			</Chip>
			{merchant.acquirer && (
				<div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5">
					{merchant.acquirer.logoUrl ? (
						<Avatar size="sm" className="size-4">
							<Avatar.Image src={merchant.acquirer.logoUrl} alt={merchant.acquirer.displayName ?? merchant.acquirer.name} />
							<Avatar.Fallback><Icon icon={ServerStack01Icon} className="icon-xs" /></Avatar.Fallback>
						</Avatar>
					) : (
						<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
					)}
					<span className="text-xs font-medium">{merchant.acquirer.displayName ?? merchant.acquirer.name}</span>

					{merchant.acquirer.nominal && (
						<span className="text-xs text-muted">· {merchant.acquirer.nominal}</span>
					)}
				</div>
			)}
		</div>
	);

	const actionsContent = (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={handleViewOwnerUser}
				className="button-outline-dark cursor-pointer text-xs"
			>
				<Icon icon={UserIcon} className="icon-xs" />
				<span>Ver usuário dono</span>
			</button>
			<MerchantActionsDropdown
				merchant={{
					id: merchant.id,
					name: merchant.name,
					status: merchant.status,
					kycStatus: merchant.kycStatus,
					acquirerName: merchant.acquirer?.displayName ?? merchant.acquirer?.name ?? null,
				}}
				currentUserRole={currentUserRole}
				isPending={isPending}
				onActivate={() => setActivateModal(true)}
				onSuspend={() => setSuspendModal(true)}
				onInactivate={() => setInactivateModal(true)}
				onEvaluate={handleEvaluate}
				onSetAcquirer={() => setSetAcquirerModal(true)}
			/>
		</div>
	);

	const tabItems: InternalTabItem[] = [
		{ id: 'general', label: 'Geral', icon: <Icon icon={Building02Icon} className="icon-sm" /> },
		{ id: 'settings', label: 'Ajustes', icon: <Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" /> },
		{ id: 'history', label: 'Histórico', icon: <Icon icon={Clock02Icon} className="icon-sm" /> },
		{ id: 'balances', label: 'Saldos', icon: <Icon icon={Money02Icon} className="icon-sm" /> },
		{ id: 'reconciliation', label: 'Reconciliação', icon: <Icon icon={RepeatIcon} className="icon-sm" /> },
		{ id: 'dashboard', label: 'Dashboard', icon: <Icon icon={DashboardCircleIcon} className="icon-sm" /> },
		{ id: 'transactions', label: 'Transações', icon: <Icon icon={QrCodeIcon} className="icon-sm" /> },
		{ id: 'customers', label: 'Clientes', icon: <Icon icon={UserGroupIcon} className="icon-sm" /> },
		{ id: 'cashouts', label: 'Saques', icon: <Icon icon={Wallet03Icon} className="icon-sm" /> },
	];
	return (
		<div className="flex flex-col gap-6">
			<FormPageHeader
				icon={<Icon icon={Building02Icon} className="icon-lg text-accent" />}
				title={merchant.name ?? 'Sem nome fantasia'}
				description={merchant.kyc?.legalName ?? merchant.email ?? '—'}
				meta={metaContent}
				onBack={handleBack}
				backLabel="Voltar para organizações"
				actions={actionsContent}
			/>

			<InternalTabs
				ariaLabel="Abas de detalhes da organização"
				items={tabItems}
				selectedKey={selectedTab}
				onSelectionChange={setSelectedTab}
			>
				<Tabs.Panel id="general" className="p-0">
					<GeneralTab merchant={merchant} />
				</Tabs.Panel>
				<Tabs.Panel id="settings" className="p-0">
					<SettingsTab
						fetchPromise={settingsPromise}
						merchantId={merchant.id}
						platformSettings={platformSettings}
						acquirer={merchant.acquirer}
						currentUserRole={currentUserRole}
						wayneSettingsPromise={wayneSettingsPromise}
					/>
				</Tabs.Panel>
				<Tabs.Panel id="history" className="p-0">
					<HistoryTab
						merchantId={merchant.id}
						acquirerHistoryPromise={acquirerHistoryPromise}
						settingsHistoryPromise={settingsHistoryPromise}
					/>
				</Tabs.Panel>
				<Tabs.Panel id="balances" className="p-0">
					<MerchantBalancesTab
						fetchPromise={balancesPromise}
						merchantId={merchant.id}
						merchantName={merchant.name ?? 'Sem nome'}
						currentUserRole={currentUserRole}
					/>
				</Tabs.Panel>
				<Tabs.Panel id="reconciliation" className="p-0">
					<ReconciliationTab merchantId={merchant.id} fetchPromise={reconciliationsPromise} />
				</Tabs.Panel>
				<Tabs.Panel id="dashboard" className="p-0">
					<MerchantDashboardTab merchantId={merchant.id} />
				</Tabs.Panel>
				<Tabs.Panel id="transactions" className="p-0">
					<MerchantTransactionsTab merchantId={merchant.id} readOnly={!isOwner} />
				</Tabs.Panel>
				<Tabs.Panel id="customers" className="p-0">
					<MerchantCustomersTab merchantId={merchant.id} readOnly={!isOwner} />
				</Tabs.Panel>
				<Tabs.Panel id="cashouts" className="p-0">
					<MerchantCashoutsTab merchantId={merchant.id} readOnly={!isOwner} />
				</Tabs.Panel>
			</InternalTabs>

			<ConfirmationModal
				isOpen={activateModal}
				onOpenChange={setActivateModal}
				title="Ativar organização"
				description={`Tem certeza que deseja ativar a organização "${
					merchant.name ?? 'Sem nome'
				}"? Ela poderá processar transações novamente.`}
				status="success"
				confirmLabel="Ativar"
				isPending={isPending}
				onConfirm={handleActivate}
			/>

			<ConfirmationModal
				isOpen={suspendModal}
				onOpenChange={setSuspendModal}
				title="Suspender organização"
				description={`Tem certeza que deseja suspender a organização "${
					merchant.name ?? 'Sem nome'
				}"? Ela não poderá processar transações enquanto estiver suspensa.`}
				status="warning"
				requireReason
				reasonLabel="Motivo da suspensão"
				reasonPlaceholder="Digite o motivo da suspensão..."
				isPending={isPending}
				onConfirm={handleSuspend}
			/>

			<ConfirmationModal
				isOpen={inactivateModal}
				onOpenChange={setInactivateModal}
				title="Inativar organização"
				description={`Tem certeza que deseja inativar a organização "${
					merchant.name ?? 'Sem nome'
				}"? Esta ação é mais restritiva que a suspensão.`}
				status="danger"
				requireReason
				reasonLabel="Motivo da inativação"
				reasonPlaceholder="Digite o motivo da inativação..."
				isPending={isPending}
				onConfirm={handleInactivate}
			/>

			<SetAcquirerModal
				isOpen={setAcquirerModal}
				onOpenChange={setSetAcquirerModal}
				merchantId={merchant.id}
				merchantName={merchant.name}
				currentAcquirerId={merchant.acquirer?.id ?? null}
				currentAcquirerName={merchant.acquirer?.displayName ?? merchant.acquirer?.name ?? null}
				onSuccess={handleRefresh}
			/>
		</div>
	);
}
