'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { SidebarLeftIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useMerchant } from '@/contexts/merchant-context';
import { useSidebar } from '@/contexts/sidebar-context';
import { getMenuSections } from '@/utils/utils-routes';
import { getIconWithSize } from '@/router/icons';
import { Routes } from '@/router/routes';
import type { RouteConfig } from '@/types/router';
import type { UserInfo } from '@/types/auth';

interface SidebarMobileNavbarProps {
	user: UserInfo;
}

function isRouteActive(pathname: string, routePath: string): boolean {
	if (routePath === Routes.panel.merchant.dashboard || routePath === Routes.panel.admin.dashboard) {
		return pathname === routePath;
	}
	return pathname.startsWith(routePath);
}

export function SidebarMobileNavbar({ user }: SidebarMobileNavbarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { selectedMerchant } = useMerchant();
	const { toggleSidebar } = useSidebar();

	const merchantContext = selectedMerchant
		? { status: selectedMerchant.status, kycStatus: selectedMerchant.kycStatus }
		: null;

	const allMenuItems = getMenuSections(user.role, merchantContext)
		.flatMap((section) => section.items)
		.filter((item, index, items) => items.findIndex((candidate) => candidate.path === item.path) === index);

	const quickPaths = [
		Routes.panel.merchant.dashboard,
		Routes.panel.merchant.transactions,
		Routes.panel.merchant.cashouts,
		Routes.panel.merchant.customers,
	];

	const selectedItems: RouteConfig[] = [];
	for (const path of quickPaths) {
		const item = allMenuItems.find((i) => i.path === path);
		if (item) selectedItems.push(item);
	}

	const mainItems = selectedItems.slice(0, 4);

	function navigate(item: RouteConfig) {
		if (item.isDisabled) return;
		router.push(item.path);
	}

	function getMobileLabel(item: RouteConfig): string {
		if (item.path === Routes.panel.merchant.dashboard) return 'Dashboard';
		if (item.path === Routes.panel.merchant.transactions) return 'Transações';
		if (item.path === Routes.panel.merchant.cashouts) return 'Saques';
		if (item.path === Routes.panel.merchant.customers) return 'Clientes';
		return item.title;
	}

	return (
		<nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
			<div className="relative overflow-hidden rounded-full border border-white/12 bg-card/80 px-2 py-2 shadow-2xl backdrop-blur-xl">
				<div className="relative z-10 flex items-center">
					{mainItems.map((item) => {
						const active = isRouteActive(pathname, item.path);

						return (
							<div key={item.path} className="relative flex flex-1 flex-col items-center">
								{active && (
									<span className="absolute -top-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-link" />
								)}
								<Button
									variant="ghost"
									size="lg"
									isIconOnly
									isDisabled={item.isDisabled}
									onPress={() => navigate(item)}
									className={[
										'transition-all duration-160 ease-out',
										active ? 'text-white' : 'text-white/50',
									].join(' ')}
								>
									<div className="flex flex-col items-center">
										{getIconWithSize(item.iconName, 'icon-xl')}
										<span className="truncate text-[10px] font-bold leading-none mt-1">{getMobileLabel(item)}</span>
									</div>
								</Button>
							</div>
						);
					})}

					<div className="relative flex flex-1 flex-col items-center">
						<Button
							variant="ghost"
							size="lg"
							isIconOnly
							onPress={toggleSidebar}
							className="transition-all duration-160 ease-out text-muted-foreground hover:text-foreground"
						>
							<div className="flex flex-col items-center">
								<Icon icon={SidebarLeftIcon} className="icon-xl" />
								<span className="truncate text-[10px] font-bold leading-none mt-1">Menu</span>
							</div>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
