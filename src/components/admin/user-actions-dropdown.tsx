'use client';

import { Button, Dropdown, Label } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	CancelCircleIcon,
	MenuTwoLineIcon,
	PencilEdit01Icon,
	PlayCircleIcon,
	RemoveCircleIcon,
	Target02Icon,
	ChampionIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';
import type { AdminUserDetails, AdminMinimalUser } from '@/types/admin/users';
import { UserRole, UserStatus } from '@/types/enums';

interface UserActionsDropdownProps {
	user: AdminUserDetails | AdminMinimalUser;
	currentUserRole: UserRole;
	currentUserId: string;
	isPending?: boolean;
	onlyIcon?: boolean;
	onActivate: () => void;
	onSuspend: () => void;
	onInactivate: () => void;
	onChangeRole: () => void;
	onAssignReferrer?: () => void;
	onViewReferralMovements?: () => void;
	onSuspendFromRanking?: () => void;
}

function canModifyUserStatus(
	currentUserRole: UserRole,
	currentUserId: string,
	targetUserRole: UserRole,
	targetUserId: string
): boolean {
	if (currentUserId === targetUserId) {
		return false;
	}

	const roleLevels: Record<UserRole, number> = {
		[UserRole.God]: 0,
		[UserRole.Admin]: 1,
		[UserRole.Merchant]: 2,
		[UserRole.Support]: 3,
	};

	const currentLevel = roleLevels[currentUserRole];
	const targetLevel = roleLevels[targetUserRole];

	return currentLevel < targetLevel;
}

function canChangeUserRole(
	currentUserRole: UserRole,
	currentUserId: string,
	targetUserRole: UserRole,
	targetUserId: string
): boolean {
	if (currentUserId === targetUserId) {
		return false;
	}

	const roleLevels: Record<UserRole, number> = {
		[UserRole.God]: 0,
		[UserRole.Admin]: 1,
		[UserRole.Merchant]: 2,
		[UserRole.Support]: 3,
	};

	const currentLevel = roleLevels[currentUserRole];
	const targetLevel = roleLevels[targetUserRole];

	return currentLevel < targetLevel;
}

function getActionDisabledReason(
	currentUserRole: UserRole,
	currentUserId: string,
	targetUserRole: UserRole,
	targetUserId: string,
	action: 'modify' | 'changeRole'
): string | null {
	if (currentUserId === targetUserId) {
		return 'Você não pode alterar a si mesmo';
	}

	const roleLevels: Record<UserRole, number> = {
		[UserRole.God]: 0,
		[UserRole.Admin]: 1,
		[UserRole.Merchant]: 2,
		[UserRole.Support]: 3,
	};

	const currentLevel = roleLevels[currentUserRole];
	const targetLevel = roleLevels[targetUserRole];

	if (currentLevel >= targetLevel) {
		if (action === 'modify') {
			return 'Você não tem permissão para alterar este usuário';
		} else {
			return 'Você não tem permissão para alterar o cargo deste usuário';
		}
	}

	return null;
}

export function UserActionButtons({
	user,
	currentUserRole,
	currentUserId,
	isPending = false,
	onActivate,
	onSuspend,
	onInactivate,
	onChangeRole,
	onAssignReferrer,
	onViewReferralMovements,
	onSuspendFromRanking,
}: Omit<UserActionsDropdownProps, 'onlyIcon'>) {
	const roleAvailableShowActions = [UserRole.God, UserRole.Admin];
	if (!roleAvailableShowActions.includes(currentUserRole)) {
		return null;
	}

	const canModifyStatus = canModifyUserStatus(currentUserRole, currentUserId, user.role, user.id);
	const canChangeRole = canChangeUserRole(currentUserRole, currentUserId, user.role, user.id);

	return (
		<>
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={!canChangeRole || isPending}
				onPress={onChangeRole}
			>
				<Icon icon={PencilEdit01Icon} className="icon-sm" />
				Alterar cargo
			</Button>
			{onAssignReferrer && (
				<Button
					variant="secondary"
					className="w-full justify-start"
					isDisabled={!canModifyStatus || isPending}
					onPress={onAssignReferrer}
				>
					<Icon icon={Target02Icon} className="icon-sm text-accent" />
					Vincular gerente de contas
				</Button>
			)}
			{onViewReferralMovements && (
				<Button
					variant="secondary"
					className="w-full justify-start"
					isDisabled={isPending}
					onPress={onViewReferralMovements}
				>
					<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
					Ver movimentações
				</Button>
			)}
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={user.status === UserStatus.Active || !canModifyStatus || isPending}
				onPress={onActivate}
			>
				<Icon icon={PlayCircleIcon} className="icon-sm text-success" />
				Ativar
			</Button>
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={user.status !== UserStatus.Active || !canModifyStatus || isPending}
				onPress={onSuspend}
			>
				<Icon icon={CancelCircleIcon} className="icon-sm text-warning" />
				Suspender
			</Button>
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={user.status !== UserStatus.Active || !canModifyStatus || isPending}
				onPress={onInactivate}
			>
				<Icon icon={RemoveCircleIcon} className="icon-sm text-danger" />
				Inativar
			</Button>
			{onSuspendFromRanking && (
				<Button
					variant="secondary"
					className="w-full justify-start"
					isDisabled={!canModifyStatus || isPending}
					onPress={onSuspendFromRanking}
				>
					<Icon icon={ChampionIcon} className="icon-sm text-warning" />
					Suspender do ranking
				</Button>
			)}
		</>
	);
}

