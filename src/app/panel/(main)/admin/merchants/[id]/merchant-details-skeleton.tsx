'use client';

import { Button, Card, Skeleton, Separator, Tabs } from '@heroui/react';
import { ArrowLeft01Icon, Building02Icon, CheckListIcon, RepeatIcon, Settings02Icon, UserGroupIcon, Wallet01Icon, Wallet03Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

export function MerchantDetailsSkeleton() {
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-start justify-between md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Button isIconOnly variant="tertiary" onPress={() => router.push(Routes.panel.admin.merchants)}>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</Button>
					<div>
						<Skeleton className="h-8 w-56 rounded-lg" />
						<Skeleton className="mt-2 h-4 w-72 rounded-lg" />
					</div>
				</div>
			</div>

			<Tabs selectedKey="general">
				<Tabs.ListContainer>
					<Tabs.List aria-label="Abas de detalhes do merchant">
						<Tabs.Tab id="general">
							<div className="flex items-center gap-2">
								<Icon icon={Building02Icon} className="icon-sm" />
								<span>Geral</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="settings">
							<div className="flex items-center gap-2">
								<Icon icon={Settings02Icon} className="icon-sm" />
								<span>Ajustes</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="history">
							<div className="flex items-center gap-2">
								<Icon icon={CheckListIcon} className="icon-sm" />
								<span>Histórico</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="balances">
							<div className="flex items-center gap-2">
								<Icon icon={Wallet01Icon} className="icon-sm" />
								<span>Saldos</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="reconciliation">
							<div className="flex items-center gap-2">
								<Icon icon={RepeatIcon} className="icon-sm" />
								<span>Reconciliação</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="dashboard">
							<div className="flex items-center gap-2">
								<Icon icon={Building02Icon} className="icon-sm" />
								<span>Dashboard</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="transactions">
							<div className="flex items-center gap-2">
								<Icon icon={Wallet01Icon} className="icon-sm" />
								<span>Transações</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="customers">
							<div className="flex items-center gap-2">
								<Icon icon={UserGroupIcon} className="icon-sm" />
								<span>Clientes</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="cashouts">
							<div className="flex items-center gap-2">
								<Icon icon={Wallet03Icon} className="icon-sm" />
								<span>Saques</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
					</Tabs.List>
				</Tabs.ListContainer>
				<Tabs.Panel id="general" className="p-0">
					<div className="pt-4 flex flex-col gap-6">
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Card key={i}>
									<Card.Content className="flex flex-col items-center gap-3 py-6">
										<Skeleton className="size-12 rounded-full" />
										<Skeleton className="h-6 w-24 rounded-lg" />
										<Skeleton className="h-4 w-32 rounded-lg" />
									</Card.Content>
								</Card>
							))}
						</div>

						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Card key={i}>
									<Card.Header>
										<div className="flex items-center gap-2">
											<Skeleton className="size-5 rounded-md" />
											<Skeleton className="h-5 w-40 rounded-lg" />
										</div>
									</Card.Header>
									<Separator />
									<Card.Content className="flex flex-col gap-4">
										{Array.from({ length: 4 }).map((_, j) => (
											<div key={j} className="flex justify-between">
												<Skeleton className="h-4 w-28 rounded-lg" />
												<Skeleton className="h-4 w-36 rounded-lg" />
											</div>
										))}
									</Card.Content>
								</Card>
							))}
						</div>
					</div>
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
