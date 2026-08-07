'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useMerchant } from '@/contexts/merchant-context';
import { PanelSidebar } from './panel-sidebar';
import { PanelHeader } from './panel-header';
import { PanelContent } from './panel-content';
import { getPageTitle } from '@/utils/utils-routes';
import { BulletinProvider } from '@/providers/bulletin-provider';
import type { UserInfo } from '@/types/auth';
import { Routes } from '@/router/routes';

interface PanelLayoutProps {
	children: ReactNode;
}

export function PanelLayout({ children }: PanelLayoutProps) {
	const pathname = usePathname();
	const { user } = useUser();
	const { selectedMerchant } = useMerchant();
	const title = pathname === Routes.panel.merchant.new
		? selectedMerchant
			? 'Editar organização'
			: 'Criar organização'
		: getPageTitle(pathname);

	return (
		<BulletinProvider>
			<PanelLayoutInner user={user} title={title}>
				{children}
			</PanelLayoutInner>
		</BulletinProvider>
	);
}

function PanelLayoutInner({ user, title, children }: { user: UserInfo; title?: string; children: ReactNode }) {
	return (
		<div className="flex h-dvh overflow-hidden">
			<PanelSidebar user={user} />
			<div className="flex min-w-0 w-full grow flex-col bg-background min-h-0">
				<PanelHeader title={title} user={user} />
				<div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
					<PanelContent>{children}</PanelContent>
				</div>
			</div>
		</div>
	);
}

