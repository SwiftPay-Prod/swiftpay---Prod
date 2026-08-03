"use client";

import { useSidebar } from "@/contexts/sidebar-context";
import { useMerchant } from "@/contexts/merchant-context";
import { SidebarUserInfo } from "./sidebar-user-info";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarMerchantSelector } from "./sidebar-merchant-selector";
import { SidebarMenu } from "./sidebar-menu";
import { getMenuSections } from "@/utils/utils-routes";
import type { UserInfo } from "@/types/auth";

interface SidebarProps {
  user: UserInfo;
}

export function Sidebar({ user }: SidebarProps) {
  const { isExpanded, isMobile, isOpen } = useSidebar();
  const { selectedMerchant } = useMerchant();

  const merchantContext = selectedMerchant
    ? { status: selectedMerchant.status, kycStatus: selectedMerchant.kycStatus }
    : null;
  const menuSections = getMenuSections(user.role, merchantContext);

  const showFull = isMobile ? isOpen : isExpanded;

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className={`flex items-center border-b border-border shrink-0 transition-all duration-150 ${
        showFull ? 'px-6 py-5' : 'px-3 py-5 justify-center'
      }`}>
        <SidebarLogo />
      </div>

      <div className={`border-b border-border shrink-0 transition-all duration-150 ${
        showFull ? 'px-4 py-3' : 'px-2 py-3'
      }`}>
        <SidebarMerchantSelector />
      </div>

      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        <SidebarMenu sections={menuSections} />
        <div className={`pt-4 pb-2 border-t border-border mt-6 transition-all duration-150 ${
          showFull ? 'px-4' : 'px-2'
        }`}>
          <SidebarUserInfo />
        </div>
      </div>
    </div>
  );
}

