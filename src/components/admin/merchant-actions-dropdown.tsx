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
		<div className="flex flex-col gap-2">
			{onEvaluate && (
				<Button
					variant="outline"
					className="w-full justify-start rounded-xl border-white/12 bg-white/5 text-white hover:bg-white/10"
					isDisabled={!canEvaluate || !canModify || evaluateReason !== null || isPending}
					onPress={onEvaluate}
				>
					<Icon icon={CheckListIcon} className="icon-sm text-brand" />
					<span>Avaliar</span>
				</Button>
			)}
			{onSetAcquirer && (
				<Button
					variant="outline"
					className="w-full justify-start rounded-xl border-white/12 bg-white/5 text-white hover:bg-white/10"
					isDisabled={!canModify || setAcquirerReason !== null || isPending}
					onPress={onSetAcquirer}
				>
					<Icon icon={ServerStack01Icon} className="icon-sm text-[#8b5cf6]" />
					<span>Definir Processadora</span>
				</Button>
			)}
			<Button
				variant="outline"
				className="w-full justify-start rounded-xl border-white/12 bg-white/5 text-white hover:bg-white/10"
				isDisabled={!canModify || activateReason !== null || isPending}
				onPress={onActivate}
			>
				<Icon icon={PlayCircleIcon} className="icon-sm text-[#00a87e]" />
				<span>Ativar</span>
			</Button>
			<Button
				variant="outline"
				className="w-full justify-start rounded-xl border-white/12 bg-white/5 text-white hover:bg-white/10"
				isDisabled={!canModify || inactivateReason !== null || isPending}
				onPress={onInactivate}
			>
				<Icon icon={CancelCircleIcon} className="icon-sm text-[#e23b4a]" />
				<span>Inativar</span>
			</Button>
			<Button
				variant="outline"
				className="w-full justify-start rounded-xl border-white/12 bg-white/5 text-white hover:bg-white/10"
				isDisabled={!canModify || suspendReason !== null || isPending}
				onPress={onSuspend}
			>
				<Icon icon={PauseCircleIcon} className="icon-sm text-[#f5a623]" />
				<span>Suspender</span>
			</Button>
		</div>
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
			<Button
				variant="outline"
				size="sm"
				isIconOnly={onlyIcon}
				isDisabled={isPending}
				className="rounded-xl border border-white/12 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-colors"
			>
				<Icon icon={MenuTwoLineIcon} className="icon-sm text-white/80" />
				{!onlyIcon && <span className="font-semibold text-xs text-white">Ações</span>}
			</Button>
			<Dropdown.Popover className="min-w-60 rounded-2xl border border-white/12 bg-[#16181a] p-1.5 shadow-2xl backdrop-blur-xl text-white">
				<Dropdown.Menu
					aria-label="Ações da organização"
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
					className="rounded-xl p-2.5 hover:bg-white/10 transition-colors text-white data-[disabled=true]:opacity-60 data-[disabled=true]:pointer-events-none cursor-pointer data-[disabled=true]:text-white/80"
				>
							<div className="flex items-center gap-2.5">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
									<Icon icon={CheckListIcon} className="icon-xs text-[#4f55f1]" />
								</div>
								<div className="flex flex-col gap-0.5">
									<Label className="text-xs font-semibold text-white cursor-pointer">Avaliar</Label>
									{(!canEvaluate || !canModify || evaluateReason !== null) && (
										<span className="text-[11px] font-mono text-white/50">
											{!canEvaluate ? 'Avaliação não disponível' : !canModify ? 'Sem permissão' : evaluateReason}
										</span>
									)}
								</div>
							</div>
						</Dropdown.Item>
					)}

					{onSetAcquirer && (
						<Dropdown.Item
							key="setAcquirer"
							id="setAcquirer"
							textValue="Definir Processadora"
							isDisabled={!canModify || setAcquirerReason !== null}
							className="rounded-xl p-2.5 hover:bg-white/10 transition-colors text-white data-[disabled=true]:opacity-40 data-[disabled=true]:pointer-events-none cursor-pointer"
						>
							<div className="flex items-center gap-2.5">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/25">
									<Icon icon={ServerStack01Icon} className="icon-xs text-[#8b5cf6]" />
								</div>
								<div className="flex flex-col gap-0.5">
									<Label className="text-xs font-semibold text-white cursor-pointer">Definir Processadora</Label>
									{(!canModify || setAcquirerReason !== null) && (
										<span className="text-[11px] font-mono text-white/50">{!canModify ? 'Sem permissão' : setAcquirerReason}</span>
									)}
								</div>
							</div>
						</Dropdown.Item>
					)}

					<Dropdown.Item
						key="activate"
						id="activate"
						textValue="Ativar"
						isDisabled={!canModify || activateReason !== null}
						className="rounded-xl p-2.5 hover:bg-white/10 transition-colors text-white data-[disabled=true]:opacity-60 data-[disabled=true]:pointer-events-none cursor-pointer data-[disabled=true]:text-white/80"
					>
						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/25">
								<Icon icon={PlayCircleIcon} className="icon-xs text-[#00a87e]" />
							</div>
							<div className="flex flex-col gap-0.5">
								<Label className="text-xs font-semibold text-white cursor-pointer">Ativar</Label>
								{(!canModify || activateReason !== null) && (
									<span className="text-[11px] font-mono text-white/50">{!canModify ? 'Sem permissão' : activateReason}</span>
								)}
							</div>
						</div>
					</Dropdown.Item>

					<Dropdown.Item
						key="inactivate"
						id="inactivate"
						textValue="Inativar"
						isDisabled={!canModify || inactivateReason !== null}
						className="rounded-xl p-2.5 hover:bg-white/10 transition-colors text-white data-[disabled=true]:opacity-60 data-[disabled=true]:pointer-events-none cursor-pointer data-[disabled=true]:text-white/80"
					>
						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e23b4a]/15 text-[#e23b4a] border border-[#e23b4a]/25">
								<Icon icon={CancelCircleIcon} className="icon-xs text-[#e23b4a]" />
							</div>
							<div className="flex flex-col gap-0.5">
								<Label className="text-xs font-semibold text-white cursor-pointer">Inativar</Label>
								{(!canModify || inactivateReason !== null) && (
									<span className="text-[11px] font-mono text-white/50">{!canModify ? 'Sem permissão' : inactivateReason}</span>
								)}
							</div>
						</div>
					</Dropdown.Item>

					<Dropdown.Item
						key="suspend"
						id="suspend"
						textValue="Suspender"
						isDisabled={!canModify || suspendReason !== null}
						className="rounded-xl p-2.5 hover:bg-white/10 transition-colors text-white data-[disabled=true]:opacity-60 data-[disabled=true]:pointer-events-none cursor-pointer data-[disabled=true]:text-white/80"
					>
						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/25">
								<Icon icon={PauseCircleIcon} className="icon-xs text-[#f5a623]" />
							</div>
							<div className="flex flex-col gap-0.5">
								<Label className="text-xs font-semibold text-white cursor-pointer">Suspender</Label>
								{(!canModify || suspendReason !== null) && (
									<span className="text-[11px] font-mono text-white/50">{!canModify ? 'Sem permissão' : suspendReason}</span>
								)}
							</div>
						</div>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

