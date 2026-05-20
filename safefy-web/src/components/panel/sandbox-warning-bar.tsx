"use client";

import { Button, Tooltip } from "@heroui/react";
import { Icon } from '@/components/ui/icon';
import { TestTubeIcon, ViewIcon } from '@hugeicons/core-free-icons';
import { useEnvironment } from "@/contexts/environment-context";
import { useMerchant } from "@/contexts/merchant-context";
import { isMerchantApproved } from "@/utils/merchant-utils";

export function SandboxWarningBar() {
  const { isSandboxVisible, enablePreviewMode } = useEnvironment();
  const { selectedMerchant } = useMerchant();

  const showWarning = isSandboxVisible && selectedMerchant && 
    isMerchantApproved(selectedMerchant.status, selectedMerchant.kycStatus);

  if (!showWarning) {
    return null;
  }

  return (
    <div className="h-10 shrink-0 bg-warning px-4 py-1.5 flex items-center justify-center gap-2 text-xs md:text-sm font-medium">
      <Icon icon={TestTubeIcon} className="icon-sm" />
      <span>Você está em ambiente Sandbox. Transações não são reais.</span>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="ml-2"
            onPress={enablePreviewMode}
          >
            <Icon icon={ViewIcon} className="icon-sm" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Ocultar indicadores de Sandbox (modo visualização)</Tooltip.Content>
      </Tooltip>
    </div>
  );
}
