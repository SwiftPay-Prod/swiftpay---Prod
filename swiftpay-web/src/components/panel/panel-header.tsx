'use client';

import { useRouter } from 'next/navigation';
import { usePanelHeader } from '@/hooks/use-panel-header';
import { useMerchant } from '@/contexts/merchant-context';
import { NotificationPopover } from './notifications';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { Routes } from '@/router/routes';
import type { UserInfo } from '@/types/auth';

interface PanelHeaderProps {
	title?: string;
	user?: UserInfo;
}

export function PanelHeader({ title, user }: PanelHeaderProps) {
	const router = useRouter();
	const { balance } = usePanelHeader({ user });
	const { selectedMerchant, triggerDashboardRefresh } = useMerchant();
	const isBalanceVisible = balance.isVisible;
	const toggleBalanceVisibility = balance.toggleVisibility;

	const initials = selectedMerchant?.name
		? selectedMerchant.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
		: '??';

	return (
		<div className="sticky top-0 z-30 shrink-0 bg-card border-b border-border">
			<header className="flex items-center justify-between px-6 py-3">
				<div className="flex items-center gap-3 min-w-0">
					{title && (
						<h1 className="text-base font-semibold text-foreground truncate">
							{title}
						</h1>
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={toggleBalanceVisibility}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/15 rounded-md transition-colors"
					>
						{isBalanceVisible ? (
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						) : (
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
								<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
								<path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
								<line x1="2" x2="22" y1="2" y2="22" />
							</svg>
						)}
						Ofuscar
					</button>

					<button
						type="button"
						onClick={() => router.push(Routes.panel.merchant.liveBalance)}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 rounded-md transition-colors cursor-pointer active:scale-95"
					>
						<span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
						Live
					</button>

					<div className="flex items-center gap-1">
						<NotificationPopover />
					</div>

					<button
						type="button"
						onClick={() => triggerDashboardRefresh()}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all shadow-sm active:scale-95"
					>
						<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
							<path d="M21 3v5h-5" />
						</svg>
						Atualizar
					</button>
				</div>
			</header>
		</div>
	);
}
