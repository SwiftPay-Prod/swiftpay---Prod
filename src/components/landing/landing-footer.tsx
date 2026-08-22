'use client';

import React from 'react';
import Link from 'next/link';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

interface LandingFooterProps {
	onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function LandingFooter({ onOpenAuth }: LandingFooterProps) {
	return (
		<footer className="bg-[#000000] border-t border-white/10 text-white pt-16 pb-12">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
				
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
					
					{/* Brand Column */}
					<div className="lg:col-span-2 space-y-4">
						<SwiftPayBrandLogo iconSize={36} showText textClassName="text-2xl font-extrabold text-white" />
						<p className="text-xs text-white/50 max-w-sm leading-relaxed">
							Infraestrutura de alta performance para processamento de pagamentos PIX com liquidação instantânea, webhooks resilientes e APIs de alta disponibilidade.
						</p>
						
						{/* Status Badge */}
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/12 bg-[#16181a] text-xs font-mono text-white">
							<span className="h-2 w-2 rounded-full bg-[#00a87e] animate-pulse" />
							<span>Todos os sistemas operacionais (99.99% SLA)</span>
						</div>
					</div>

					{/* Column 1: Produto */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-white">
							Produto
						</div>
						<ul className="space-y-2 text-xs text-white/60 font-medium">
							<li>
								<a href="#features" className="hover:text-white transition-colors">
									Motor SPI Nativo
								</a>
							</li>
							<li>
								<a href="#security" className="hover:text-white transition-colors">
									Segurança & PCI-DSS
								</a>
							</li>
							<li>
								<button
									type="button"
									onClick={() => onOpenAuth('signup')}
									className="hover:text-white text-left transition-colors font-semibold cursor-pointer"
								>
									Criar Conta Gratuita
								</button>
							</li>
						</ul>
					</div>

					{/* Column 2: Desenvolvedores */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-white">
							Desenvolvedores
						</div>
						<ul className="space-y-2 text-xs text-white/60 font-medium">
							<li>
								<Link href="/docs" className="hover:text-white transition-colors font-semibold text-white/80">
									Documentação REST
								</Link>
							</li>
							<li>
								<a href="#developer" className="hover:text-white transition-colors">
									Exemplos de Código (cURL/SDKs)
								</a>
							</li>
							<li>
								<a href="#security" className="hover:text-white transition-colors">
									Webhooks HMAC & Logs
								</a>
							</li>
							<li>
								<Link href="/api/payment/docs" target="_blank" className="hover:text-white transition-colors">
									OpenAPI Spec / Scalar UI
								</Link>
							</li>
						</ul>
					</div>

					{/* Column 3: Legal & Segurança */}
					<div className="space-y-3">
						<div className="text-xs font-bold uppercase tracking-wider text-white">
							Segurança & Legal
						</div>
						<ul className="space-y-2 text-xs text-white/60 font-medium">
							<li>
								<a href="#security" className="hover:text-white transition-colors">
									Blindagem PCI-DSS
								</a>
							</li>
							<li>
								<span className="text-white/50">Termos de Uso</span>
							</li>
							<li>
								<span className="text-white/50">Política de Privacidade</span>
							</li>
							<li>
								<span className="text-white/50">Conformidade BACEN SPI</span>
							</li>
						</ul>
					</div>

				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 font-medium">
					<div>
						© {new Date().getFullYear()} SwiftPay Fintech. Todos os direitos reservados.
					</div>

					<div className="flex items-center gap-4 text-xs font-mono text-white/40">
						<span>🔒 Criptografia SSL TLS 1.3 Strict</span>
						<span>•</span>
						<span>Ambiente Seguro</span>
					</div>
				</div>

			</div>
		</footer>
	);
}
