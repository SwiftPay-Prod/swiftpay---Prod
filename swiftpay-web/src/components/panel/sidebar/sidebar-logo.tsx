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
    <Link href={Routes.panel.merchant.dashboard} className="flex items-center">
      {showFull ? (
        <SwiftPayBrandLogo iconSize={42} showText={true} />
      ) : (
        <SwiftPayBrandLogo iconSize={36} showText={false} />
      )}
    </Link>
  );
}

