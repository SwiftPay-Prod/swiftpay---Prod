import { redirect } from "next/navigation";
import { listMerchants } from "@/app/actions/merchant/crud";
import { Routes } from "@/router/routes";
import { 
  isMerchantApproved, 
  isMerchantDraft,
} from "@/utils/merchant-utils";

export default async function RedirectPage() {
  const merchantsResponse = await listMerchants();
  const merchants = merchantsResponse?.data?.items ?? [];
  
  if (merchants.length === 0) {
    redirect(Routes.panel.merchant.new);
  }

  const merchant = merchants[0]!;
  
  if (isMerchantApproved(merchant.status, merchant.kycStatus)) {
    redirect(Routes.panel.merchant.dashboard);
  }
  
  if (isMerchantDraft(merchant.status, merchant.kycStatus)) {
    redirect(Routes.panel.merchant.onboarding);
  }

  redirect(Routes.panel.merchant.review);
}
