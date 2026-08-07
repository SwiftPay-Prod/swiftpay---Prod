'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import {
	CheckmarkCircle02Icon,
	Copy01Icon,
	QrCodeIcon,
	FlashIcon,
} from '@hugeicons/core-free-icons';

export function LandingShowcase() {
	const [activeTab, setActiveTab] = useState<'overview' | 'checkout' | 'simulator'>('overview');
	
	// Simulator State
	const [simulatedAmount, setSimulatedAmount] = useState('150,00');
	const [isSimulating, setIsSimulating] = useState(false);
	const [simulatedPix, setSimulatedPix] = useState<{
		txId: string;
		status: 'PENDING' | 'APPROVED';
		qrCode: string;
		copied: boolean;
	} | null>(null);

	const handleGeneratePix = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSimulating(true);
		
		setTimeout(() => {
			const txId = `pix_${Math.random().toString(36).substring(2, 10)}`;
			setSimulatedPix({
				txId,
				status: 'PENDING',
				qrCode: `00020101021226840014br.gov.bcb.pix2562swift-pay.top/pix/${txId}5204000053039865405150.005802BR5915SwiftPay Fintech6009SAO PAULO62070503***6304E8A2`,
				copied: false,
			});
			setIsSimulating(false);

			// Simulate approval in 2.5 seconds
			setTimeout(() => {
				setSimulatedPix((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
			}, 2500);
		}, 600);
	};

	const handleCopyPix = () => {
		if (simulatedPix) {
			navigator.clipboard.writeText(simulatedPix.qrCode);
			setSimulatedPix({ ...simulatedPix, copied: true });
			setTimeout(() => {
				setSimulatedPix((prev) => (prev ? { ...prev, copied: false } : null));
			}, 2000);
		}
	};

	return (
		<section id="solutions" className="relative py-16 sm:py-24 bg-[#0B0E14]">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				{/* Section Header */}
				<div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-surface-secondary text-xs font-semibold text-[#A3E635]">
						<span>PRODUTO & INTERFACE</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
						Plataforma Desenvolvida para Operar na Escala de Milhões.
					</h2>
					<p className="text-base sm:text-lg text-muted-foreground">
						Acompanhe recebimentos em tempo real, configure webhooks resilientes e proporcione a melhor experiência de pagamento PIX para seus clientes.
					</p>
				</div>

				{/* Showcase Card Wrapper */}
				<div className="rounded-2xl border border-[#1E2638] bg-[#121721] shadow-2xl overflow-hidden">
					
					{/* Mockup Header Bar */}
					<div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#1E2638] bg-[#090C10] px-4 py-3 gap-3">
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 rounded-full bg-red-500/80" />
							<div className="w-3 h-3 rounded-full bg-amber-500/80" />
							<div className="w-3 h-3 rounded-full bg-emerald-500/80" />
							<span className="text-xs font-mono text-muted-foreground ml-2">swift-pay.top/dashboard</span>
						</div>

						{/* Interactive Nav Tabs */}
						<div className="flex items-center bg-surface-secondary/80 p-1 rounded-xl border border-border/60">
							<button
								type="button"
								onClick={() => setActiveTab('overview')}
								className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
									activeTab === 'overview'
										? 'bg-[#A3E635] text-[#0B0E14] shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								📊 Painel de Vendas
							</button>
							<button
								type="button"
								onClick={() => setActiveTab('checkout')}
								className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
									activeTab === 'checkout'
										? 'bg-[#A3E635] text-[#0B0E14] shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								⚡ Checkout Otimizado
							</button>
							<button
								type="button"
								onClick={() => setActiveTab('simulator')}
								className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
									activeTab === 'simulator'
										? 'bg-[#A3E635] text-[#0B0E14] shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								🔄 Simulador PIX Real
							</button>
						</div>
					</div>

					{/* Showcase Tab Content */}
					<div className="p-6 sm:p-8">
						
						{/* TAB 1: OVERVIEW */}
						{activeTab === 'overview' && (
							<div className="space-y-6 animate-in fade-in duration-300">
								{/* KPI Metric Cards */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div className="rounded-xl border border-border/60 bg-surface-secondary/50 p-4 space-y-1">
										<span className="text-xs font-medium text-muted-foreground">Volume Processado (Hoje)</span>
										<div className="text-2xl font-extrabold font-mono text-foreground tabular-nums">
											R$ 1.842.910,45
										</div>
										<span className="text-xs font-bold text-[#A3E635] flex items-center gap-1">
											<span>+14.8% vs ontem</span>
										</span>
									</div>

									<div className="rounded-xl border border-border/60 bg-surface-secondary/50 p-4 space-y-1">
										<span className="text-xs font-medium text-muted-foreground">Taxa de Conversão PIX</span>
										<div className="text-2xl font-extrabold font-mono text-foreground tabular-nums">
											99.84%
										</div>
										<span className="text-xs text-muted-foreground">Latência média: 38ms</span>
									</div>

									<div className="rounded-xl border border-border/60 bg-surface-secondary/50 p-4 space-y-1">
										<span className="text-xs font-medium text-muted-foreground">Saques Automáticos (D+0)</span>
										<div className="text-2xl font-extrabold font-mono text-foreground tabular-nums">
											R$ 1.200.000,00
										</div>
										<span className="text-xs font-semibold text-emerald-400">100% Processados</span>
									</div>
								</div>

								{/* Mock Live Transactions Table */}
								<div className="rounded-xl border border-border/60 bg-[#090C10] overflow-hidden">
									<div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
										<span className="text-xs font-bold text-foreground">Transações em Tempo Real</span>
										<span className="text-xs font-mono text-[#A3E635] flex items-center gap-1">
											<span className="h-1.5 w-1.5 rounded-full bg-[#A3E635] animate-ping" />
											Ao vivo
										</span>
									</div>
									<div className="divide-y divide-border/40 text-xs font-mono">
										<div className="px-4 py-3 flex items-center justify-between hover:bg-surface-secondary/40 transition-colors">
											<div className="flex items-center gap-3">
												<span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Aprovado</span>
												<span className="text-foreground font-semibold">Mentoria High Ticket</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="text-muted-foreground">Há 3s</span>
												<span className="text-foreground font-bold">R$ 2.500,00</span>
											</div>
										</div>

										<div className="px-4 py-3 flex items-center justify-between hover:bg-surface-secondary/40 transition-colors">
											<div className="flex items-center gap-3">
												<span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Aprovado</span>
												<span className="text-foreground font-semibold">Assinatura SaaS Pro</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="text-muted-foreground">Há 12s</span>
												<span className="text-foreground font-bold">R$ 149,90</span>
											</div>
										</div>

										<div className="px-4 py-3 flex items-center justify-between hover:bg-surface-secondary/40 transition-colors">
											<div className="flex items-center gap-3">
												<span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">Aguardando</span>
												<span className="text-foreground font-semibold">Checkout Produto Físico</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="text-muted-foreground">Há 24s</span>
												<span className="text-foreground font-bold">R$ 289,00</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: CHECKOUT */}
						{activeTab === 'checkout' && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300 items-center">
								<div className="space-y-4">
									<h3 className="text-xl font-bold text-foreground">
										Checkout de Altíssima Conversão (PIX-Only)
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Elimine o atrito do comprador com carregamento dinâmico, QR Code instantâneo e botão Copia e Cola inteligente. Sem redirecionamentos lentos.
									</p>
									<ul className="space-y-2 text-xs text-foreground font-medium">
										<li className="flex items-center gap-2">
											<Icon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-[#A3E635]" />
											<span>Carregamento em menos de 300ms</span>
										</li>
										<li className="flex items-center gap-2">
											<Icon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-[#A3E635]" />
											<span>Timer dinâmico de expiração da cobrança</span>
										</li>
										<li className="flex items-center gap-2">
											<Icon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-[#A3E635]" />
											<span>Suporte a domínios e subdomínios personalizados</span>
										</li>
									</ul>
								</div>

								{/* Checkout Card Preview */}
								<div className="rounded-xl border border-[#1E2638] bg-[#0B0E14] p-6 space-y-4 shadow-xl">
									<div className="flex items-center justify-between border-b border-border/60 pb-3">
										<div>
											<div className="text-xs font-bold text-foreground">SwiftPay Checkout</div>
											<div className="text-xs text-muted-foreground">Pedido #8942-A</div>
										</div>
										<span className="text-sm font-extrabold font-mono text-[#A3E635]">R$ 197,00</span>
									</div>

									<div className="flex flex-col items-center justify-center p-4 bg-surface-secondary/40 rounded-xl border border-border/40 space-y-3">
										<div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center">
											{/* QR Code representation */}
											<div className="w-full h-full bg-slate-900 rounded flex items-center justify-center text-white text-xs font-mono text-center">
												[ QR CODE PIX ]
											</div>
										</div>
										<span className="text-xs text-muted-foreground font-mono">Escaneie com o app do seu banco</span>
									</div>

									<button
										type="button"
										className="w-full py-2.5 rounded-xl bg-[#A3E635] text-[#0B0E14] font-bold text-xs flex items-center justify-center gap-2"
									>
										<Icon icon={Copy01Icon} className="w-4 h-4" />
										<span>Copiar Código PIX Copia e Cola</span>
									</button>
								</div>
							</div>
						)}

						{/* TAB 3: SIMULATOR */}
						{activeTab === 'simulator' && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
								<div className="space-y-4">
									<h3 className="text-lg font-bold text-foreground">
										Teste a Geração do PIX Instantâneo
									</h3>
									<p className="text-xs text-muted-foreground">
										Digite um valor e veja como o SwiftPay gera a cobrança e simula a aprovação em tempo real.
									</p>

									<form onSubmit={handleGeneratePix} className="space-y-3">
										<div>
											<label className="text-xs font-medium text-muted-foreground block mb-1">
												Valor da Transação (R$)
											</label>
											<input
												type="text"
												value={simulatedAmount}
												onChange={(e) => setSimulatedAmount(e.target.value)}
												className="w-full rounded-xl border border-border bg-[#090C10] px-3.5 py-2 text-sm font-mono font-bold text-foreground focus:outline-none focus:border-[#A3E635]"
											/>
										</div>

										<button
											type="submit"
											disabled={isSimulating}
											className="w-full py-2.5 rounded-xl bg-[#A3E635] text-[#0B0E14] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#b2f042] transition-colors"
										>
											<Icon icon={FlashIcon} className="w-4 h-4" />
											<span>{isSimulating ? 'Gerando PIX...' : 'Gerar Cobrança PIX Agora'}</span>
										</button>
									</form>
								</div>

								{/* Simulator Output Result */}
								<div className="rounded-xl border border-[#1E2638] bg-[#090C10] p-4 flex flex-col justify-between">
									{!simulatedPix ? (
										<div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
											<Icon icon={QrCodeIcon} className="w-8 h-8 text-muted-foreground" />
											<span className="text-xs text-muted-foreground">
												Clique no botão ao lado para simular uma transação PIX ao vivo
											</span>
										</div>
									) : (
										<div className="space-y-3">
											<div className="flex items-center justify-between border-b border-border/40 pb-2">
												<span className="text-xs font-mono text-muted-foreground">ID: {simulatedPix.txId}</span>
												<span
													className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
														simulatedPix.status === 'APPROVED'
															? 'bg-emerald-500/20 text-emerald-400'
															: 'bg-amber-500/20 text-amber-400 animate-pulse'
													}`}
												>
													{simulatedPix.status === 'APPROVED' ? '✓ APROVADO (D+0)' : '⌛ AGUARDANDO PIX'}
												</span>
											</div>

											<div className="p-3 bg-[#121721] rounded-lg border border-border/40 text-xs font-mono text-muted-foreground break-all">
												{simulatedPix.qrCode}
											</div>

											<button
												type="button"
												onClick={handleCopyPix}
												className="w-full py-2 rounded-lg bg-surface-secondary border border-border text-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-secondary/80"
											>
												<Icon icon={simulatedPix.copied ? CheckmarkCircle02Icon : Copy01Icon} className="w-3.5 h-3.5 text-[#A3E635]" />
												<span>{simulatedPix.copied ? 'Copiado!' : 'Copiar Código'}</span>
											</button>
										</div>
									)}
								</div>
							</div>
						)}

					</div>
				</div>

			</div>
		</section>
	);
}
