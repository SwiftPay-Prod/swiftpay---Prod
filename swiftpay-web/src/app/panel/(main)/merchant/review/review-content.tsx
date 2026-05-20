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
import { PageHeader } from '@/components/ui/page-header';
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

			<PageHeader
				icon={<Icon icon={Building02Icon} className="icon-md text-accent-foreground" />}
				title={currentMerchant.name || 'Organização'}
				description={
					<div className="flex flex-col gap-1">
						<div className="w-fit">
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
						{isComplement && hasPendingItems && (
							<span>
								Nossa equipe solicitou informações complementares para dar continuidade à análise. Por favor, responda
								os complementos solicitados.
							</span>
						)}
					</div>
				}
				actions={
					<AsyncButton variant="primary" onPress={handleRefresh} isPending={isPending}>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
						Atualizar status
					</AsyncButton>
				}
			/>

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