export function UserActionsDropdown({
	user,
	currentUserRole,
	currentUserId,
	isPending = false,
	onlyIcon = false,
	onActivate,
	onSuspend,
	onInactivate,
	onChangeRole,
	onAssignReferrer,
	onViewReferralMovements,
	onSuspendFromRanking,
}: UserActionsDropdownProps) {
	const canModifyStatus = canModifyUserStatus(currentUserRole, currentUserId, user.role, user.id);
	const canChangeRole = canChangeUserRole(currentUserRole, currentUserId, user.role, user.id);
	const modifyStatusReason = getActionDisabledReason(currentUserRole, currentUserId, user.role, user.id, 'modify');
	const changeRoleReason = getActionDisabledReason(currentUserRole, currentUserId, user.role, user.id, 'changeRole');
    const roleAvailableShowActions = [UserRole.God, UserRole.Admin];
    if (!roleAvailableShowActions.includes(currentUserRole)) {
        return null;
    }

	return (
		<Dropdown>
			<Button variant="tertiary" size="sm" isIconOnly={onlyIcon} isDisabled={isPending}>
				<Icon icon={MenuTwoLineIcon} className="icon-md" />
				{!onlyIcon && <span>Ações</span>}
			</Button>
			<Dropdown.Popover>
				<Dropdown.Menu
					onAction={(key) => {
						if (key === 'change-role') {
							openWithDelay(onChangeRole, DEFAULT_MODAL_DELAY);
						} else if (key === 'activate') {
							openWithDelay(onActivate, DEFAULT_MODAL_DELAY);
						} else if (key === 'suspend') {
							openWithDelay(onSuspend, DEFAULT_MODAL_DELAY);
						} else if (key === 'inactivate') {
							openWithDelay(onInactivate, DEFAULT_MODAL_DELAY);
						} else if (key === 'assign-referrer' && onAssignReferrer) {
							openWithDelay(onAssignReferrer, DEFAULT_MODAL_DELAY);
						} else if (key === 'view-referral-movements' && onViewReferralMovements) {
							openWithDelay(onViewReferralMovements, DEFAULT_MODAL_DELAY);
						} else if (key === 'suspend-from-ranking' && onSuspendFromRanking) {
							openWithDelay(onSuspendFromRanking, DEFAULT_MODAL_DELAY);
						}
					}}
				>
					<Dropdown.Item key="change-role" id="change-role" textValue="Alterar cargo" isDisabled={!canChangeRole}>
						<Icon icon={PencilEdit01Icon} className="icon-sm" />
						<div className="flex flex-col">
							<Label>Alterar cargo</Label>
							{!canChangeRole && <span className="text-xs text-muted">{changeRoleReason}</span>}
						</div>
					</Dropdown.Item>

					{onAssignReferrer && (
						<Dropdown.Item key="assign-referrer" id="assign-referrer" textValue="Vincular gerente de contas" isDisabled={!canModifyStatus}>
							<Icon icon={Target02Icon} className="icon-sm text-accent" />
							<div className="flex flex-col">
								<Label className="text-accent">Vincular gerente de contas</Label>
								{!canModifyStatus && <span className="text-xs text-muted">{modifyStatusReason}</span>}
							</div>
						</Dropdown.Item>
					)}

					{onViewReferralMovements && (
						<Dropdown.Item key="view-referral-movements" id="view-referral-movements" textValue="Ver movimentações">
							<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
							<div className="flex flex-col">
								<Label className="text-accent">Ver movimentações</Label>
							</div>
						</Dropdown.Item>
					)}

					<>
						<Dropdown.Item
							key="activate"
							id="activate"
							textValue="Ativar"
							isDisabled={user.status === UserStatus.Active || !canModifyStatus}
						>
							<Icon icon={PlayCircleIcon} className="icon-sm text-success" />
							<div className="flex flex-col">
								<Label className="text-success">Ativar</Label>
								{(user.status === UserStatus.Active || !canModifyStatus) && (
									<span className="text-xs text-muted">
										{user.status === UserStatus.Active ? 'Usuário já está ativo' : modifyStatusReason}
									</span>
								)}
							</div>
						</Dropdown.Item>
						<Dropdown.Item
							key="suspend"
							id="suspend"
							textValue="Suspender"
							isDisabled={user.status !== UserStatus.Active || !canModifyStatus}
						>
							<Icon icon={CancelCircleIcon} className="icon-sm text-warning" />
							<div className="flex flex-col">
								<Label className="text-warning">Suspender</Label>
								{(user.status !== UserStatus.Active || !canModifyStatus) && (
									<span className="text-xs text-muted">
										{user.status !== UserStatus.Active ? 'Usuário precisa estar ativo' : modifyStatusReason}
									</span>
								)}
							</div>
						</Dropdown.Item>
						<Dropdown.Item
							key="inactivate"
							id="inactivate"
							textValue="Inativar"
							isDisabled={user.status !== UserStatus.Active || !canModifyStatus}
						>
							<Icon icon={RemoveCircleIcon} className="icon-sm text-danger" />
							<div className="flex flex-col">
								<Label className="text-danger">Inativar</Label>
								{(user.status !== UserStatus.Active || !canModifyStatus) && (
									<span className="text-xs text-muted">
										{user.status !== UserStatus.Active ? 'Usuário precisa estar ativo' : modifyStatusReason}
									</span>
								)}
							</div>
						</Dropdown.Item>
					{onSuspendFromRanking && (
						<Dropdown.Item key="suspend-from-ranking" id="suspend-from-ranking" textValue="Suspender do ranking" isDisabled={!canModifyStatus}>
							<Icon icon={ChampionIcon} className="icon-sm text-warning" />
							<div className="flex flex-col">
								<Label className="text-warning">Suspender do ranking</Label>
								{!canModifyStatus && <span className="text-xs text-muted">{modifyStatusReason}</span>}
							</div>
						</Dropdown.Item>
					)}
					</>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

