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
        <SwiftPayBrandLogo iconSize={56} />
      ) : (
        <div className="relative mx-auto size-10">
          <Image
            src="/logos/swiftpay-logo.png"
            alt="SwiftPay"
            fill
            sizes="40px"
            className="object-contain"
            priority
          />
        </div>
      )}
    </Link>
  );
}

