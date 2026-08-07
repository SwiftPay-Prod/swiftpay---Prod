'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import {
	ArrowRight01Icon,
	SecurityCheckIcon,
	ZapIcon,
	CodeIcon,
	CheckmarkCircle02Icon,
	LockKeyIcon,
} from '@hugeicons/core-free-icons';

interface LandingHeroProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingHero({ onOpenAuth }: LandingHeroProps) {
	return (
		<section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
			{/* Subtle, restrained subtle grid lines - No bubbly blobs */}
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e263815_1px,transparent_1px),linear-gradient(to_bottom,#1e263815_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
					
					{/* Status Pill Badge */}
					<div className="inline-flex items-center gap-2 rounded-full border border-[#1E2638] bg-[#121721] px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm">
						<span className="flex h-2 w-2 rounded-full bg-[#A3E635] animate-pulse" />
						<span className="text-[#A3E635]">Motor SPI Nativo:</span>
						<span className="text-muted-foreground">Processamento PIX em Sub-50ms & Liquidação D+0</span>
					</div>

					{/* Main Headline */}
					<h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
						Processamento de Pagamentos PIX para a{' '}
						<span className="bg-gradient-to-r from-[#A3E635] via-[#10B981] to-[#3B82F6] bg-clip-text text-transparent">
							Elite do Digital.
						</span>
					</h1>

					{/* Subtitle */}
					<p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
						Liquidação instantânea em milissegundos, webhooks resilientes com HMAC, antifraude nativo e APIs de altíssima disponibilidade. Construído para quem não aceita instabilidade.
					</p>

					{/* CTAs */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2">
						<button
							type="button"
							onClick={() => onOpenAuth('signup')}
							className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#A3E635] px-6 py-3.5 text-base font-bold text-[#0B0E14] shadow-[0_4px_20px_rgba(163,230,53,0.3)] hover:bg-[#b2f042] active:scale-[0.98] transition-all"
						>
							<span>Começar Agora Gratuitamente</span>
							<Icon icon={ArrowRight01Icon} className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</button>

						<button
							type="button"
							onClick={() => onOpenAuth('signin')}
							className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface-secondary/70 px-6 py-3.5 text-base font-semibold text-foreground hover:bg-surface-secondary hover:border-border transition-all active:scale-[0.98]"
						>
							<span>Entrar no Painel</span>
						</button>

						<Link
							href="/docs"
							className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:text-[#A3E635] transition-colors"
						>
							<Icon icon={CodeIcon} className="w-4 h-4 text-[#A3E635]" />
							<span>Documentação API</span>
						</Link>
					</div>

					{/* Trust Badges Bar */}
					<div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 border-t border-border/50 w-full max-w-3xl text-left">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-[#A3E635] border border-border/60">
								<Icon icon={ZapIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-foreground">Sub-50ms</div>
								<div className="text-xs text-muted-foreground">Latência média</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-[#A3E635] border border-border/60">
								<Icon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-foreground">99.99% SLA</div>
								<div className="text-xs text-muted-foreground">Uptime garantido</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-[#A3E635] border border-border/60">
								<Icon icon={LockKeyIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-foreground">D+0 Nativo</div>
								<div className="text-xs text-muted-foreground">Saque imediato</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-[#A3E635] border border-border/60">
								<Icon icon={SecurityCheckIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-foreground">PCI-DSS Level 1</div>
								<div className="text-xs text-muted-foreground">Segurança máxima</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</section>
	);
}
