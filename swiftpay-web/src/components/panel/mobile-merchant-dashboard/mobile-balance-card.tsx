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
		<div className="relative overflow-hidden rounded-[28px] border border-success-soft-hover bg-linear-to-br from-content1 via-success-soft/70 to-accent/8 p-5 shadow-lg shadow-success-soft/40">
			<div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-success/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,transparent,rgba(255,255,255,0.05))]" />

			<div className="relative flex items-start justify-between gap-3">
				<div className="flex items-center gap-2">
					<p className="truncate text-sm font-semibold text-foreground/90">{merchantName ?? '-'}</p>
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
					className="border border-default-200/70 bg-background/70 backdrop-blur"
				>
					<Icon icon={isVisible ? ViewOffSlashIcon : ViewIcon} className="icon-xs text-default-500" />
				</Button>
			</div>

			<div className="mb-5">
				<p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-success/70">Disponível agora</p>
				{available !== null ? (
					<AnimatedCurrency
						value={available}
						className={`text-3xl font-bold tabular-nums text-foreground ${isVisible ? '' : 'visual-blur'}`}
					/>
				) : (
					<span className="text-3xl font-bold text-foreground">-</span>
				)}
			</div>

			<div className={`relative z-10 grid gap-2 ${hasReserveEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
				<div className="rounded-2xl border border-warning-soft-hover bg-warning-soft/85 px-3 py-3 shadow-xs">
					<p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-warning/80">Pendente</p>
					{pending !== null ? (
						<AnimatedCurrency
							value={pending}
							className={`text-base font-semibold tabular-nums text-foreground ${isVisible ? '' : 'visual-blur'}`}
						/>
					) : (
						<span className="text-base font-semibold text-foreground">-</span>
					)}
					<p className="mt-1 text-[11px] leading-4 text-muted">Valores aguardando compensação.</p>
				</div>

				{hasReserveEnabled && (
					<div className="rounded-2xl border border-secondary-soft-hover bg-secondary-soft/70 px-3 py-3 shadow-xs">
						<p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-secondary/80">Reservado</p>
						{reserved !== null ? (
							<AnimatedCurrency
								value={reserved}
								className={`text-base font-semibold tabular-nums text-foreground ${isVisible ? '' : 'visual-blur'}`}
							/>
						) : (
							<span className="text-base font-semibold text-foreground">-</span>
						)}
						<p className="mt-1 text-[11px] leading-4 text-muted">Saldo retido por reserva financeira configurada.</p>
					</div>
				)}
			</div>
		</div>
	);
}
