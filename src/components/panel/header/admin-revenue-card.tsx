'use client';

import { useState } from 'react';
import { Button, Chip, Popover, Separator, Tooltip, Avatar } from '@heroui/react';
import {
	AnalyticsUpIcon,
	ArrowDown01Icon,
	ArrowRight01Icon,
	HelpCircleIcon,
	MoneyReceiveSquareIcon,
	ServerStack01Icon,
	ShieldEnergyIcon,
	ViewIcon,
	ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { formatCurrencyCompact } from '@/utils/currency';
import type {
	AdminAcquirerRevenueData,
	AdminPlatformBalanceData,
	AdminPlatformRevenueData,
} from '@/types/admin/dashboard';
import { AcquirerOperationType } from '@/types/enums';
import { acquirerOperationTypeParse } from '@/parse/acquirer';
import { Routes } from '@/router/routes';

interface AdminRevenueCardProps {
	platformRevenue: AdminPlatformRevenueData | null;
	platformBalance: AdminPlatformBalanceData | null;
	isBalanceVisible: boolean;
	onToggleVisibility: () => void;
	visibleAcquirers: AdminAcquirerRevenueData[];
}

export function AdminRevenueCard({
	platformRevenue,
	platformBalance,
	isBalanceVisible,
	onToggleVisibility,
	visibleAcquirers,
}: AdminRevenueCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const totalAvailableForWithdrawal =
		platformBalance?.totalAvailableForWithdrawal ??
		platformBalance?.acquirerBalances?.reduce((sum, acq) => sum + acq.availableForWithdrawal, 0) ??
		0;

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger>
				<div className="group relative flex items-center gap-1 md:gap-2 rounded-lg border h-8 md:h-9 min-w-24 md:min-w-28 px-2.5 md:px-3 py-1 md:py-1.5 overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors shrink-0 bg-linear-to-r from-accent/10 via-accent/5 to-accent/10 border-accent/30">
					<div className="absolute inset-0 -translate-x-full animate-shine-pulse bg-linear-to-r from-transparent via-white/20 to-transparent" />
					<Icon icon={ShieldEnergyIcon} className="icon-xs hidden sm:block relative text-accent" />
					<AnimatedCurrency
						value={totalAvailableForWithdrawal}
						className={`text-xs md:text-sm font-bold relative text-accent ${isBalanceVisible ? '' : 'visual-blur'}`}
					/>
					<Icon
						icon={ArrowDown01Icon}
						className={`icon-xs relative transition-transform ${isOpen ? 'rotate-180' : ''} text-accent`}
					/>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-0 w-80 sm:w-96" placement="bottom">
				<div className="p-3">
					<div className="flex items-center justify-between mb-3">
						<span className="text-sm font-semibold text-foreground">Resumo da Plataforma</span>
						<Button
							variant="ghost"
							size="sm"
							isIconOnly
							aria-label={isBalanceVisible ? 'Ocultar valores' : 'Mostrar valores'}
							onPress={onToggleVisibility}
						>
							<Icon icon={isBalanceVisible ? ViewOffSlashIcon : ViewIcon} className="icon-xs text-default-500" />
						</Button>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
							<div className="flex items-center gap-2">
								<Icon icon={AnalyticsUpIcon} className="icon-xs text-emerald-500" />
								<span className="text-xs text-muted">Disponível para Saque</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-56">
									<Tooltip.Arrow />
										Saldo realmente disponível para saque, distribuível entre adquirentes.
								</Tooltip.Content>
							</Tooltip>
						</div>
						<span className={`text-sm font-bold text-emerald-600 dark:text-emerald-400 ${isBalanceVisible ? '' : 'visual-blur'}`}>
							{formatCurrencyCompact(totalAvailableForWithdrawal)}
						</span>
						</div>
						<div className="flex items-center justify-between p-2 rounded-lg bg-accent/10 border border-accent/30">
							<div className="flex items-center gap-2">
						<Icon icon={MoneyReceiveSquareIcon} className="icon-xs text-accent" />
								<span className="text-xs text-muted">Total de entrada nas adquirentes</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-56">
										<Tooltip.Arrow />
										Soma dos saldos de entrada de todas as adquirentes.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<span className={`text-sm font-bold text-accent ${isBalanceVisible ? '' : 'visual-blur'}`}>
								{formatCurrencyCompact(platformRevenue?.totalVolume ?? 0)}
							</span>
						</div>
					</div>

					{visibleAcquirers.length > 0 && (
						<>
							<Separator className="my-3" />
							<div className="flex items-center gap-1 mb-2">
								<span className="text-xs font-medium text-muted">Saldo disponível por adquirente</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-56">
										<Tooltip.Arrow />
										Saldo disponível para saque da SwiftPay em cada adquirente.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<div className="space-y-2">
								{visibleAcquirers.map((acq) => (
									<AcquirerRevenueCard key={acq.acquirerId} acquirer={acq} isBalanceVisible={isBalanceVisible} />
								))}
							</div>
							<Link
								href={Routes.panel.admin.balances}
								onClick={() => setIsOpen(false)}
								className="flex items-center justify-center gap-1 mt-3 py-2 px-3 rounded-lg bg-accent/10 hover:bg-accent-soft-hover border border-accent/30 transition-colors"
							>
								<span className="text-xs font-medium text-accent">Ir para saldos da plataforma</span>
								<Icon icon={ArrowRight01Icon} className="icon-xs text-accent" />
							</Link>
						</>
					)}
				</div>
			</Popover.Content>
		</Popover>
	);
}

