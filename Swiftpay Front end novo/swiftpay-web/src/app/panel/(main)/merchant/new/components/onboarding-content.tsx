'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useMerchant } from '@/contexts/merchant-context';
import { Routes } from '@/router/routes';
import { MerchantOnboardingForm } from '../forms/merchant-onboarding-form';
import { useMerchantOnboardingForm } from '../hooks/use-merchant-onboarding-form';
import type { MerchantData, MinimalMerchant } from '@/types/merchant/crud';

interface OnboardingContentProps {
	initialMerchant: MerchantData | null;
}

export function OnboardingContent({ initialMerchant }: OnboardingContentProps) {
	const router = useRouter();
	const { refreshMerchantList, setSelectedMerchantLocally } = useMerchant();

	const controller = useMerchantOnboardingForm({
		initialMerchant,
		onMerchantCreated: async (merchant) => {
			const selectedMerchant: MinimalMerchant = {
				id: merchant.id,
				name: merchant.name,
				email: merchant.email,
				document: merchant.kyc?.documentNumber ?? null,
				status: merchant.status,
				kycStatus: merchant.kycStatus,
				onboardingStep: merchant.onboardingStep,
				createdAt: merchant.createdAt,
				onboardingCompletedAt: merchant.onboardingCompletedAt,
				availableBalance: 0,
				fees: merchant.fees,
			};

			setSelectedMerchantLocally(selectedMerchant);
		},
		onSubmitted: async (merchantId) => {
			await refreshMerchantList(merchantId);
			toast('Onboarding enviado', {
				description: 'Seu cadastro foi enviado para análise com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			router.push(Routes.panel.referrals);
		},
	});

	return <MerchantOnboardingForm controller={controller} />;
}