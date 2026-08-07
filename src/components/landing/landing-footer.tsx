'use client';

import React from 'react';
import Link from 'next/link';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

interface LandingFooterProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingFooter({ onOpenAuth }: LandingFooterProps) {
	return (
		<footer className="bg-[#090C10] border-t border-border/60 text-foreground pt-16 pb-12">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
				
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
					
					{/* Brand Column */}
					<div className="lg:col-span-2 space-y-4">
						<SwiftPayBrandLogo iconSize={36} showText textClassName="text-2xl font-extrabold" />
						<p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
							Infraestrutura de alta performance para processamento de pagamentos PIX com liquidação instantânea, webhooks resilientes e APIs de alta disponibilidade.
						</p>
						
						{/* Status Badge */}
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-[#121721] text-xs font-mono text-foreground">
							<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
							<span>Todos os sistemas operacionais (99.99% SLA)</span>
						</div>
					</div>

					{/* Column 1: Produto */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-foreground">
							Produto
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground font-medium">
							<li>
								<a href="#features" className="hover:text-foreground transition-colors">
									Motor SPI Nativo
								</a>
							</li>
							<li>
								<a href="#security" className="hover:text-foreground transition-colors">
									Segurança & PCI-DSS
								</a>
							</li>
							<li>
								<button
									type="button"
									onClick={() => onOpenAuth('signup')}
									className="hover:text-[#A3E635] text-left transition-colors font-semibold"
								>
									Criar Conta Gratuita
								</button>
							</li>
						</ul>
					</div>

					{/* Column 2: Desenvolvedores */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-foreground">
							Desenvolvedores
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground font-medium">
							<li>
								<Link href="/docs" className="hover:text-[#A3E635] transition-colors font-semibold text-foreground">
									Documentação REST
								</Link>
							</li>
							<li>
								<a href="#developer" className="hover:text-foreground transition-colors">
									Exemplos de Código (cURL/SDKs)
								</a>
							</li>
							<li>
								<a href="#security" className="hover:text-foreground transition-colors">
									Webhooks HMAC & Logs
								</a>
							</li>
							<li>
								<Link href="/api/payment/docs" target="_blank" className="hover:text-foreground transition-colors">
									OpenAPI Spec / Scalar UI
								</Link>
							</li>
						</ul>
					</div>

					{/* Column 3: Legal & Segurança */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-foreground">
							Segurança & Legal
						</div>
						<ul className="space-y-2 text-xs text-muted-foreground font-medium">
							<li>
								<a href="#security" className="hover:text-foreground transition-colors">
									Blindagem PCI-DSS
								</a>
							</li>
							<li>
								<span className="text-muted-foreground/80">Termos de Uso</span>
							</li>
							<li>
								<span className="text-muted-foreground/80">Política de Privacidade</span>
							</li>
							<li>
								<span className="text-muted-foreground/80">Conformidade BACEN SPI</span>
							</li>
						</ul>
					</div>

				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
					<div>
						© {new Date().getFullYear()} SwiftPay Fintech. Todos os direitos reservados.
					</div>

					<div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
						<span>🔒 Criptografia SSL TLS 1.3 Strict</span>
						<span>•</span>
						<span>Ambiente Seguro</span>
					</div>
				</div>

			</div>
		</footer>
	);
}
