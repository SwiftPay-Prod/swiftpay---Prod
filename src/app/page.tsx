import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

const MOCK_STATS = [
	{ label: 'Lojas ativas', value: '2.400+' },
	{ label: 'Volume processado', value: 'R$ 180M+' },
	{ label: 'Aprovação média', value: '94,2%' },
	{ label: 'Chargebacks evitados', value: '99,1%' },
];

const MOCK_FEATURES = [
	{ title: 'Gateway PIX', desc: 'Pagamentos instantâneos com aprovação em milissegundos e liquidação D0.' },
	{ title: 'Links de pagamento', desc: 'Cobranças por link em segundos, sem código ou checkout próprio.' },
	{ title: 'Checkout automatizado', desc: 'Fluxo conversão-first com prevenção de fraude e retry inteligente.' },
	{ title: 'Relatórios operacionais', desc: 'Visão diária de caixa, aprovação, chargebacks e crescimento.' },
	{ title: 'Saque rápido', desc: 'Saques programados e automáticos com regras de reserva configuráveis.' },
	{ title: 'Painel unificado', desc: 'Operação, produtos, pedidos e clientes no mesmo workspace.' },
];

const MOCK_STEPS = [
	{ title: 'Crie sua conta', desc: 'Cadastro em minutos com verificação automática de conta e documento.' },
	{ title: 'Configure o recebimento', desc: 'Conecte sua chave PIX, defina reservas e receba em conta.' },
	{ title: 'Comece a vender', desc: 'Use gateway, links ou checkout e acompanhe tudo em tempo real.' },
];

const ctaPrimary = 'inline-flex items-center justify-center h-10 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90';
const ctaSecondary = 'inline-flex items-center justify-center h-10 rounded-full border border-border/80 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface';

export default function LandingPage() {
	return (
		<div className="relative min-h-screen bg-background">
			<header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
					<SwiftPayBrandLogo iconSize={32} showText />
					<div className="flex items-center gap-3">
						<a href="/#como-funciona" className="h-8 rounded-full border border-border/80 px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface">Como funciona</a>
						<a href="/panel/merchant/dashboard" className={ctaPrimary}>Acessar Painel</a>
					</div>
				</div>
			</header>

			<main>
				<section className="relative overflow-hidden">
					<div className="absolute inset-0 -z-10">
						<div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
						<div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-brand/10 blur-[100px]" />
						<div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
					</div>

					<div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
						<div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-center">
							<div className="md:col-span-7">
								<span className="text-xs font-mono font-medium uppercase tracking-widest text-accent">Infraestrutura de pagamentos</span>
								<h1 className="mt-5 text-5xl font-bold tracking-tighter text-foreground md:text-6xl">Pagamentos Pix sem atrito, do clique ao crédito na conta</h1>
								<p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">SwiftPay une gateway, links de pagamento e checkout num mesmo painel, com liquidação rápida, prevenção de chargeback e relatórios operacionais prontos para decisão.</p>
			<div className="mt-7 flex flex-wrap items-center gap-3">
								<a href="/panel/admin/dashboard" className={ctaPrimary}>Admin Dashboard</a>
								<a href="/panel/merchant/dashboard" className={ctaSecondary}>Merchant Dashboard</a>
							</div>
							</div>

							<div className="md:col-span-5">
								<div className="relative">
									<div className="absolute -inset-4 -z-10 rounded-[28px] bg-accent/10 blur-2xl" />
									<div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 backdrop-blur">
										<div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
										<div className="pointer-events-none absolute -left-6 -bottom-8 h-32 w-32 rounded-full bg-brand/20 blur-3xl" />
										<div className="relative grid grid-cols-2 gap-3">
											{MOCK_STATS.map((item) => (
												<div key={item.label} className="rounded-2xl border border-border/80 bg-background/60 p-4">
													<span className="text-xs font-mono text-muted-foreground">{item.label}</span>
													<span className="mt-2 block text-2xl font-bold font-mono tracking-tight text-foreground">{item.value}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-t border-border/60">
					<div className="mx-auto max-w-6xl px-6 py-14">
						<h2 className="text-2xl font-semibold tracking-tight text-foreground">Feito para operação financeira real</h2>
						<p className="mt-2 max-w-2xl text-sm text-muted-foreground">Módulos enxutos para venda, recebimento, reconciliação e decisão.</p>
						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{MOCK_FEATURES.map((feature) => (
								<div key={feature.title} className="rounded-xl border border-border/80 bg-card p-4">
									<h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
									<p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="como-funciona" className="border-t border-border/60">
					<div className="mx-auto max-w-6xl px-6 py-14">
						<h2 className="text-2xl font-semibold tracking-tight text-foreground">Como funciona</h2>
						<p className="mt-2 max-w-2xl text-sm text-muted-foreground">Fluxo curto, sem burocracia, com foco em aprovação e liquidação rápida.</p>
						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
							{MOCK_STEPS.map((step, index) => (
								<div key={step.title} className="rounded-xl border border-border/80 bg-card p-4">
									<span className="text-xs font-mono font-medium uppercase tracking-widest text-accent">Passo {index + 1}</span>
									<h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
									<p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="border-t border-border/60">
					<div className="mx-auto max-w-6xl px-6 py-14">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
							<div className="md:col-span-7">
								<h2 className="text-2xl font-semibold tracking-tight text-foreground">Pronto para operar com mais previsibilidade</h2>
								<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Acesse o painel e simule métricas, transações, chargebacks e crescimento com dados pré-carregados para decisão.</p>
								<div className="mt-5">
									<a href="/panel/merchant/dashboard" className={ctaPrimary}>Acessar Painel</a>
								</div>
							</div>
							<div className="md:col-span-5">
								<div className="rounded-xl border border-border/80 bg-card p-4">
									<span className="text-xs font-mono text-muted-foreground">Prévia operacional</span>
									<div className="mt-3 flex flex-col gap-2 text-xs font-mono text-muted-foreground">
										<span>• Métricas atualizadas periodicamente</span>
										<span>• Modo simulação ativado</span>
										<span>• Alertas de aprovação e chargeback</span>
										<span>• Relatórios prontos para exportação</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-border/60">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 md:flex-row md:items-center md:justify-between">
					<SwiftPayBrandLogo iconSize={28} showText />
					<p className="text-xs text-muted-foreground">SwiftPay · Infraestrutura de pagamentos</p>
				</div>
			</footer>
		</div>
	);
}
