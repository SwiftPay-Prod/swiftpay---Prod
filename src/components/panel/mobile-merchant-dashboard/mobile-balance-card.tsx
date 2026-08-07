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
		<div className="relative overflow-hidden rounded-lg border border-border/80 bg-card p-4 shadow-2xs">
			<div className="relative flex items-start justify-between gap-3 mb-4">
				<div className="flex items-center gap-2">
					<p className="truncate text-sm font-bold text-foreground">{merchantName ?? '-'}</p>
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
					className="border border-border bg-surface-secondary text-muted-foreground hover:text-foreground"
				>
					<Icon icon={isVisible ? ViewOffSlashIcon : ViewIcon} className="icon-xs" />
				</Button>
			</div>
			<div className="mb-5">
				<p className="mb-1 text-\[0.6875rem\] font-bold uppercase tracking-[0.14em] text-accent">Disponível agora</p>
				{available !== null ? (
					<AnimatedCurrency
						value={available}
						className={`text-3xl sm:text-4xl font-extrabold tabular-nums text-foreground tracking-tight ${isVisible ? '' : 'visual-blur'}`}
					/>
				) : (
					<span className="text-3xl font-extrabold text-foreground">-</span>
				)}
			</div>

			<div className={`relative z-10 grid gap-2.5 ${hasReserveEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
				<div className="rounded-md bg-surface border border-border/80 px-3 py-2.5">
					<p className="mb-1 text-\[0.625rem\] font-bold uppercase tracking-[0.14em] text-warning">Pendente</p>
					{pending !== null ? (
						<AnimatedCurrency
							value={pending}
							className={`text-base font-bold tabular-nums text-foreground ${isVisible ? '' : 'visual-blur'}`}
						/>
					) : (
						<span className="text-base font-bold text-foreground">-</span>
					)}
					<p className="mt-1 text-\[0.6875rem\] text-muted-foreground leading-snug">Valores aguardando compensação.</p>
				</div>

				{hasReserveEnabled && (
					<div className="rounded-md bg-surface border border-border/80 px-3 py-2.5">
						<p className="mb-1 text-\[0.625rem\] font-bold uppercase tracking-[0.14em] text-info">Reservado</p>
						{reserved !== null ? (
							<AnimatedCurrency
								value={reserved}
								className={`text-base font-bold tabular-nums text-foreground ${isVisible ? '' : 'visual-blur'}`}
							/>
						) : (
							<span className="text-base font-bold text-foreground">-</span>
						)}
						<p className="mt-1 text-\[0.6875rem\] text-muted-foreground leading-snug">Saldo retido por reserva financeira.</p>
					</div>
				)}
			</div>
		</div>
	);
}
