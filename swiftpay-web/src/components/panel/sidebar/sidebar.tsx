"use client";

import { Button } from "@heroui/react";
import { Icon } from '@/components/ui/icon';
import { SidebarLeftIcon } from '@hugeicons/core-free-icons';
import { useSidebar } from "@/contexts/sidebar-context";
import { useMerchant } from "@/contexts/merchant-context";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarUserInfo } from "./sidebar-user-info";
import { SidebarMerchantSelector } from "./sidebar-merchant-selector";
import { SidebarKbar } from './sidebar-kbar';
import { SidebarMenu } from "./sidebar-menu";
import { getMenuSections } from "@/utils/utils-routes";
import type { UserInfo } from "@/types/auth";

interface SidebarProps {
  user: UserInfo;
}

export function Sidebar({ user }: SidebarProps) {
  const { isExpanded, isMobile, isOpen, toggleSidebar } = useSidebar();
  const { selectedMerchant } = useMerchant();

  const showFull = isMobile ? isOpen : isExpanded;
  const merchantContext = selectedMerchant
    ? { status: selectedMerchant.status, kycStatus: selectedMerchant.kycStatus }
    : null;
  const menuSections = getMenuSections(user.role, merchantContext);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-surface border-r border-divider">
      <div className="flex items-center justify-center px-4 py-3 border-b border-divider shrink-0 relative">
        <SidebarLogo />

        {isMobile && isOpen && (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Fechar menu"
            className="absolute right-2 text-muted"
            onPress={toggleSidebar}
          >
            <Icon icon={SidebarLeftIcon} className="icon-md" />
          </Button>
        )}
      </div>

      <div className="px-2 py-2 border-b border-divider shrink-0">
        <SidebarMerchantSelector />
      </div>

      <div className="px-2 py-2 border-b border-divider shrink-0">
        <SidebarKbar sections={menuSections} user={user} />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-2 py-1">
          <SidebarMenu sections={menuSections} />
        </div>

        <div className="px-2 py-2 border-t border-divider">
          <SidebarUserInfo />
        </div>
      </div>
    </div>
  );
}

