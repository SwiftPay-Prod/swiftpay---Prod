'use client';

import { Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Moon02Icon, SidebarLeftIcon, Sun02Icon } from '@hugeicons/core-free-icons';
import { NotificationPopover } from './notifications';
import type { UserInfo } from '@/types/auth';
import { usePanelHeader } from '@/hooks/use-panel-header';
import { AdminRevenueCard } from './header/admin-revenue-card';
import { MerchantBalanceCard } from './header/merchant-balance-card';
import { UserMetaCard } from './header/user-meta-card';

interface PanelHeaderProps {
	title?: string;
	user?: UserInfo;
}

export function PanelHeader({ title, user }: PanelHeaderProps) {
	const { sidebar, theme, balance, admin, merchant } = usePanelHeader({ user });

	function handleMenuPress() {
		sidebar.toggleSidebar();
	}

	return (
		<div className="sticky top-0 z-30 shrink-0 bg-background w-full">
			<header className="h-14 bg-surface border-divider flex items-center justify-between shrink-0 p-2 border border-default">
				<div className="flex items-center gap-1 md:gap-2 min-w-0 grow ">
					<Button variant="ghost" size="sm" isIconOnly onPress={handleMenuPress} aria-label="Menu" className="shrink-0">
						<Icon icon={SidebarLeftIcon} className="icon-md text-default-500" />
					</Button>

					{title && (
						<h1 className="text-sm md:text-lg font-semibold text-foreground truncate max-w-32 sm:max-w-48 md:max-w-none">
							{title}
						</h1>
					)}
				</div>

				<div className="flex items-center gap-1.5 md:gap-3 shrink-0">
					{admin.isAdmin && (
						<div className="hidden md:block">
							<AdminRevenueCard
								platformRevenue={admin.platformRevenue}
								platformBalance={admin.platformBalance}
								isBalanceVisible={balance.isVisible}
								onToggleVisibility={balance.toggleVisibility}
								visibleAcquirers={admin.visibleAcquirers}
							/>
						</div>
					)}

					{merchant.selectedMerchant && (
						<div className="flex items-center gap-1.5">
							<MerchantBalanceCard
								companyName={merchant.selectedMerchant.name}
								lifetimeVolume={balance.lifetimeVolume}
								balanceAvailable={balance.merchantBalance?.available ?? null}
								balancePending={balance.merchantBalance?.pending ?? null}
								balanceReserved={balance.merchantBalance?.reserved ?? null}
								balanceTotal={balance.merchantBalance?.total ?? null}
								balanceUpdatedAt={balance.merchantBalanceUpdatedAt}
								isBalanceVisible={balance.isVisible}
								onToggleVisibility={balance.toggleVisibility}
							/>
							<div className="hidden md:block">
								<UserMetaCard
									level={merchant.levelInfo?.current ?? null}
									progress={merchant.levelInfo?.progress ?? null}
									displayName={merchant.levelInfo?.currentDisplayName ?? null}
									nextLevelDisplayName={merchant.levelInfo?.nextLevelDisplayName ?? null}
									totalVolume={merchant.levelInfo?.totalVolume ?? null}
									maxThreshold={merchant.levelInfo?.maxThreshold ?? null}
									isBalanceVisible={balance.isVisible}
								/>
							</div>
						</div>
					)}

					<Button variant="ghost" size="lg" isIconOnly aria-label="Alternar tema" onPress={theme.toggleTheme}>
						<span className="dark:hidden">
							<Icon icon={Moon02Icon} className="icon-md text-default-500" />
						</span>
						<span className="hidden dark:inline">
							<Icon icon={Sun02Icon} className="icon-md text-default-500" />
						</span>
					</Button>
					<NotificationPopover />
				</div>
			</header>
		</div>
	);
}
