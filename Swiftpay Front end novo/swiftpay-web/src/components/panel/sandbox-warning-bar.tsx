"use client";

import { useEnvironment } from "@/contexts/environment-context";
import { useMerchant } from "@/contexts/merchant-context";
import { isMerchantApproved } from "@/utils/merchant-utils";

export function SandboxWarningBar() {
  const { isSandbox, isSandboxVisible, enablePreviewMode } = useEnvironment();
  const { selectedMerchant } = useMerchant();

  const merchantReady = selectedMerchant &&
    isMerchantApproved(selectedMerchant.status, selectedMerchant.kycStatus);

  if (!isSandboxVisible || !merchantReady) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#f59e0b]/10 border-b border-[#f59e0b]/20 text-xs font-medium text-[#f59e0b]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
      <span>Sandbox — transações não são reais.</span>
      <button
        type="button"
        onClick={enablePreviewMode}
        className="ml-1 underline underline-offset-2 hover:text-[#fbbf24] transition-colors"
      >
        Ocultar
      </button>
    </div>
  );
}
