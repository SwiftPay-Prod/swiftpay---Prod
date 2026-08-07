'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Separator, Alert, Tabs } from '@heroui/react';
import { toast } from '@heroui/react';
import {
	ArrowLeft01Icon,
	Building02Icon,
	Calendar03Icon,
	ComputerIcon,
	Shield01Icon,
	UserIcon,
	UserGroupIcon,
	Settings02Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { SystemAccordion } from '@/components/ui/system-accordion';
import type { AdminUserDetails } from '@/types/admin/users';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import type { UserReferralsData } from '@/types/user/referrals';
import { UserRole, UserStatus } from '@/types/enums';
import { userRoleParse, userStatusParse, mapParseColorToChipColor, emailVerifiedParse } from '@/parse';
import { formatDate, formatRelativeTime } from '@/utils/datetime';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { UserChangeRoleModal } from '@/components/admin/user-change-role-modal';
import { adminSuspendUser, adminInactivateUser, adminActivateUser, adminUpdateUserWayneProtocolAccess } from '@/app/actions/admin/users';
import { formatCurrency } from '@/utils/currency';
import { UserActionsDropdown } from '@/components/admin/user-actions-dropdown';
import { Routes } from '@/router/routes';
import { EmailLink, DocumentDisplay, PhoneLink } from '@/components/ui/data-links';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { ReferralSettingsTab } from './tabs/referral-settings-tab';
import { ReferralsContent } from '@/app/panel/(main)/referrals/referrals-content';
import { adminGetReferredUserMovements } from '@/app/actions/admin/users';

interface UserDetailsProps {
	user: AdminUserDetails;
	platformSettings: AdminPlatformSettingsData;
	userReferralsData: UserReferralsData | null;
	initialTab?: 'general' | 'settings' | 'features' | 'referrals';
	currentUserRole: UserRole;
	currentUserId: string;
}

const ONBOARDING_OPTION_LABELS: Record<string, string> = {
	google: 'Google / Busca',
	instagram: 'Instagram',
	tiktok: 'TikTok',
	youtube: 'YouTube',
	facebook: 'Facebook',
	indicacao: 'Indicação de amigos',
	evento: 'Evento ou workshop',
	loja_virtual: 'Loja virtual própria',
	whatsapp: 'WhatsApp',
	marketplace: 'Marketplace',
	site: 'Site institucional',
	trafego_pago: 'Tráfego pago',
	aumentar_conversao: 'Aumentar taxa de conversão',
	escalar_faturamento: 'Escalar faturamento',
	automatizar_cobranca: 'Automatizar cobranças',
	melhorar_aprovacao: 'Melhorar aprovação de pagamentos',
	outros: 'Outro',
};

function parseOnboardingLabel(optionId: string): string {
	return ONBOARDING_OPTION_LABELS[optionId] ?? optionId;
}

function useAdminUserAction() {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const run = async (action: () => Promise<unknown>, options: { successTitle: string; successDescription: string; errorPrefix: string }) => {
		startTransition(async () => {
			const response = await action();
			const error = (response as { error?: { message?: string } | null } | undefined)?.error;
			if (error) {
				toast(`Erro ao ${options.errorPrefix}`, {
					description: error?.message || 'Erro desconhecido',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}
			toast(options.successTitle, {
				description: options.successDescription,
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			router.refresh();
		});
	};

	return { isPending, run };
}

export function UserDetails({
	user,
	platformSettings,
	userReferralsData,
	initialTab = 'general',
	currentUserRole,
	currentUserId,
}: UserDetailsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isWaynePending, startWayneTransition] = useTransition();
	const [selectedTab, setSelectedTab] = useState<string>(initialTab);
	const [activateModal, setActivateModal] = useState<boolean>(false);
	const [suspendModal, setSuspendModal] = useState<boolean>(false);
	const [inactivateModal, setInactivateModal] = useState<boolean>(false);
	const [roleModal, setRoleModal] = useState<boolean>(false);

	const adminUserAction = useAdminUserAction();

	const roleParse = userRoleParse[user.role];
	const statusParse = userStatusParse[user.status];
	const emailParse = emailVerifiedParse[user.emailVerified ? 'verified' : 'pending'];
	const displayUserName = user.name?.trim() || 'Sem nome';
	const lastAccessSummary = user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Sem acesso registrado';

	const tabItems: InternalTabItem[] = [
		{ id: 'general', label: 'Geral', icon: <Icon icon={UserIcon} className="icon-sm" /> },
		{ id: 'settings', label: 'Configurações', icon: <Icon icon={Settings02Icon} className="icon-sm" /> },
		...(currentUserRole === UserRole.God
			? [{ id: 'features', label: 'Funcionalidades', icon: <Icon icon={UserIcon} className="icon-sm" /> }]
			: []),
		{ id: 'referrals', label: 'Indicados', icon: <Icon icon={UserGroupIcon} className="icon-sm" /> },
	];

	function handleSuspend(reason?: string) {
		if (!reason) return;
		adminUserAction.run(
			() => adminSuspendUser(user.id, reason),
			{
				successTitle: 'Usuário suspenso',
				successDescription: 'O usuário foi suspenso com sucesso.',
				errorPrefix: 'suspender usuário',
			}
		);
		setSuspendModal(false);
	}

	function handleInactivate(reason?: string) {
		if (!reason) return;
		adminUserAction.run(
			() => adminInactivateUser(user.id, reason),
			{
				successTitle: 'Usuário inativado',
				successDescription: 'O usuário foi inativado com sucesso.',
				errorPrefix: 'inativar usuário',
			}
		);
		setInactivateModal(false);
	}

	function handleActivate() {
		adminUserAction.run(
			() => adminActivateUser(user.id),
			{
				successTitle: 'Usuário ativado',
				successDescription: 'O usuário foi ativado com sucesso.',
				errorPrefix: 'ativar usuário',
			}
		);
		setActivateModal(false);
	}

	function handleWayneProtocolAccess(enabled: boolean) {
		adminUserAction.run(
			() => adminUpdateUserWayneProtocolAccess(user.id, enabled),
			{
				successTitle: enabled ? 'Protocolo Wayne habilitado' : 'Protocolo Wayne desabilitado',
				successDescription: enabled
					? 'O usuário agora pode visualizar e configurar o Protocolo Wayne.'
					: 'O acesso ao Protocolo Wayne foi removido.',
				errorPrefix: 'atualizar acesso ao Protocolo Wayne',
			}
		);
	}

	function renderOnboardingSelection(items: string[], fallback: string) {
		if (items.length === 0) {
			return <span className="text-sm text-muted">{fallback}</span>;
		}

		return (
			<div className="flex flex-wrap gap-2">
				{items.map((item) => (
					<Chip key={item} variant="soft" size="sm" color="accent">
						{parseOnboardingLabel(item)}
					</Chip>
				))}
			</div>
		);
	}

	function buildOrganizationsSummary(totalMerchants: number): string {
		if (totalMerchants === 0) {
			return 'Nenhuma organização vinculada';
		}

		if (totalMerchants === 1) {
			return '1 organização vinculada';
		}

		return `${totalMerchants} organizações vinculadas`;
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-start md:flex-row md:items-center justify-between">
				<div className="flex items-center gap-4">
					<Button isIconOnly variant="tertiary" onPress={() => router.push(Routes.panel.admin.users)}>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{displayUserName}</h1>
						<p className="text-foreground-500">{user.email}</p>
					</div>
				</div>

				<div className="flex mt-4 md:mt-0 flex-row items-center gap-2">
					<UserActionsDropdown
						user={user}
						currentUserRole={currentUserRole}
						currentUserId={currentUserId}
						isPending={isPending}
						onActivate={() => setActivateModal(true)}
						onSuspend={() => setSuspendModal(true)}
						onInactivate={() => setInactivateModal(true)}
						onChangeRole={() => setRoleModal(true)}
					/>
				</div>
			</div>

			{user.status === UserStatus.Suspended && user.suspendedReason && (
				<Alert status="warning">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Usuário suspenso</Alert.Title>
						<Alert.Description>Motivo: {user.suspendedReason}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			{user.status === UserStatus.Inactive && user.inactiveReason && (
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Usuário inativo</Alert.Title>
						<Alert.Description>Motivo: {user.inactiveReason}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<InternalTabs
				ariaLabel="Abas de detalhes do usuário"
				items={tabItems}
				selectedKey={selectedTab}
				onSelectionChange={(key) => setSelectedTab(key as string)}
			>
				<Tabs.Panel id="general" className="min-w-0 p-0">
					<div className="flex flex-col gap-4">
						<SystemAccordion
							id="user-overview"
							icon={UserIcon}
							color="accent"
							title="Informações do usuário"
							summary={`${displayUserName} | ${roleParse.label} | ${statusParse.label}`}
							defaultExpanded
						>
							<div className="flex flex-col gap-4">
								<div className="flex justify-between">
									<span className="text-foreground">Nome</span>
									<span className="font-semibold text-foreground">{displayUserName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">E-mail</span>
									<EmailLink email={user.email} className="font-medium" />
								</div>
								<div className="flex justify-between">
									<span className="text-muted">WhatsApp</span>
									<PhoneLink phone={user.whatsApp} className="font-medium" />
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted">E-mail verificado</span>
									<Chip variant="soft" size="sm" color={mapParseColorToChipColor(emailParse.color)}>
										{emailParse.label}
									</Chip>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted">Cargo</span>
									<Chip variant="soft" size="sm" color={mapParseColorToChipColor(roleParse.color)}>
										{roleParse.label}
									</Chip>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted">Status</span>
									<Chip variant="soft" size="sm" color={mapParseColorToChipColor(statusParse.color)}>
										{statusParse.label}
									</Chip>
								</div>
								<Separator />
								<div className="flex flex-col gap-4">
									<div className="flex items-center justify-between">
										<span className="text-foreground font-medium">Onboarding</span>
										<Chip variant="soft" size="sm" color={user.onboarding.completed ? 'success' : 'warning'}>
											{user.onboarding.completed ? 'Concluído' : 'Pendente'}
										</Chip>
									</div>
									<div className="flex justify-between">
										<span className="text-muted">Concluído em</span>
										<span className="font-medium">{user.onboarding.completedAt ? formatDate(user.onboarding.completedAt) : '-'}</span>
									</div>
									<div className="flex flex-col gap-2">
										<span className="text-sm font-medium text-foreground">Como nos encontrou?</span>
										{renderOnboardingSelection(user.onboarding.discovery, 'Sem respostas cadastradas')}
										{user.onboarding.discoveryOther && (
											<span className="text-sm text-muted">Outros: {user.onboarding.discoveryOther}</span>
										)}
									</div>
									<div className="flex flex-col gap-2">
										<span className="text-sm font-medium text-foreground">Canal de vendas</span>
										{renderOnboardingSelection(user.onboarding.channels, 'Sem respostas cadastradas')}
										{user.onboarding.channelsOther && (
											<span className="text-sm text-muted">Outros: {user.onboarding.channelsOther}</span>
										)}
									</div>
									<div className="flex flex-col gap-2">
										<span className="text-sm font-medium text-foreground">Objetivos</span>
										{renderOnboardingSelection(user.onboarding.goals, 'Sem respostas cadastradas')}
									</div>
								</div>
							</div>
						</SystemAccordion>

						<SystemAccordion
							id="user-security"
							icon={Shield01Icon}
							color="warning"
							title="Segurança"
							summary={`2FA ${user.twoFactorEnabled ? 'habilitado' : 'desabilitado'} | Conta ${
								user.isLockedOut ? 'bloqueada' : 'normal'
							}`}
							defaultExpanded
						>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between">
									<span className="text-muted">2FA habilitado</span>
									<Chip variant="soft" size="sm" color={user.twoFactorEnabled ? 'success' : 'default'}>
										{user.twoFactorEnabled ? 'Habilitado' : 'Desabilitado'}
									</Chip>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted">Conta bloqueada</span>
									<Chip variant="soft" size="sm" color={user.isLockedOut ? 'danger' : 'success'}>
										{user.isLockedOut ? 'Bloqueada' : 'Normal'}
									</Chip>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Tentativas de login falhas</span>
									<span className="font-medium">{user.failedLoginAttempts}</span>
								</div>
								{user.lockedOutAt && (
									<div className="flex justify-between">
										<span className="text-muted">Bloqueada em</span>
										<span className="font-medium">{formatDate(user.lockedOutAt)}</span>
									</div>
								)}
								{user.passwordChangedAt && (
									<div className="flex justify-between">
										<span className="text-muted">Senha alterada em</span>
										<span className="font-medium">{formatDate(user.passwordChangedAt)}</span>
									</div>
								)}
							</div>
						</SystemAccordion>

						<SystemAccordion
							id="user-last-access"
							icon={ComputerIcon}
							color="blue"
							title="Último acesso"
							summary={lastAccessSummary}
						>
							<div className="flex flex-col gap-4">
								<div className="flex justify-between">
									<span className="text-muted">Data e hora</span>
									<span className="font-medium">
										{user.lastLoginAt ? (
											<span title={formatDate(user.lastLoginAt)}>{formatRelativeTime(user.lastLoginAt)}</span>
										) : (
											'—'
										)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Endereço IP</span>
									<span className="font-medium">{user.lastLoginIpAddress ?? '—'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Localização</span>
									<span className="font-medium">{user.lastLoginLocation ?? '—'}</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-muted">User Agent</span>
									<span className="text-sm text-muted break-all">{user.lastLoginUserAgent ?? '—'}</span>
								</div>
							</div>
						</SystemAccordion>

						<SystemAccordion
							id="user-dates"
							icon={Calendar03Icon}
							color="slate"
							title="Datas"
							summary={`Criado em ${formatDate(user.createdAt)}`}
						>
							<div className="flex flex-col gap-4">
								<div className="flex justify-between">
									<span className="text-muted">Criado em</span>
									<span className="font-medium">{formatDate(user.createdAt)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">Atualizado em</span>
									<span className="font-medium">{formatDate(user.updatedAt)}</span>
								</div>
							</div>
						</SystemAccordion>

						<SystemAccordion
							id="user-organizations"
							icon={Building02Icon}
							color="success"
							title={`Organizações (${user.merchants.length})`}
							summary={buildOrganizationsSummary(user.merchants.length)}
						>
							{user.merchants.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 text-muted">
									<Icon icon={Building02Icon} className="icon-2xl" />
									<p className="mt-2">Nenhuma organização vinculada</p>
								</div>
							) : (
								<div className="flex flex-col gap-3">
									<div className="grid grid-cols-3 gap-4 border-b border-border pb-2 text-sm font-medium text-muted">
										<span>Nome fantasia</span>
										<span>Documento</span>
										<span>Faturamento total</span>
									</div>
									{user.merchants.map((merchant) => (
										<div key={merchant.id} className="grid grid-cols-3 gap-4 text-sm">
											<AdminMerchantLink
												merchantId={merchant.id}
												name={merchant.name}
												className="font-medium text-accent hover:underline"
											/>
											<DocumentDisplay document={merchant.document} fallback="Documento não informado" />
											<span>{formatCurrency(merchant.totalRevenue)}</span>
										</div>
									))}
								</div>
							)}
						</SystemAccordion>
					</div>
				</Tabs.Panel>

				<Tabs.Panel id="settings" className="min-w-0 p-0">
					<ReferralSettingsTab
						userId={user.id}
						initialReferralDurationMonths={user.referralDurationMonths}
						initialReferralCommissionPercentage={user.referralCommissionPercentage}
						initialReferralCommissionWithdrawalIntervalValue={user.referralCommissionWithdrawalIntervalValue}
						initialReferralCommissionWithdrawalIntervalUnit={user.referralCommissionWithdrawalIntervalUnit}
						initialReferralCommissionMinWithdrawalAmount={user.referralCommissionMinWithdrawalAmount}
						initialReferralCommissionWithdrawalFeeFixed={user.referralCommissionWithdrawalFeeFixed}
						initialUpdatedAt={user.updatedAt}
						platformSettings={platformSettings}
						onSaved={() => router.refresh()}
					/>
				</Tabs.Panel>
				<Tabs.Panel id="features" className="min-w-0 p-0">
					<Card>
						<Card.Header>
							<div className="flex items-center gap-2">
								<Icon icon={UserIcon} className="icon-md text-accent" />
								<Card.Title>Funcionalidades</Card.Title>
							</div>
						</Card.Header>
						<Separator />
						<Card.Content className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-1">
									<span className="font-medium text-sm">Protocolo Wayne</span>
									<span className="text-xs text-muted">
										Permite que o usuário visualize e configure os ajustes do Protocolo Wayne.
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Chip variant="soft" size="sm" color={user.hasWayneProtocolAccess ? 'success' : 'default'}>
										{user.hasWayneProtocolAccess ? 'Habilitado' : 'Desabilitado'}
									</Chip>
									<Button
										size="sm"
										variant="tertiary"
										isPending={isWaynePending}
										onPress={() => handleWayneProtocolAccess(!user.hasWayneProtocolAccess)}
									>
										{user.hasWayneProtocolAccess ? 'Desabilitar' : 'Habilitar'}
									</Button>
								</div>
							</div>
						</Card.Content>
					</Card>
				</Tabs.Panel>
				<Tabs.Panel id="referrals" className="min-w-0 p-0">
					{userReferralsData && (
						<ReferralsContent
							data={userReferralsData}
							showHeaderActions={false}
							title="Indicados"
							description="Visualização administrativa das indicações e comissões deste usuário."
							onFetchReferredUserMovements={(referredUserId, page, pageSize) =>
								adminGetReferredUserMovements(user.id, referredUserId, page, pageSize)
							}
						/>
					)}
				</Tabs.Panel>
			</InternalTabs>

			<ConfirmationModal
				isOpen={activateModal}
				onOpenChange={setActivateModal}
				description={`Tem certeza que deseja ativar o usuário "${
					user.name ?? user.email
				}"? Ele poderá acessar a plataforma novamente.`}
				title='Ativar usuário'
				status="success"
				confirmLabel="Ativar"
				isPending={isPending}
				onConfirm={handleActivate}
			/>

			<ConfirmationModal
				isOpen={suspendModal}
				onOpenChange={setSuspendModal}
				title="Suspender usuário"
				description={`Tem certeza que deseja suspender o usuário "${
					user.name ?? user.email
				}"? Ele não poderá acessar a plataforma enquanto estiver suspenso.`}
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
				title="Inativar usuário"
				description={`Tem certeza que deseja inativar o usuário "${
					user.name ?? user.email
				}"? Esta ação é mais restritiva que a suspensão.`}
				status="danger"
				requireReason
				reasonLabel="Motivo da inativação"
				reasonPlaceholder="Digite o motivo da inativação..."
				isPending={isPending}
				onConfirm={handleInactivate}
			/>

			<UserChangeRoleModal
				isOpen={roleModal}
				onOpenChange={setRoleModal}
				user={user}
				currentUserRole={currentUserRole}
			/>
		</div>
	);
}
