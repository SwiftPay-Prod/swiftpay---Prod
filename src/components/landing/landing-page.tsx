'use client';

import { useState } from 'react';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { AuthModal, type AuthModalMode } from './auth-modal';

const CAPABILITIES = [
	{
		title: 'Gateway PIX',
		description: 'Crie cobranças, acompanhe o status e receba confirmações pelo fluxo real da API.',
	},
	{
		title: 'Links de pagamento',
		description: 'Compartilhe cobranças com uma experiência de pagamento integrada à sua operação.',
	},
	{
		title: 'Checkout configurável',
		description: 'Personalize meios de pagamento, identidade visual, produtos, URLs e rastreamento.',
	},
	{
		title: 'Conciliação financeira',
		description: 'Acompanhe pagamentos, pedidos, saques e movimentações em um único painel.',
	},
	{
		title: 'Automação de saques',
		description: 'Configure contas, regras e frequências de saque conforme as permissões da organização.',
	},
	{
		title: 'Ambientes isolados',
		description: 'Separe operações de sandbox e produção sem misturar credenciais ou transações.',
	},
];

const OPERATION_STEPS = [
	{
		number: '01',
		title: 'Crie sua organização',
		description: 'Conclua seu cadastro e envie os dados necessários para análise.',
	},
	{
		number: '02',
		title: 'Configure sua operação',
		description: 'Defina credenciais, recebimento, checkout e integrações.',
	},
	{
		number: '03',
		title: 'Processe pagamentos',
		description: 'Acompanhe cada transação e movimentação diretamente no painel.',
	},
];

const primaryActionClassName =
	'inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90';

const secondaryActionClassName =
	'inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface';

interface LandingPageProps {
	initialAuthMode?: AuthModalMode;
}

export function LandingPage({ initialAuthMode = null }: LandingPageProps) {
	const [authModalMode, setAuthModalMode] = useState<AuthModalMode>(initialAuthMode);

	function openAuth(mode: Exclude<AuthModalMode, null>) {
		setAuthModalMode(mode);
	}

	return (
		<div className="relative min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
					<SwiftPayBrandLogo iconSize={32} showText />
					<nav className="flex items-center gap-2 sm:gap-3" aria-label="Navegação principal">
						<a href="#como-funciona" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
							Como funciona
						</a>
						<button type="button" className={secondaryActionClassName} onClick={() => openAuth('signin')}>
							Entrar
						</button>
						<button type="button" className={primaryActionClassName} onClick={() => openAuth('signup')}>
							Criar conta
						</button>
					</nav>
				</div>
			</header>

			<main>
				<section className="relative overflow-hidden border-b border-border/60">
					<div className="pointer-events-none absolute inset-0 -z-10">
						<div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
						<div className="absolute bottom-0 right-8 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
					</div>

					<div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 md:grid-cols-12 md:items-center md:py-28">
						<div className="md:col-span-7">
							<span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
								Infraestrutura de pagamentos
							</span>
							<h1 className="mt-5 text-5xl font-bold tracking-tighter md:text-6xl">
								Pagamentos PIX sem atrito, do checkout à conciliação
							</h1>
							<p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
								Gateway, links de pagamento, checkout e gestão financeira conectados ao backend real da sua operação.
							</p>
							<div className="mt-7 flex flex-wrap gap-3">
								<button type="button" className={primaryActionClassName} onClick={() => openAuth('signup')}>
									Criar conta
								</button>
								<button type="button" className={secondaryActionClassName} onClick={() => openAuth('signin')}>
									Acessar painel
								</button>
							</div>
						</div>

						<div className="md:col-span-5">
							<div className="relative overflow-hidden rounded-3xl border border-border bg-card/85 p-5">
								<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
								<div className="relative">
									<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Fluxo operacional</p>
									<div className="mt-5 space-y-3">
										{['Cobrança criada pela API', 'Confirmação recebida por webhook', 'Saldo e histórico atualizados'].map(
											(item, index) => (
												<div key={item} className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/70 p-4">
													<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
														{index + 1}
													</span>
													<span className="text-sm font-medium">{item}</span>
												</div>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-b border-border/60">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
						<p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">Produto</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight">Uma operação financeira conectada de ponta a ponta</h2>
						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Recursos organizados para vender, receber, acompanhar e conciliar sem depender de dados simulados.
						</p>
						<div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
							{CAPABILITIES.map((capability) => (
								<article key={capability.title} className="rounded-xl border border-border/80 bg-card p-5">
									<h3 className="text-sm font-semibold">{capability.title}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{capability.description}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section id="como-funciona" className="border-b border-border/60">
					<div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
						<p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">Como funciona</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight">Da configuração ao primeiro pagamento</h2>
						<div className="mt-8 grid gap-3 md:grid-cols-3">
							{OPERATION_STEPS.map((step) => (
								<article key={step.number} className="rounded-xl border border-border/80 bg-card p-5">
									<span className="font-mono text-xs font-semibold text-accent">{step.number}</span>
									<h3 className="mt-3 text-base font-semibold">{step.title}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section>
					<div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-6 md:grid-cols-12 md:items-center">
						<div className="md:col-span-8">
							<h2 className="text-3xl font-semibold tracking-tight">Pronto para conectar sua operação?</h2>
							<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
								Crie sua conta para configurar a organização e começar pelo ambiente adequado ao seu negócio.
							</p>
						</div>
						<div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
							<button type="button" className={primaryActionClassName} onClick={() => openAuth('signup')}>
								Começar agora
							</button>
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-border/60">
				<div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
					<SwiftPayBrandLogo iconSize={28} showText />
					<p className="text-xs text-muted-foreground">SwiftPay · Infraestrutura de pagamentos</p>
				</div>
			</footer>

			<AuthModal
				isOpen={authModalMode !== null}
				mode={authModalMode}
				onClose={() => setAuthModalMode(null)}
				onSwitchMode={setAuthModalMode}
			/>
		</div>
	);
}
