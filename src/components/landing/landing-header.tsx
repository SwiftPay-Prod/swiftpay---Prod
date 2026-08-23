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
		<header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#000000]/90 backdrop-blur-xl transition-all">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<SwiftPayBrandLogo iconSize={36} showText textClassName="text-xl font-extrabold tracking-tight text-white" />
				</Link>

				{/* Desktop Navigation Links */}
				<nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
					{navItems.map((item) => (
						<a
							key={item.href}
							href={item.href}
							className="text-white/60 hover:text-white transition-colors duration-150"
						>
							{item.label}
						</a>
					))}
					<Link
						href="/docs"
						className="text-white/70 hover:text-white transition-colors duration-150 flex items-center gap-1 font-semibold"
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
						className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] cursor-pointer"
					>
						Entrar
					</button>
					<button
						type="button"
						onClick={() => onOpenAuth('signup')}
						className="group flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-bold text-black shadow-sm hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer"
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
						className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
						aria-label="Menu"
					>
						<Icon icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon} className="w-6 h-6" />
					</button>
				</div>
			</div>

			{/* Mobile Navigation Drawer */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-white/12 bg-card px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150 text-white">
					<nav className="flex flex-col space-y-3">
						{navItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								onClick={() => setMobileMenuOpen(false)}
								className="text-base font-medium text-white/70 hover:text-white transition-colors"
							>
								{item.label}
							</a>
						))}
						<Link
							href="/docs"
							onClick={() => setMobileMenuOpen(false)}
							className="text-base font-semibold text-link flex items-center gap-1.5 pt-1"
						>
							<span>Documentação API REST</span>
						</Link>
					</nav>

					<div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
						<button
							type="button"
							onClick={() => {
								setMobileMenuOpen(false);
								onOpenAuth('signin');
							}}
							className="w-full rounded-full border border-white/12 bg-white/5 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10"
						>
							Entrar no Painel
						</button>
						<button
							type="button"
							onClick={() => {
								setMobileMenuOpen(false);
								onOpenAuth('signup');
							}}
							className="w-full rounded-full bg-white py-2.5 text-center text-sm font-bold text-black shadow-sm hover:bg-white/90"
						>
							Criar Conta Gratuita
						</button>
					</div>
				</div>
			)}
		</header>
	);
}