interface AcquirerRevenueCardProps {
	acquirer: AdminAcquirerRevenueData;
	isBalanceVisible: boolean;
}

function AcquirerRevenueCard({ acquirer, isBalanceVisible }: AcquirerRevenueCardProps) {
	const totalTransactions = acquirer.transactions + acquirer.payoutTransactions;

	return (
		<div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-default">
			<div className="flex items-center gap-2 min-w-0">
				{acquirer.acquirerLogoUrl ? (
					<Avatar size="sm" className="size-6 shrink-0">
						<Avatar.Image src={acquirer.acquirerLogoUrl} alt={acquirer.acquirerName} />
						<Avatar.Fallback>
							<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
						</Avatar.Fallback>
					</Avatar>
				) : (
					<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-content1">
						<Icon icon={ServerStack01Icon} className="icon-xs text-muted" />
					</div>
				)}
				<div className="flex flex-col gap-0.5 min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="text-xs font-medium text-foreground truncate">{acquirer.acquirerName}</span>
						{acquirer.operationTypes.map((type) => {
							const parsed = acquirerOperationTypeParse[type as AcquirerOperationType];
							return (
								<Chip
									key={type}
									variant="soft"
									size="sm"
									className={`h-4 gap-0.5 text-xs px-1 ${parsed?.className ?? ''}`}
								>
									{parsed?.icon}
									{parsed?.label ?? type}
								</Chip>
							);
						})}
					</div>
					<div className="flex items-center gap-1.5">
						<span className="text-xs text-muted font-mono">{acquirer.acquirerCode}</span>
						<span className="text-xs text-muted">· {totalTransactions.toLocaleString('pt-BR')} transações</span>
					</div>
				</div>
			</div>
			<div className="flex flex-col items-end shrink-0">
				<div className="text-right">
					<p className="text-xs text-muted">Total entrada</p>
					<span className={`text-sm font-semibold text-foreground ${isBalanceVisible ? '' : 'visual-blur'}`}>
						{formatCurrencyCompact(acquirer.volume)}
					</span>
				</div>
				<div className="text-right">
					<p className="text-xs text-muted">Saldo da plataforma</p>
					<span className={`text-xs font-semibold text-success ${isBalanceVisible ? '' : 'visual-blur'}`}>
						{formatCurrencyCompact(acquirer.settlement)}
					</span>
				</div>
			</div>
		</div>
	);
}

