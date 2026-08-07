'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { Menu01Icon, Cancel01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface LandingHeaderProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingHeader({ onOpenAuth }: LandingHeaderProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ label: 'Recursos', href: '#features' },
		{ label: 'Desenvolvedores', href: '#developer' },
		{ label: 'Segurança', href: '#security' },
		{ label: 'FAQ', href: '#faq' },
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/60 bg-[#0B0E14]/85 backdrop-blur-xl transition-all">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<SwiftPayBrandLogo iconSize={36} showText textClassName="text-xl font-extrabold tracking-tight" />
				</Link>

				{/* Desktop Navigation Links */}
				<nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
					{navItems.map((item) => (
						<a
							key={item.href}
							href={item.href}
							className="text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{item.label}
						</a>
					))}
					<Link
						href="/docs"
						className="text-muted-foreground hover:text-[#A3E635] transition-colors duration-150 flex items-center gap-1 font-semibold"
					>
						<span>Docs REST</span>
					</Link>
				</nav>

				{/* Header Actions */}
				<div className="hidden md:flex items-center space-x-3">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => onOpenAuth('signin')}
						className="rounded-xl border border-border/80 bg-surface-secondary/70 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-secondary hover:border-border transition-all active:scale-[0.98]"
					>
						Entrar
					</button>
					<button
						type="button"
						onClick={() => onOpenAuth('signup')}
						className="group flex items-center gap-1.5 rounded-xl bg-[#A3E635] px-4 py-2 text-sm font-bold text-[#0B0E14] shadow-[0_2px_12px_rgba(163,230,53,0.25)] hover:bg-[#b2f042] active:scale-[0.98] transition-all"
					>
						<span>Criar Conta</span>
						<Icon icon={ArrowRight01Icon} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
					</button>
				</div>

				{/* Mobile Menu Trigger */}
				<div className="flex md:hidden items-center space-x-2">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 rounded-xl border border-border/60 bg-surface-secondary/50 text-foreground hover:bg-surface-secondary"
						aria-label="Menu"
					>
						<Icon icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon} className="w-6 h-6" />
					</button>
				</div>
			</div>

			{/* Mobile Navigation Drawer */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-[#121721] px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
					<nav className="flex flex-col space-y-3">
						{navItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								onClick={() => setMobileMenuOpen(false)}
								className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
							>
								{item.label}
							</a>
						))}
						<Link
							href="/docs"
							onClick={() => setMobileMenuOpen(false)}
							className="text-base font-semibold text-[#A3E635] flex items-center gap-1.5 pt-1"
						>
							<span>Documentação API REST</span>
						</Link>
					</nav>

					<div className="flex flex-col space-y-2 pt-2 border-t border-border/60">
						<button
							type="button"
							onClick={() => {
								setMobileMenuOpen(false);
								onOpenAuth('signin');
							}}
							className="w-full rounded-xl border border-border bg-surface-secondary py-2.5 text-center text-sm font-semibold text-foreground"
						>
							Entrar no Painel
						</button>
						<button
							type="button"
							onClick={() => {
								setMobileMenuOpen(false);
								onOpenAuth('signup');
							}}
							className="w-full rounded-xl bg-[#A3E635] py-2.5 text-center text-sm font-bold text-[#0B0E14] shadow-md"
						>
							Criar Conta Gratuita
						</button>
					</div>
				</div>
			)}
		</header>
	);
}
