'use client';

import { Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SidebarLeftIcon } from '@hugeicons/core-free-icons';
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
	const { sidebar, balance, admin, merchant } = usePanelHeader({ user });

	function handleMenuPress() {
		sidebar.toggleSidebar();
	}

	return (
		<div className="sticky top-0 z-30 shrink-0 bg-background border-b border-divider">
			<header className="h-12 flex items-center justify-between px-3">
				<div className="flex items-center gap-2 min-w-0 grow">
					<Button variant="ghost" size="sm" isIconOnly onPress={handleMenuPress} aria-label="Menu" className="shrink-0 text-muted">
						<Icon icon={SidebarLeftIcon} className="icon-md" />
					</Button>

					{title && (
						<h1 className="text-sm font-medium text-foreground truncate max-w-32 sm:max-w-48 md:max-w-none">
							{title}
						</h1>
					)}
				</div>

				<div className="flex items-center gap-1 md:gap-2 shrink-0">
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
						<div className="flex items-center gap-1">
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

					<div className="flex items-center gap-0.5">
						<NotificationPopover />
					</div>
				</div>
			</header>
		</div>
	);
}
