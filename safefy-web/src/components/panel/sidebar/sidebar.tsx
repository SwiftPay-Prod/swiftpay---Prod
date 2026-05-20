"use client";

import { useState, useTransition } from "react";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from '@/components/ui/icon';
import { Logout01Icon, SidebarLeftIcon } from '@hugeicons/core-free-icons';
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { useMerchant } from "@/contexts/merchant-context";
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
  const router = useRouter();
  const { isExpanded, isMobile, isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const { selectedMerchant } = useMerchant();
  const [isPending, startTransition] = useTransition();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showFull = isMobile ? isOpen : isExpanded;
  const merchantContext = selectedMerchant
    ? { status: selectedMerchant.status, kycStatus: selectedMerchant.kycStatus }
    : null;
  const menuSections = getMenuSections(user.role, merchantContext);

  const performLogout = () => {
    startTransition(async () => {
      closeSidebar();
      router.push("/api/auth/signout");
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-default">
      <div className="flex items-center justify-center p-4 border-b border-divider shrink-0 h-14 relative">
        <SidebarLogo />

        {isMobile && isOpen && (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Fechar menu"
            className="absolute right-2"
            onPress={toggleSidebar}
          >
            <Icon icon={SidebarLeftIcon} className="icon-md text-default-500" />
          </Button>
        )}
      </div>

      <div className="p-3 border-b border-divider shrink-0">
        <SidebarMerchantSelector />
      </div>

      <div className="p-3 border-b border-divider shrink-0">
        <SidebarKbar sections={menuSections} user={user} />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-3 overflow-y-auto">
          <SidebarMenu sections={menuSections} />
        </div>

        <div className="p-3 border-t border-divider space-y-3 mt-auto">

          <div className="border-t border-divider">
            <SidebarUserInfo />
          </div>

          {showFull ? (
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-start gap-3 hover:bg-danger hover:text-white"
              onPress={() => setShowLogoutConfirm(true)}
              isPending={isPending}
            >
              <Icon icon={Logout01Icon} className="icon-md" />
              <span>Sair</span>
            </Button>
          ) : (
            <div className="flex justify-center">
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-danger hover:text-white"
                    isIconOnly
                    onPress={() => setShowLogoutConfirm(true)}
                    isPending={isPending}
                  >
                    <Icon icon={Logout01Icon} className="icon-md" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content placement="right">Sair</Tooltip.Content>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sair da plataforma"
        description="Tem certeza que deseja encerrar sua sessão agora?"
        confirmLabel="Sair"
        status="danger"
        isPending={isPending}
        onConfirm={performLogout}
      />
    </div>
  );
}

