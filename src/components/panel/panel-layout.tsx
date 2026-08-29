'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useMerchant } from '@/contexts/merchant-context';
import { PanelSidebar } from './panel-sidebar';
import { PanelHeader } from './panel-header';
import { PanelContent } from './panel-content';
import { SandboxWarningBar } from './sandbox-warning-bar';
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
		<div className="flex flex-col h-dvh">
			<SandboxWarningBar />
			<div className="flex flex-1 min-h-0">
				<PanelSidebar user={user} />

				<div className="flex min-w-0 w-full grow flex-col bg-background min-h-0 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
					<PanelHeader title={title} user={user} />
					<PanelContent>{children}</PanelContent>
				</div>
			</div>
		</div>
	);
}

