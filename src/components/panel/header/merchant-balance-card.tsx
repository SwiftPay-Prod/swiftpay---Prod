'use client';

import { useState } from 'react';
import { Button, Popover, Tooltip } from '@heroui/react';
import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	HelpCircleIcon,
	ChampionIcon,
	ViewIcon,
	ViewOffSlashIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { formatRelativeTime } from '@/utils/datetime';
import { Routes } from '@/router/routes';

interface MerchantBalanceCardProps {
	companyName?: string | null;
	lifetimeVolume: number | null;
	balanceAvailable: number | null;
	balancePending: number | null;
	balanceReserved: number | null;
	balanceTotal: number | null;
	balanceUpdatedAt: string | null;
	isBalanceVisible: boolean;
	onToggleVisibility: () => void;
}

export function MerchantBalanceCard({
	companyName,
	lifetimeVolume,
	balanceAvailable,
	balancePending,
	balanceReserved,
	balanceTotal,
	balanceUpdatedAt,
	isBalanceVisible,
	onToggleVisibility,
}: MerchantBalanceCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger>
				<div className="group relative flex items-center gap-1 md:gap-2 rounded-full border h-8 md:h-9 min-w-24 md:min-w-28 px-2.5 md:px-3 py-1 md:py-1.5 overflow-hidden cursor-pointer hover:bg-success/15 transition-colors shrink-0 bg-success/10 border-success/30 text-success">
					<Icon icon={Wallet01Icon} className="icon-xs hidden sm:block relative text-success" />
					<AnimatedCurrency
						value={balanceAvailable}
						className={`text-xs md:text-sm font-bold font-mono tabular-nums relative text-success ${isBalanceVisible ? '' : 'visual-blur'}`}
					/>
					<Icon
						icon={ArrowDown01Icon}
						className={`icon-xs relative transition-transform ${isOpen ? 'rotate-180' : ''} text-success`}
					/>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-0 w-72 sm:w-80 bg-card border border-white/12 rounded-2xl text-white" placement="bottom">
				<div className="p-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<span className="text-sm font-semibold text-foreground">Saldo da Organização</span>
							{companyName && <p className="text-xs text-muted">{companyName}</p>}
						</div>
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
					<div className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/30">
						<div className="flex items-center gap-2">
							<Icon icon={ChampionIcon} className="icon-xs text-warning" />
								<span className="text-xs text-muted">Faturamento</span>
								<Tooltip>
									<Tooltip.Trigger>
										<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
									</Tooltip.Trigger>
									<Tooltip.Content className="max-w-56">
										<Tooltip.Arrow />
										Volume bruto total de todos os pagamentos recebidos.
									</Tooltip.Content>
								</Tooltip>
							</div>
							<AnimatedCurrency value={lifetimeVolume} className={`text-sm font-bold text-warning ${isBalanceVisible ? '' : 'visual-blur'}`} />
						</div>
						<div className="grid grid-cols-3 gap-2">
							<div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface border border-default">
								<span className="text-xs text-muted">Pendente</span>
								<AnimatedCurrency value={balancePending} className={`text-xs font-semibold text-warning ${isBalanceVisible ? '' : 'visual-blur'}`} />
							</div>
							<div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface border border-default">
								<span className="text-xs text-muted">Reservado</span>
								<AnimatedCurrency value={balanceReserved} className={`text-xs font-semibold text-danger ${isBalanceVisible ? '' : 'visual-blur'}`} />
							</div>
							<div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface border border-default">
								<span className="text-xs text-muted">Total</span>
								<AnimatedCurrency value={balanceTotal} className={`text-xs font-semibold ${isBalanceVisible ? '' : 'visual-blur'}`} />
							</div>
						</div>
						{balanceUpdatedAt && (
							<div className="flex items-center gap-1 text-xs text-muted">
								<span>Atualizado {formatRelativeTime(balanceUpdatedAt)}</span>
							</div>
						)}
					</div>
					<Link
						href={Routes.panel.merchant.dashboard}
						onClick={() => setIsOpen(false)}
						className="flex items-center justify-center gap-1 mt-3 py-2 px-3 rounded-lg bg-accent/10 hover:bg-accent-soft-hover border border-accent/30 transition-colors"
					>
						<span className="text-xs font-medium text-accent">Ver Dashboard</span>
						<Icon icon={ArrowRight01Icon} className="icon-xs text-accent" />
					</Link>
				</div>
			</Popover.Content>
		</Popover>
	);
}
