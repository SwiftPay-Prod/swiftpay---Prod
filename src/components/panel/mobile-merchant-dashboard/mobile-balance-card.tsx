'use client';

import { Button, Chip } from '@heroui/react';
import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { merchantStatusParse, mapParseColorToChipColor } from '@/parse';

interface MobileBalanceCardProps {
	merchantName: string | null;
	merchantStatus?: string;
	available: number | null;
	pending: number | null;
	reserved: number | null;
	hasReserveEnabled: boolean;
	isVisible: boolean;
	onToggleVisibility: () => void;
}

export function MobileBalanceCard({
	merchantName,
	merchantStatus,
	available,
	pending,
	reserved,
	hasReserveEnabled,
	isVisible,
	onToggleVisibility,
}: MobileBalanceCardProps) {
	const statusParse = merchantStatus ? merchantStatusParse[merchantStatus as keyof typeof merchantStatusParse] : null;

	return (
		<div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-card p-6">
			<div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
			<div className="relative z-10 flex flex-col gap-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-bold tracking-tight text-white">{merchantName ?? '-'}</p>
						{statusParse && (
							<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm">
								{statusParse.label}
							</Chip>
						)}
					</div>
					<Button
						variant="tertiary"
						size="sm"
						isIconOnly
						aria-label={isVisible ? 'Ocultar valores' : 'Mostrar valores'}
						onPress={onToggleVisibility}
						className="border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-full"
					>
						<Icon icon={isVisible ? ViewOffSlashIcon : ViewIcon} className="icon-xs" />
					</Button>
				</div>
				<div>
					<p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">Disponível agora</p>
					{available !== null ? (
						<AnimatedCurrency
							value={available}
							className={`font-mono text-3xl font-extrabold tabular-nums tracking-tight text-white ${isVisible ? '' : 'visual-blur'}`}
						/>
					) : (
						<span className="font-mono text-3xl font-extrabold tabular-nums text-white">-</span>
					)}
				</div>

				<div className={`grid gap-3 ${hasReserveEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
					<div className="rounded-[12px] bg-surface-deep border border-white/8 px-3 py-3">
						<p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">Pendente</p>
						{pending !== null ? (
							<AnimatedCurrency
								value={pending}
								className={`font-mono text-base font-bold tabular-nums text-white/80 ${isVisible ? '' : 'visual-blur'}`}
							/>
						) : (
							<span className="font-mono text-base font-bold tabular-nums text-white/80">-</span>
						)}
						<p className="mt-1 text-[11px] text-white/50 leading-snug">Valores aguardando compensação.</p>
					</div>

					{hasReserveEnabled && (
						<div className="rounded-[12px] bg-surface-deep border border-white/8 px-3 py-3">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">Reservado</p>
							{reserved !== null ? (
								<AnimatedCurrency
									value={reserved}
									className={`font-mono text-base font-bold tabular-nums text-white/80 ${isVisible ? '' : 'visual-blur'}`}
								/>
							) : (
								<span className="font-mono text-base font-bold tabular-nums text-white/80">-</span>
							)}
							<p className="mt-1 text-[11px] text-white/50 leading-snug">Saldo retido por reserva financeira.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
