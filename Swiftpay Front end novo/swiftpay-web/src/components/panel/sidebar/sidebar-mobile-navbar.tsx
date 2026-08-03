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

	const menuItemByPath = new Map(allMenuItems.map((item) => [item.path, item]));
	const quickPaths = [
		Routes.panel.merchant.dashboard,
		Routes.panel.merchant.transactions,
		Routes.panel.merchant.cashouts,
		Routes.panel.merchant.customers,
	];

	const selectedItems: RouteConfig[] = [];

	for (const path of quickPaths) {
		const candidate = menuItemByPath.get(path);
		if (!candidate) continue;
		if (selectedItems.some((item) => item.path === candidate.path)) continue;
		selectedItems.push(candidate);
		if (selectedItems.length === 4) break;
	}

	const merchantFallbackItems = allMenuItems.filter((item) => item.path.startsWith('/panel/merchant/'));

	for (const fallbackItem of merchantFallbackItems) {
		if (selectedItems.some((item) => item.path === fallbackItem.path)) continue;
		selectedItems.push(fallbackItem);
		if (selectedItems.length === 4) break;
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
		<nav className="fixed bottom-5 left-4 right-4 z-40 md:hidden">
			<div className="relative overflow-hidden rounded-[22px] border border-accent-soft-hover bg-surface/55 px-2 py-2 backdrop-blur-3xl ring-1 ring-accent-soft-hover">
				<div className="pointer-events-none absolute -top-10 left-1/2 h-18 w-44 -translate-x-1/2 rounded-full bg-accent-soft-hover opacity-70 blur-2xl" />
				<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent-soft to-accent-soft-hover opacity-18" />
				<div className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-linear-to-b from-foreground/20 to-transparent opacity-45" />
				<div className="pointer-events-none absolute inset-0 rounded-[22px] border border-default/60" />
				<div className="relative z-10 flex items-center">
					{mainItems.map((item) => {
						const active = isRouteActive(pathname, item.path);

						return (
							<div key={item.path} className="relative flex flex-1 flex-col items-center">
								{active && (
									<span className="absolute -top-1 left-1/2 h-0.75 w-5 -translate-x-1/2 rounded-full bg-accent" />
								)}
								<Button
									variant="ghost"
									size="lg"
									isIconOnly
									isDisabled={item.isDisabled}
									onPress={() => navigate(item)}
									className={[
										'transition-all duration-160 ease-out',
										active ? 'text-accent!' : 'text-muted-foreground',
									].join(' ')}
								>
									<div className="flex flex-col items-center">
										{getIconWithSize(item.iconName, 'icon-xl')}
										<span className="truncate text-[9px] font-semibold leading-none">{getMobileLabel(item)}</span>
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
							className="transition-all duration-160 ease-out text-muted-foreground"
						>
							<div className="flex flex-col items-center">
								<Icon icon={SidebarLeftIcon} className="icon-xl" />
								<span className="truncate text-[9px] font-semibold leading-none">Menu</span>
							</div>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
