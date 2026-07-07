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
    <Link href={Routes.panel.merchant.dashboard} className="flex items-center h-8">
      {showFull ? (
        <SwiftPayBrandLogo iconSize={28} textClassName="text-xl" />
      ) : (
        <div className="relative size-8">
          <Image
            src="/logos/swiftpay-icon-logo.png"
            alt="SwiftPay"
            fill
            sizes="32px"
            className="object-contain"
            priority
          />
        </div>
      )}
    </Link>
  );
}

