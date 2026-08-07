'use client';

import { Button, Dropdown, Label } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	CancelCircleIcon,
	CheckListIcon,
	MenuTwoLineIcon,
	PauseCircleIcon,
	PlayCircleIcon,
	ServerStack01Icon,
} from '@hugeicons/core-free-icons';
import { MerchantKycStatus, MerchantStatus, UserRole } from '@/types/enums';
import { openWithDelay, DEFAULT_MODAL_DELAY } from '@/utils/modal';

export interface MerchantActionData {
	id: string;
	name: string | null;
	status: MerchantStatus;
	kycStatus: MerchantKycStatus;
	acquirerName?: string | null;
}

interface MerchantActionsDropdownProps {
	merchant: MerchantActionData;
	currentUserRole: UserRole;
	isPending?: boolean;
	onlyIcon?: boolean;
	onActivate: () => void;
	onSuspend: () => void;
	onInactivate: () => void;
	onEvaluate?: () => void;
	onSetAcquirer?: () => void;
}

const ALLOWED_KYC_STATUSES: MerchantKycStatus[] = [
	MerchantKycStatus.Pending,
	MerchantKycStatus.UnderReview,
	MerchantKycStatus.Approved,
];

function canModifyMerchant(currentUserRole: UserRole): boolean {
	return currentUserRole === UserRole.God || currentUserRole === UserRole.Admin;
}

function canEvaluateMerchant(merchant: MerchantActionData, currentUserRole: UserRole): boolean {
	const roleAvailableEvaluate = [UserRole.God, UserRole.Admin];
	if (!roleAvailableEvaluate.includes(currentUserRole)) {
		return false;
	}

	const merchantKycStatusAvailableEvaluate: MerchantKycStatus[] = [
		MerchantKycStatus.Pending,
		MerchantKycStatus.UnderReview,
	];
	return merchantKycStatusAvailableEvaluate.includes(merchant.kycStatus);
}

function getActivateDisabledReason(merchant: MerchantActionData): string | null {
	if (merchant.status === MerchantStatus.Active) {
		return 'Organização já está ativa';
	}
	if (merchant.status === MerchantStatus.Deleted) {
		return 'Organização foi excluída';
	}
	if (merchant.status !== MerchantStatus.Inactive && merchant.status !== MerchantStatus.Suspended) {
		return 'Apenas organizações inativas ou suspensas';
	}
	if (!ALLOWED_KYC_STATUSES.includes(merchant.kycStatus)) {
		return 'KYC deve estar pendente, em análise ou aprovado';
	}
	return null;
}

function getSuspendDisabledReason(merchant: MerchantActionData): string | null {
	if (merchant.status === MerchantStatus.Deleted) {
		return 'Organização foi excluída';
	}
	if (merchant.status !== MerchantStatus.Active) {
		return 'Apenas organizações ativas podem ser suspensas';
	}
	if (!ALLOWED_KYC_STATUSES.includes(merchant.kycStatus)) {
		return 'KYC deve estar pendente, em análise ou aprovado';
	}
	return null;
}

function getInactivateDisabledReason(merchant: MerchantActionData): string | null {
	if (merchant.status === MerchantStatus.Deleted) {
		return 'Organização foi excluída';
	}
	if (merchant.status !== MerchantStatus.Active) {
		return 'Apenas organizações ativas podem ser inativadas';
	}
	if (!ALLOWED_KYC_STATUSES.includes(merchant.kycStatus)) {
		return 'KYC deve estar pendente, em análise ou aprovado';
	}
	return null;
}

function getEvaluateDisabledReason(merchant: MerchantActionData): string | null {
	const evaluableStatuses: MerchantKycStatus[] = [
		MerchantKycStatus.Pending,
		MerchantKycStatus.UnderReview,
		MerchantKycStatus.Complement,
	];
	if (!evaluableStatuses.includes(merchant.kycStatus)) {
		return 'KYC não está pendente de avaliação';
	}
	return null;
}

function getSetAcquirerDisabledReason(merchant: MerchantActionData): string | null {
	if (merchant.status !== MerchantStatus.Active) {
		return 'Organização precisa estar ativa';
	}
	if (merchant.kycStatus !== MerchantKycStatus.Approved) {
		return 'KYC precisa estar aprovado';
	}
	return null;
}

interface MerchantActionButtonsProps {
	merchant: MerchantActionData;
	currentUserRole: UserRole;
	isPending?: boolean;
	onActivate: () => void;
	onSuspend: () => void;
	onInactivate: () => void;
	onEvaluate?: () => void;
	onSetAcquirer?: () => void;
}

