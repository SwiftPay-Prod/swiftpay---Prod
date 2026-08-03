import { getMerchant } from '@/app/actions/merchant/crud';
import { getSelectedMerchant } from '@/auth/session';
import { MerchantKycStatus, MerchantStatus } from '@/types/enums';
import { OnboardingContent } from './components/onboarding-content';
import { MerchantNewStatusRedirect } from './components/merchant-new-status-redirect';
import { getMerchantRedirectRoute, isMerchantDraftOrComplement } from '@/utils/merchant-utils';

function canAccessMerchantEdit(status: MerchantStatus, kycStatus?: MerchantKycStatus | null): boolean {
	return isMerchantDraftOrComplement(status, kycStatus);
}

export default async function MerchantNewPage() {
	const selectedMerchant = await getSelectedMerchant();

	if (!selectedMerchant?.id) {
		return <OnboardingContent key="merchant-new-create" initialMerchant={null} />;
	}

	if (!canAccessMerchantEdit(selectedMerchant.status, selectedMerchant.kycStatus)) {
		return <MerchantNewStatusRedirect to={getMerchantRedirectRoute(selectedMerchant.status, selectedMerchant.kycStatus)} />;
	}

	const response = await getMerchant(selectedMerchant.id);
	const merchant = response?.data;

	if (!merchant) {
		return (
			<div className="flex h-96 items-center justify-center">
				<p className="text-muted">Não foi possível carregar os dados do cadastro.</p>
			</div>
		);
	}

	if (!canAccessMerchantEdit(merchant.status, merchant.kycStatus)) {
		return <MerchantNewStatusRedirect to={getMerchantRedirectRoute(merchant.status, merchant.kycStatus)} />;
	}

	return <OnboardingContent key={selectedMerchant.id} initialMerchant={merchant} />;
}
