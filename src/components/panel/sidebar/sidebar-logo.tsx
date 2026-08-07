"use client";

import Image from "next/image";
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
      className="flex items-center rounded-xl border border-transparent bg-content2/60 px-3 py-2 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:border-brand/20 hover:bg-content2 hover:shadow-md"
    >
      <SwiftPayBrandLogo
        iconSize={showFull ? 32 : 28}
        showText={showFull}
        textClassName="text-xl"
      />
    </Link>
  );
}
