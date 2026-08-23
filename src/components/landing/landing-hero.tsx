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
		<section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 bg-[#000000] text-white">
			{/* Subtle, restrained grid lines */}
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
					
					{/* Status Pill Badge */}
					<div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-card px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
						<span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
						<span className="text-success font-mono">Motor SPI Nativo:</span>
						<span className="text-white/60">Processamento PIX em Sub-50ms & Liquidação D+0</span>
					</div>

					{/* Main Headline */}
					<h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
						Processamento de Pagamentos PIX para a{' '}
						<span className="text-link">
							Elite do Digital.
						</span>
					</h1>

					{/* Subtitle */}
					<p className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl font-normal leading-relaxed">
						Liquidação instantânea em milissegundos, webhooks resilientes com HMAC, antifraude nativo e APIs de altíssima disponibilidade. Construído para quem não aceita instabilidade.
					</p>

					{/* CTAs */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2">
						<button
							type="button"
							onClick={() => onOpenAuth('signup')}
							className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-black hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer"
						>
							<span>Começar Agora Gratuitamente</span>
							<Icon icon={ArrowRight01Icon} className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</button>

						<button
							type="button"
							onClick={() => onOpenAuth('signin')}
							className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] cursor-pointer"
						>
							<span>Entrar no Painel</span>
						</button>

						<Link
							href="/docs"
							className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-transparent px-4 py-3.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
						>
							<Icon icon={CodeIcon} className="w-4 h-4 text-link" />
							<span>Documentação API</span>
						</Link>
					</div>

					{/* Trust Badges Bar */}
					<div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 border-t border-white/10 w-full max-w-3xl text-left">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-link border border-white/10">
								<Icon icon={ZapIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white font-mono">Sub-50ms</div>
								<div className="text-xs text-white/50">Latência média</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-success border border-white/10">
								<Icon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white font-mono">99.99% SLA</div>
								<div className="text-xs text-white/50">Uptime garantido</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-success border border-white/10">
								<Icon icon={LockKeyIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white font-mono">D+0 SPI</div>
								<div className="text-xs text-white/50">Saque imediato</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-link border border-white/10">
								<Icon icon={SecurityCheckIcon} className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white">PCI-DSS L1</div>
								<div className="text-xs text-white/50">Segurança máxima</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</section>
	);
}
