'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { SafefyBrandLogo } from '@/components/ui/safefy-brand-logo';
import { Logout01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

	function performLogout() {
		startTransition(async () => {
			router.push('/api/auth/signout');
		});
	}

	return (
		<div className="flex min-h-full flex-col bg-surface">
			{/* Logo — mirrors sidebar header */}
			<div className="flex h-12 shrink-0 items-center border-b border-divider px-3">
				<Link href={Routes.panel.merchant.dashboard} className="flex h-7 items-center">
					<SafefyBrandLogo iconSize={26} textClassName="text-2xl" />
				</Link>
			</div>

			{/* Organization selector */}
			<div className="shrink-0 border-b border-divider px-3 py-2">
				<SidebarMerchantSelector forceFull />
			</div>

			{/* KBar search */}
			<div className="shrink-0 border-b border-divider px-3 py-2">
				<SidebarKbar sections={sections} user={user} forceFull />
			</div>

			{/* Menu sections — accordion */}
			<div className="flex-1 px-3 py-2">
				<SidebarMenu sections={sections} forceFull />
			</div>

			{/* User info + logout */}
			<div className="shrink-0 space-y-2 border-t border-divider px-3 py-2">
				<SidebarUserInfo forceFull />
				<Button
					variant="primary"
					size="sm"
					className="w-full justify-start gap-3 hover:bg-danger hover:text-white"
					onPress={() => setShowLogoutConfirm(true)}
					isPending={isPending}
				>
					<Icon icon={Logout01Icon} className="icon-md" />
					<span>Sair</span>
				</Button>
			</div>

			<ConfirmationModal
				isOpen={showLogoutConfirm}
				onOpenChange={setShowLogoutConfirm}
				title="Sair da plataforma"
				description="Tem certeza que deseja encerrar sua sessão agora?"
				confirmLabel="Sair"
				status="danger"
				isPending={isPending}
				onConfirm={performLogout}
			/>
		</div>
	);
}
