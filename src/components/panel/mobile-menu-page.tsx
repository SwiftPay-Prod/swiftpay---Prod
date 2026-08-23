'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { SidebarMerchantSelector } from '@/components/panel/sidebar/sidebar-merchant-selector';
import { SidebarKbar } from '@/components/panel/sidebar/sidebar-kbar';
import { SidebarMenu } from '@/components/panel/sidebar/sidebar-menu';
import { SidebarUserInfo } from '@/components/panel/sidebar/sidebar-user-info';
import { Routes } from '@/router/routes';
import type { MenuSection } from '@/types/router';
import type { UserInfo } from '@/types/auth';

interface MobileMenuPageProps {
	sections: MenuSection[];
	user: UserInfo;
}

export function MobileMenuPage({ sections, user }: MobileMenuPageProps) {
	return (
		<div className="flex min-h-full flex-col bg-surface">
			{/* Logo — mirrors sidebar header */}
			<div className="flex h-12 shrink-0 items-center border-b border-border px-3">
				<Link href={Routes.panel.merchant.dashboard} className="flex h-7 items-center">
					<SwiftPayBrandLogo iconSize={26} textClassName="text-2xl" />
				</Link>
			</div>

			{/* Organization selector */}
			<div className="shrink-0 border-b border-border px-3 py-2">
				<SidebarMerchantSelector forceFull />
			</div>

			{/* KBar search */}
			<div className="shrink-0 border-b border-border px-3 py-2">
				<SidebarKbar sections={sections} user={user} forceFull />
			</div>

			{/* Menu sections + User info — scrollable */}
			<div className="flex-1 overflow-y-auto px-3 py-2">
				<SidebarMenu sections={sections} forceFull />
				<div className="border-t border-border mt-6 pt-4 pb-2">
					<SidebarUserInfo forceFull />
				</div>
			</div>
		</div>
	);
}
