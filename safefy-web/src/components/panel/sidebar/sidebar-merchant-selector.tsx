'use client';

import { useEffect, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button, Chip, Label, Modal, Spinner, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	AddCircleIcon,
	ArrowDown01Icon,
	ArrowReloadHorizontalIcon,
	Building02Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/sidebar-context';
import { useMerchant } from '@/contexts/merchant-context';
import { useEnvironment } from '@/contexts/environment-context';
import { AsyncButton } from '@/components/ui/async-button';
import { Routes } from '@/router/routes';
import { canMerchantOperate, isMerchantDraft, isMerchantSubmitted } from '@/utils/merchant-utils';
import { MerchantStatus, MerchantKycStatus } from '@/types/enums';
import { getMerchantDisplayParse, mapParseColorToChipColor } from '@/parse';
import { formatCurrency } from '@/utils/currency';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import type { MinimalMerchant } from '@/types/merchant/crud';
import { formatDocument } from '@/utils/document';

function getMerchantRedirectRoute(status: MerchantStatus, kycStatus: MerchantKycStatus): string {
	if (isMerchantDraft(status, kycStatus)) {
		return Routes.panel.merchant.onboarding;
	}

	if (canMerchantOperate(status, kycStatus)) {
		return Routes.panel.merchant.dashboard;
	}

	if (isMerchantSubmitted(status, kycStatus)) {
		return Routes.panel.merchant.review;
	}

	return Routes.panel.merchant.dashboard;
}

interface SidebarMerchantSelectorProps {
	forceFull?: boolean;
}

interface OrganizationOption {
	id: string;
	nome: string;
	statusLabel: string;
	statusColor: ReturnType<typeof getMerchantDisplayParse>['color'];
	documento: string;
	saldo: number;
	merchant?: MinimalMerchant;
}

const FALLBACK_ORGANIZATIONS: OrganizationOption[] = [
	{
		id: 'org_1',
		nome: 'Safefy Matriz',
		statusLabel: 'Aprovado',
		statusColor: 'success',
		documento: '12.345.678/0001-90',
		saldo: 128450,
	},
	{
		id: 'org_2',
		nome: 'Safefy Labs',
		statusLabel: 'Rascunho',
		statusColor: 'warning',
		documento: '98.765.432/0001-10',
		saldo: 0,
	},
	{
		id: 'org_3',
		nome: 'Safefy West',
		statusLabel: 'Rejeitado',
		statusColor: 'danger',
		documento: '123.456.789-10',
		saldo: 4500,
	},
];

interface MerchantTriggerContentProps {
	isCreatingNewMerchant: boolean;
	selectedOrganization: OrganizationOption | null;
	selectedStatusParse: ReturnType<typeof getMerchantDisplayParse> | null;
	isChangingOrganization: boolean;
	isSandboxVisible: boolean;
	isMobile: boolean;
}

function MerchantTriggerContent({
	isCreatingNewMerchant,
	selectedOrganization,
	selectedStatusParse,
	isChangingOrganization,
	isSandboxVisible,
	isMobile,
}: MerchantTriggerContentProps) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate text-sm font-medium leading-5 text-foreground">
					{isCreatingNewMerchant ? 'Nova organização' : selectedOrganization?.nome || 'Sem nome'}
				</span>
				<div className="mt-0.5 flex min-w-0 items-center gap-2">
					{isCreatingNewMerchant ? (
						<Chip variant="soft" size="sm" color="warning" className="shrink-0 px-1.5 text-xs">
							Criando
						</Chip>
					) : (
						selectedStatusParse &&
						!isChangingOrganization && (
							<Chip
								variant="soft"
								size="sm"
								color={mapParseColorToChipColor(selectedStatusParse.color)}
								className="max-w-full shrink-0 text-xs"
							>
								{selectedStatusParse.label}
							</Chip>
						)
					)}
				</div>
				<div className="mt-1 flex items-center gap-1.5">
					{isChangingOrganization ? (
						<>
							<Spinner size="sm" />
							<span className="text-xs text-muted">Alterando organização...</span>
						</>
					) : isCreatingNewMerchant ? (
						<span className="text-xs text-muted">Preencha os dados para criar sua organização.</span>
					) : (
						<>
							<Icon icon={Wallet01Icon} className="icon-xs text-accent" />
							{isSandboxVisible && <span className="text-xs font-medium text-warning">[SANDBOX]</span>}
							{!isMobile && (
								<span className={`text-xs ${isSandboxVisible ? 'text-warning' : 'text-muted'}`}>Saldo disponível</span>
							)}
							<AnimatedCurrency
								value={selectedOrganization?.saldo ?? 0}
								className={`text-xs font-medium ${isSandboxVisible ? 'text-warning' : 'text-foreground'}`}
							/>
						</>
					)}
				</div>
				{isMobile && !isChangingOrganization && !isCreatingNewMerchant && selectedOrganization?.documento && (
					<p className="truncate text-left text-xs text-muted">{selectedOrganization.documento}</p>
				)}
			</div>
		</div>
	);
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
	return (
		<div className="flex items-center justify-between border-b border-default bg-surface px-4 py-3">
			<div>
				<p className="text-sm font-semibold text-foreground">{title}</p>
			</div>
			<Button isIconOnly variant="ghost" onPress={onClose} className="text-foreground">
				<Icon icon={Cancel01Icon} className="icon-sm" />
			</Button>
		</div>
	);
}

