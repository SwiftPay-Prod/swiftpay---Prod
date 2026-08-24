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
    <div className="flex flex-col h-full bg-[#000000] border-r border-white/10 text-white">
      {/* Logo */}
      <div className={`flex items-center shrink-0 h-12 border-b border-white/10 ${
        showFull ? 'px-3.5' : 'justify-center px-0'
      }`}>
        <SidebarLogo />
      </div>

      {/* Merchant selector */}
      <div className={`shrink-0 border-b border-white/10 ${
        showFull ? 'px-3 py-2' : 'px-2 py-2'
      }`}>
        <SidebarMerchantSelector />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-gutter-stable py-3">
        <div className={showFull ? 'px-2' : 'px-2'}>
          <SidebarMenu sections={menuSections} />
        </div>
      </div>

      {/* User */}
      <div className={`shrink-0 border-t border-white/10 ${
        showFull ? 'px-3 py-2.5' : 'px-2 py-2.5'
      }`}>
        <SidebarUserInfo />
      </div>
    </div>
  );
}

