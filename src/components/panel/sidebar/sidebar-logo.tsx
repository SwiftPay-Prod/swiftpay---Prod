"use client";

import Link from "next/link";
import { useSidebar } from "@/contexts/sidebar-context";
import { Routes } from "@/router/routes";
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

export function SidebarLogo() {
  const { isExpanded, isMobile, isOpen } = useSidebar();

  const showFull = isMobile ? isOpen : isExpanded;

  return (
    <Link
      href={Routes.panel.merchant.dashboard}
      className="flex items-center rounded-xl border border-transparent px-2.5 py-1.5 transition-all duration-300 ease-out hover:border-brand/20 hover:bg-white/5"
    >
      <SwiftPayBrandLogo
        iconSize={showFull ? 32 : 28}
        showText={showFull}
        textClassName="text-xl"
      />
    </Link>
  );
}