export function MerchantActionButtons({
	merchant,
	currentUserRole,
	isPending = false,
	onActivate,
	onSuspend,
	onInactivate,
	onEvaluate,
	onSetAcquirer,
}: MerchantActionButtonsProps) {
	const canModify = canModifyMerchant(currentUserRole);
	const canEvaluate = canEvaluateMerchant(merchant, currentUserRole);
	const activateReason = getActivateDisabledReason(merchant);
	const suspendReason = getSuspendDisabledReason(merchant);
	const inactivateReason = getInactivateDisabledReason(merchant);
	const evaluateReason = getEvaluateDisabledReason(merchant);
	const setAcquirerReason = getSetAcquirerDisabledReason(merchant);

	const roleAvailableShowActions = [UserRole.God, UserRole.Admin];
	if (!roleAvailableShowActions.includes(currentUserRole)) {
		return null;
	}

	return (
		<>
			{onEvaluate && (
				<Button
					variant="secondary"
					className="w-full justify-start"
					isDisabled={!canEvaluate || !canModify || evaluateReason !== null || isPending}
					onPress={onEvaluate}
				>
					<Icon icon={CheckListIcon} className="icon-sm text-accent" />
					Avaliar
				</Button>
			)}
			{onSetAcquirer && (
				<Button
					variant="secondary"
					className="w-full justify-start"
					isDisabled={!canModify || setAcquirerReason !== null || isPending}
					onPress={onSetAcquirer}
				>
					<Icon icon={ServerStack01Icon} className="icon-sm text-secondary" />
					Definir Processadora
				</Button>
			)}
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={!canModify || activateReason !== null || isPending}
				onPress={onActivate}
			>
				<Icon icon={PlayCircleIcon} className="icon-sm text-success" />
				Ativar
			</Button>
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={!canModify || inactivateReason !== null || isPending}
				onPress={onInactivate}
			>
				<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
				Inativar
			</Button>
			<Button
				variant="secondary"
				className="w-full justify-start"
				isDisabled={!canModify || suspendReason !== null || isPending}
				onPress={onSuspend}
			>
				<Icon icon={PauseCircleIcon} className="icon-sm text-warning" />
				Suspender
			</Button>
		</>
	);
}

export function MerchantActionsDropdown({
	merchant,
	currentUserRole,
	isPending = false,
	onlyIcon = false,
	onActivate,
	onSuspend,
	onInactivate,
	onEvaluate,
	onSetAcquirer,
}: MerchantActionsDropdownProps) {
	const canModify = canModifyMerchant(currentUserRole);
	const canEvaluate = canEvaluateMerchant(merchant, currentUserRole);
	const activateReason = getActivateDisabledReason(merchant);
	const suspendReason = getSuspendDisabledReason(merchant);
	const inactivateReason = getInactivateDisabledReason(merchant);
	const evaluateReason = getEvaluateDisabledReason(merchant);
	const setAcquirerReason = getSetAcquirerDisabledReason(merchant);

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
						if (key === 'activate') {
							openWithDelay(onActivate, DEFAULT_MODAL_DELAY);
						} else if (key === 'suspend') {
							openWithDelay(onSuspend, DEFAULT_MODAL_DELAY);
						} else if (key === 'inactivate') {
							openWithDelay(onInactivate, DEFAULT_MODAL_DELAY);
						} else if (key === 'evaluate' && onEvaluate) {
							openWithDelay(onEvaluate, DEFAULT_MODAL_DELAY);
						} else if (key === 'setAcquirer' && onSetAcquirer) {
							openWithDelay(onSetAcquirer, DEFAULT_MODAL_DELAY);
						}
					}}
				>
					{onEvaluate && (
						<Dropdown.Item
							key="evaluate"
							id="evaluate"
							textValue="Avaliar"
							isDisabled={!canEvaluate || !canModify || evaluateReason !== null}
						>
							<Icon icon={CheckListIcon} className="icon-sm text-accent" />
							<div className="flex flex-col">
								<Label className="text-accent">Avaliar</Label>
								{(!canEvaluate || !canModify || evaluateReason !== null) && (
									<span className="text-xs text-muted">
										{!canEvaluate ? 'Avaliação não disponível' : !canModify ? 'Sem permissão' : evaluateReason}
									</span>
								)}
							</div>
						</Dropdown.Item>
					)}

					{onSetAcquirer && (
						<Dropdown.Item
							key="setAcquirer"
							id="setAcquirer"
							textValue="Definir Processadora"
							isDisabled={!canModify || setAcquirerReason !== null}
						>
							<Icon icon={ServerStack01Icon} className="icon-sm text-secondary" />
							<div className="flex flex-col">
								<Label className="text-secondary">Definir Processadora</Label>
								{(!canModify || setAcquirerReason !== null) && (
									<span className="text-xs text-muted">{!canModify ? 'Sem permissão' : setAcquirerReason}</span>
								)}
							</div>
						</Dropdown.Item>
					)}

					<Dropdown.Item
						key="activate"
						id="activate"
						textValue="Ativar"
						isDisabled={!canModify || activateReason !== null}
					>
						<Icon icon={PlayCircleIcon} className="icon-sm text-success" />
						<div className="flex flex-col">
							<Label className="text-success">Ativar</Label>
							{(!canModify || activateReason !== null) && (
								<span className="text-xs text-muted">{!canModify ? 'Sem permissão' : activateReason}</span>
							)}
						</div>
					</Dropdown.Item>

					<Dropdown.Item
						key="inactivate"
						id="inactivate"
						textValue="Inativar"
						isDisabled={!canModify || inactivateReason !== null}
					>
						<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
						<div className="flex flex-col">
							<Label className="text-danger">Inativar</Label>
							{(!canModify || inactivateReason !== null) && (
								<span className="text-xs text-muted">{!canModify ? 'Sem permissão' : inactivateReason}</span>
							)}
						</div>
					</Dropdown.Item>

					<Dropdown.Item
						key="suspend"
						id="suspend"
						textValue="Suspender"
						isDisabled={!canModify || suspendReason !== null}
					>
						<Icon icon={PauseCircleIcon} className="icon-sm text-warning" />
						<div className="flex flex-col">
							<Label className="text-warning">Suspender</Label>
							{(!canModify || suspendReason !== null) && (
								<span className="text-xs text-muted">{!canModify ? 'Sem permissão' : suspendReason}</span>
							)}
						</div>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