function MobileDrawerSurface({
	title,
	isOpen,
	onClose,
	children,
	footer,
}: {
	title: string;
	subtitle: string;
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	footer: ReactNode;
}) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false}>
			<Modal.Container size="full" placement="center" scroll="outside">
				<Modal.Dialog className="h-screen w-screen max-w-none rounded-none bg-surface p-0">
					<Modal.Header className="hidden" />
					<div className="flex h-full flex-col">
						<DrawerHeader title={title} onClose={onClose} />
						<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
						{footer}
					</div>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

export function SidebarMerchantSelector({ forceFull = false }: SidebarMerchantSelectorProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { isExpanded, isMobile, isOpen, closeSidebar } = useSidebar();
	const { selectedMerchant, merchants, setSelectedMerchant, hasMerchants, refreshMerchantList } = useMerchant();
	const { isSandboxVisible } = useEnvironment();
	const [isOpenDrawer, setIsOpenDrawer] = useState(false);
	const [isRefreshing, startRefreshTransition] = useTransition();
	const [isChangingOrganization, startSelectMerchantTransition] = useTransition();
	const [isViewportMobile, setIsViewportMobile] = useState(false);
	const isCreatingNewMerchant = pathname === Routes.panel.merchant.new && !selectedMerchant?.id;
	const showFull = forceFull || (isMobile ? isOpen : isExpanded);
	const shouldUseMobileDrawer = forceFull || isMobile || isViewportMobile;

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const mediaQuery = window.matchMedia('(max-width: 1023px)');
		const update = () => setIsViewportMobile(mediaQuery.matches);
		update();

		mediaQuery.addEventListener('change', update);
		return () => mediaQuery.removeEventListener('change', update);
	}, []);

	const organizations: OrganizationOption[] =
		merchants.length > 0
			? merchants.map((merchant) => {
					const statusParse = getMerchantDisplayParse(
						merchant.status as MerchantStatus,
						merchant.kycStatus as MerchantKycStatus
					);

					return {
						id: merchant.id,
						nome: merchant.name || 'Sem nome',
						statusLabel: statusParse.label,
						statusColor: statusParse.color,
						documento: merchant.document ? formatDocument(merchant.document) : 'Documento não informado',
						saldo: merchant.availableBalance ?? 0,
						merchant,
					};
				})
			: FALLBACK_ORGANIZATIONS;

	const selectedOrganization =
		(selectedMerchant && organizations.find((organization) => organization.id === selectedMerchant.id)) ||
		organizations[0] ||
		null;

	const selectedStatusParse = selectedMerchant
		? getMerchantDisplayParse(
				selectedMerchant.status as MerchantStatus,
				selectedMerchant.kycStatus as MerchantKycStatus
			)
		: null;

	const renderInViewport = (node: ReactNode) => {
		if (typeof document === 'undefined') {
			return null;
		}

		return createPortal(node, document.body);
	};

	const closeDrawer = () => {
		setIsOpenDrawer(false);
	};

	const openDrawer = () => {
		if (shouldUseMobileDrawer) {
			setIsOpenDrawer(true);
			return;
		}

		window.requestAnimationFrame(() => {
			setIsOpenDrawer(true);
		});
	};

	const toggleDrawer = () => {
		if (isOpenDrawer) {
			closeDrawer();
			return;
		}

		openDrawer();
	};

	const handleCreateMerchant = () => {
		startSelectMerchantTransition(async () => {
			await setSelectedMerchant(null);
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('selected_merchant');
			}
			closeDrawer();
			closeSidebar();
			router.replace(Routes.panel.merchant.new);
			router.refresh();
		});
	};

	const handleRefreshMerchants = () => {
		startRefreshTransition(async () => {
			await refreshMerchantList(selectedMerchant?.id);
		});
	};

	const handleSelectOrganization = (organization: OrganizationOption) => {
		if (!organization.merchant) {
			closeDrawer();
			return;
		}

		startSelectMerchantTransition(async () => {
			const merchant = merchants.find((item) => item.id === organization.id);
			if (!merchant) {
				return;
			}

			await setSelectedMerchant(merchant);
			closeDrawer();
			closeSidebar();

			const redirectRoute = getMerchantRedirectRoute(
				merchant.status as MerchantStatus,
				merchant.kycStatus as MerchantKycStatus
			);

			if (redirectRoute === pathname) {
				router.refresh();
				return;
			}

			router.push(redirectRoute);
		});
	};

	const renderOrganizationRow = (organization: OrganizationOption) => {
		const isActive = selectedOrganization?.id === organization.id;
		const canSelect = Boolean(organization.merchant);

		return (
			<Button
				key={organization.id}
				variant="ghost"
				className={`h-auto w-full justify-start rounded-xl border p-3 text-left transition-colors ${
					isActive ? 'border-accent bg-accent-soft' : 'border-default bg-background hover:bg-accent-soft hover:border-accent'
				}`}
				onPress={() => handleSelectOrganization(organization)}
				isDisabled={isChangingOrganization || !canSelect}
			>
				<div className="flex w-full items-start gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
						<Icon icon={Building02Icon} className="icon-sm" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-2">
							<Label className="truncate text-sm font-medium text-foreground">{organization.nome}</Label>
							{isActive && <Icon icon={CheckmarkCircle02Icon} className="icon-sm shrink-0 text-accent" />}
						</div>
						<div className="mt-1 flex items-center gap-1.5">
							<Chip variant="soft" size="sm" color={mapParseColorToChipColor(organization.statusColor)}>
								{organization.statusLabel}
							</Chip>
							{!canSelect && <span className="text-[11px] text-muted">Exemplo</span>}
						</div>
						<p className="mt-1 truncate text-xs text-muted">{organization.documento}</p>
						<div className="mt-1 flex items-center gap-1.5">
							<Icon icon={Wallet01Icon} className="icon-xs text-accent" />
							<span className="text-xs font-medium text-foreground">{formatCurrency(organization.saldo)}</span>
						</div>
					</div>
				</div>
			</Button>
		);
	};

	const footerActions = (
		<div className="flex items-center gap-2 border-t border-default bg-surface px-3 py-3">
			<Button
				className="flex-1"
				size="sm"
				variant="primary"
				onPress={handleCreateMerchant}
				isDisabled={isChangingOrganization}
			>
				<Icon icon={AddCircleIcon} className="icon-sm" />
				Criar organização
			</Button>
			<Tooltip>
				<Tooltip.Trigger>
					<AsyncButton
						size="sm"
						variant="secondary"
						isIconOnly
						onPress={handleRefreshMerchants}
						isPending={isRefreshing}
					>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
					</AsyncButton>
				</Tooltip.Trigger>
				<Tooltip.Content>Atualizar lista de organizações</Tooltip.Content>
			</Tooltip>
		</div>
	);

	if (!hasMerchants) {
		return (
			<Button className="w-full" isIconOnly={!showFull} onPress={handleCreateMerchant} variant="primary">
				<Icon icon={AddCircleIcon} className="icon-md" />
				{showFull && <>Criar organização</>}
			</Button>
		);
	}

	if (!showFull) {
		return (
			<Button
				isIconOnly
				variant="ghost"
				className="mx-auto h-9 w-9 bg-background"
				onPress={toggleDrawer}
				isDisabled={isChangingOrganization}
			>
				<Icon icon={Building02Icon} className="icon-md" />
			</Button>
		);
	}

	const drawerList = (
		<div className="flex flex-col gap-2 px-3 py-3">
			{organizations.map((organization) => renderOrganizationRow(organization))}
		</div>
	);

	return (
		<div className="relative">
			<Button
				className="flex h-auto min-h-0 w-full cursor-pointer items-start justify-between gap-2 rounded-xl border border-default hover:border-accent bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
				variant="ghost"
				onPress={toggleDrawer}
				isDisabled={isChangingOrganization}
			>
				<MerchantTriggerContent
					isCreatingNewMerchant={isCreatingNewMerchant}
					selectedOrganization={selectedOrganization}
					selectedStatusParse={selectedStatusParse}
					isChangingOrganization={isChangingOrganization}
					isSandboxVisible={isSandboxVisible}
					isMobile={isMobile}
				/>
				<div className="flex shrink-0 items-center text-muted">
					<Icon icon={ArrowDown01Icon} className="icon-sm" />
				</div>
			</Button>

			<AnimatePresence>
				{isOpenDrawer &&
					(shouldUseMobileDrawer ? (
						<MobileDrawerSurface
							title="Trocar organização"
							subtitle="Escolha a organização que deseja gerenciar no painel."
							isOpen={isOpenDrawer}
							onClose={closeDrawer}
							footer={footerActions}
						>
							{drawerList}
						</MobileDrawerSurface>
					) : (
						renderInViewport(
							<>
								<motion.button
									type="button"
									className="fixed inset-0 z-80 bg-black/25 dark:bg-black/45"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={closeDrawer}
								/>
							</>
						)
					))}
			</AnimatePresence>

			<AnimatePresence>
				{isOpenDrawer && !shouldUseMobileDrawer && (
					<motion.div
						className="absolute left-full top-0 z-90 ml-2 w-80 overflow-hidden rounded-xl border border-default bg-surface shadow-2xl"
						initial={{ x: -24, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: -24, opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<DrawerHeader
							title="Trocar organização"
							onClose={closeDrawer}
						/>
						<div className="max-h-[52vh] overflow-y-auto">{drawerList}</div>
						{footerActions}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
