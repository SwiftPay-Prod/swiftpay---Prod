'use client';

import { Alert, Chip } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	TaskRemove01Icon,
	UserBlock01Icon,
	Building02Icon,
} from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import {
	MerchantAddressAccordion,
	MerchantBusinessAccordion,
	MerchantContactAccordion,
	MerchantDatesAccordion,
	MerchantDocumentsAccordion,
	MerchantOrganizationInfoAccordion,
} from '@/components/merchant/merchant-organization-accordions';
import { useMerchant } from '@/contexts/merchant-context';
import { Routes } from '@/router/routes';
import type { MerchantData } from '@/types/merchant/crud';
import { MerchantKycPendingItemStatus, MerchantKycStatus, MerchantStatus } from '@/types/enums';
import {
	KycStatusAlert,
	KycStatusChip,
} from '@/components/merchant/pending/pending-components';
import { mapParseColorToChipColor, merchantStatusParse } from '@/parse';

interface ReviewContentProps {
	merchant: MerchantData;
}

export function ReviewContent({ merchant }: ReviewContentProps) {
	const router = useRouter();
	const { updateMerchantInList } = useMerchant();
	const [isPending, startTransition] = useTransition();
	const [currentMerchant, setCurrentMerchant] = useState<MerchantData>(merchant);

	useEffect(() => {
		setCurrentMerchant(merchant);
	}, [merchant]);

	const kycStatus = currentMerchant.kycStatus as MerchantKycStatus;
	const status = currentMerchant.status as MerchantStatus;
	const isComplement = kycStatus === MerchantKycStatus.Complement;
	const isSuspended = status === MerchantStatus.Suspended;
	const isInactive = status === MerchantStatus.Inactive;
	const isSuspendedOrInactive = isSuspended || isInactive;
	const pendingItems = currentMerchant.kycPendingItems ?? [];
	const hasPendingItems = pendingItems.some((item) => item.status === MerchantKycPendingItemStatus.Pending);

	const statusParse = merchantStatusParse[status];

	function handleRefresh() {
		startTransition(async () => {
			const updatedMerchant = await updateMerchantInList(currentMerchant.id);
			if (updatedMerchant) {
				setCurrentMerchant(updatedMerchant);
			}
		});
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{isSuspendedOrInactive && (
				<Alert status={mapParseColorToChipColor(statusParse.color)}>
					<Alert.Indicator>
						{isSuspended ? (
							<Icon icon={TaskRemove01Icon} className="icon-md" />
						) : (
							<Icon icon={UserBlock01Icon} className="icon-md" />
						)}
					</Alert.Indicator>
					<Alert.Content>
						<Alert.Title>Organização {statusParse.label}</Alert.Title>
						<Alert.Description>
							{isSuspended && currentMerchant.suspendedReason && <span>Motivo: {currentMerchant.suspendedReason}</span>}
							{isInactive && currentMerchant.inactiveReason && <span>Motivo: {currentMerchant.inactiveReason}</span>}
							{!currentMerchant.suspendedReason && !currentMerchant.inactiveReason && (
								<span>Entre em contato com o suporte para mais informações.</span>
							)}
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={Building02Icon} className="icon-sm text-[#4f55f1]" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">{currentMerchant.name || 'Organização'}</h1>
						<div className="flex items-center gap-2 mt-1">
							{isSuspendedOrInactive ? (
								<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
									<span className="flex min-w-0 items-center gap-2">
										{statusParse.icon}
										{statusParse.label}
									</span>
								</Chip>
							) : (
								<KycStatusChip status={kycStatus} />
							)}
						</div>
					</div>
				</div>
				<div>
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isPending}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={ArrowReloadHorizontalIcon} className={`icon-xs ${isPending ? 'animate-spin' : ''}`} />
						<span>Atualizar status</span>
					</button>
				</div>
			</div>
			{!isSuspendedOrInactive && (
				<KycStatusAlert
					status={kycStatus}
					hasPendingItems={hasPendingItems}
					rejectionReason={currentMerchant.kyc?.rejectionReason}
					onResolveComplements={() => router.push(Routes.panel.merchant.onboarding)}
				/>
			)}

			<div className="flex flex-col gap-4">
				<MerchantOrganizationInfoAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
				<MerchantContactAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
				<MerchantAddressAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
				<MerchantBusinessAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
				<MerchantDocumentsAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
				<MerchantDatesAccordion merchant={currentMerchant} accordionIdPrefix="merchant-review" viewer="merchant" />
			</div>
		</div>
	);
}
