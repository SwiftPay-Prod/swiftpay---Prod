'use client';

import { useRouter } from 'next/navigation';
import { Accordion, Switch, ListBox, Header, Label, Description, Separator, Popover, Button } from '@heroui/react';
import { AvatarUser } from '@/components/ui/avatar-user';
import type { Key } from '@react-types/shared';
import { Icon } from '@/components/ui/icon';
import {
	ArrowDown01Icon,
	SecurityLockIcon,
	Settings05Icon,
	StarAward02Icon,
	Target02Icon,
	UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { useSidebar } from '@/contexts/sidebar-context';
import { useMerchant } from '@/contexts/merchant-context';
import { useUser } from '@/contexts/user-context';
import { UserMetaCard } from '@/components/panel/header/user-meta-card';
import type { MerchantLevel } from '@/types/merchant/achievements';
import { Routes } from '@/router/routes';
import { useEnvironment } from '@/contexts/environment-context';
import { isMerchantApproved } from '@/utils/merchant-utils';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';

interface SidebarUserInfoProps {
	forceFull?: boolean;
}

export function SidebarUserInfo({ forceFull = false }: SidebarUserInfoProps) {
	const router = useRouter();
	const { isExpanded, isMobile, isOpen, closeSidebar } = useSidebar();
	const { selectedMerchant, levelInfo } = useMerchant();
	const { user } = useUser();
	const showFull = forceFull || (isMobile ? isOpen : isExpanded);
	const { isSandbox, toggleEnvironment, isChangingEnvironment } = useEnvironment();
	const { isVisible: isBalanceVisible } = useBalanceVisibility();

	const showEnvironmentSwitch =
		selectedMerchant && isMerchantApproved(selectedMerchant.status, selectedMerchant.kycStatus);

	const navigateTo = (path: string) => {
		if (isMobile) {
			closeSidebar();
		}
		router.push(path);
	};

	const handleSecurity = () => {
		navigateTo(Routes.panel.security);
	};

	const handleSettings = () => {
		navigateTo(Routes.panel.userSettings);
	};

	const handleReferrals = () => {
		navigateTo(Routes.panel.referrals);
	};

	function handleUserMenuAction(key: Key) {
		switch (String(key)) {
			case 'profile':
				navigateTo(Routes.panel.profile);
				break;
			case 'referrals':
				handleReferrals();
				break;
			case 'security':
				handleSecurity();
				break;
			case 'achievements':
				navigateTo(Routes.panel.achievements);
				break;
			case 'settings':
				handleSettings();
				break;
			case 'apienvironment':
				toggleEnvironment();
				break;
			default:
				break;
		}
	}

	const userTrigger = (
		<div className="flex items-center gap-3 min-w-0 flex-1">
			<AvatarUser
				name={user.name}
				profileImageUrl={user.profileImageUrl}
				borderImageUrl={user.selectedBorderImageUrl}
				size="sm"
			/>
			{showFull && (
				<div className="flex flex-col min-w-0 flex-1 justify-start items-start overflow-hidden">
					<span className="text-sm font-medium truncate w-full">{user.name ?? 'Usuário'}</span>
					<span className="text-xs text-default-400 truncate w-full">{user.email}</span>
				</div>
			)}
		</div>
	);

	const userActions = (
		<ListBox aria-label="User Actions" className="w-full" onAction={handleUserMenuAction}>
			<ListBox.Section>
				<Header>Conta</Header>
				<ListBox.Item key="profile" id="profile" textValue="Perfil">
					<Icon icon={UserCircleIcon} className="icon-md" />
					<div className="flex flex-col">
						<Label>Perfil</Label>
						<Description>Edite suas informações pessoais</Description>
					</div>
				</ListBox.Item>
				<ListBox.Item key="achievements" id="achievements" textValue="Conquistas">
					<Icon icon={StarAward02Icon} className="icon-md" />
					<div className="flex flex-col">
						<Label>Conquistas</Label>
						<Description>Seus emblemas e dinastias</Description>
					</div>
				</ListBox.Item>
				<ListBox.Item key="referrals" id="referrals" textValue="Indique e Ganhe">
					<Icon icon={Target02Icon} className="icon-md" />
					<div className="flex flex-col">
						<Label>Indique e Ganhe</Label>
						<Description>Compartilhe seu link de indicação</Description>
					</div>
				</ListBox.Item>
				<ListBox.Item key="security" id="security" textValue="Segurança">
					<Icon icon={SecurityLockIcon} className="icon-md" />
					<div className="flex flex-col">
						<Label>Segurança</Label>
						<Description>Gerencie sua segurança</Description>
					</div>
				</ListBox.Item>
				<ListBox.Item key="settings" id="settings" textValue="Configurações">
					<Icon icon={Settings05Icon} className="icon-md" />
					<div className="flex flex-col">
						<Label>Ajustes</Label>
						<Description>Preferências pessoais</Description>
					</div>
				</ListBox.Item>
			</ListBox.Section>
			{showEnvironmentSwitch && (
				<>
					<Separator />
					<ListBox.Section>
						<ListBox.Item
							key="apienvironment"
							id="apienvironment"
							textValue="Ambiente"
							isDisabled={isChangingEnvironment}
						>
							<Switch isSelected={isSandbox} isDisabled={isChangingEnvironment}>
								<Switch.Control className={isSandbox ? 'bg-warning' : ''}>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
							<div className="flex flex-col">
								<Label>{isSandbox ? 'Sandbox' : 'Produção'}</Label>
								<Description>{isChangingEnvironment ? 'Alterando...' : 'Alterar ambiente'}</Description>
							</div>
						</ListBox.Item>
					</ListBox.Section>
				</>
			)}
		</ListBox>
	);

	if (!showFull) {
		return (
			<div className="flex justify-center py-2">
				<Popover>
					<Popover.Trigger>
						<Button variant="ghost" isIconOnly className="h-9 w-9" aria-label="Menu do usuário">
							<AvatarUser
								name={user.name}
								profileImageUrl={user.profileImageUrl}
								borderImageUrl={user.selectedBorderImageUrl}
								size="sm"
							/>
						</Button>
					</Popover.Trigger>
					<Popover.Content placement="right" className="w-72">
						<Popover.Dialog>{userActions}</Popover.Dialog>
					</Popover.Content>
				</Popover>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{isMobile && levelInfo && (
				<UserMetaCard
					level={levelInfo.current as MerchantLevel}
					progress={levelInfo.progress}
					displayName={levelInfo.currentDisplayName}
					nextLevelDisplayName={levelInfo.nextLevelDisplayName}
					totalVolume={levelInfo.totalVolume}
					maxThreshold={levelInfo.maxThreshold}
					isBalanceVisible={isBalanceVisible}
					size="sidebar"
				/>
			)}
			<Accordion hideSeparator className="px-0">
				<Accordion.Item id="user-menu">
					<Accordion.Heading>
						<Accordion.Trigger className="flex items-center gap-2 w-full hover:bg-surface-secondary rounded-lg p-2 transition-colors">
							{userTrigger}
							<Accordion.Indicator>
								<Icon icon={ArrowDown01Icon} className="icon-sm text-muted shrink-0" />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>{userActions}</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</div>
	);
}
