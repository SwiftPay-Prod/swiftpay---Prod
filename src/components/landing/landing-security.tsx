'use client';

import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
	SecurityCheckIcon,
	LockKeyIcon,
	Key01Icon,
	DocumentValidationIcon,
} from '@hugeicons/core-free-icons';

export function LandingSecurity() {
	return (
		<section id="security" className="relative py-16 sm:py-24 bg-[#0B0E14] border-t border-border/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="rounded-2xl border border-[#1E2638] bg-[#121721] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
						
						{/* Left Text */}
						<div className="lg:col-span-6 space-y-4">
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-surface-secondary text-xs font-semibold text-[#A3E635]">
								<Icon icon={SecurityCheckIcon} className="w-3.5 h-3.5" />
								<span>BLINDAGEM & CONFORMIDADE</span>
							</div>

							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
								Infraestrutura Blindada com Latência Zero.
							</h2>

							<p className="text-base text-muted-foreground leading-relaxed">
								Protegemos a operação financeira de milhares de sellers com os mais rigorosos padrões de segurança cibernética e criptografia bancária.
							</p>
						</div>

						{/* Right Security Specs */}
						<div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="rounded-xl border border-border/60 bg-[#090C10] p-4 space-y-2">
								<div className="flex items-center gap-2 text-foreground font-bold text-sm">
									<Icon icon={LockKeyIcon} className="w-4 h-4 text-[#A3E635]" />
									<span>Criptografia E2E</span>
								</div>
								<p className="text-xs text-muted-foreground leading-normal">
									Comunicação protegida por TLS 1.3 Strict e dados armazenados com cifra AES-256-GCM.
								</p>
							</div>

							<div className="rounded-xl border border-border/60 bg-[#090C10] p-4 space-y-2">
								<div className="flex items-center gap-2 text-foreground font-bold text-sm">
									<Icon icon={Key01Icon} className="w-4 h-4 text-[#A3E635]" />
									<span>Chaves Isoladas</span>
								</div>
								<p className="text-xs text-muted-foreground leading-normal">
									Segredos de API com rotação dinâmica e isolamento total por organização.
								</p>
							</div>

							<div className="rounded-xl border border-border/60 bg-[#090C10] p-4 space-y-2">
								<div className="flex items-center gap-2 text-foreground font-bold text-sm">
									<Icon icon={SecurityCheckIcon} className="w-4 h-4 text-[#A3E635]" />
									<span>Antifraude Nativo</span>
								</div>
								<p className="text-xs text-muted-foreground leading-normal">
									Análise comportamental de transações em tempo real com bloqueio preventivo de anomalias.
								</p>
							</div>

							<div className="rounded-xl border border-border/60 bg-[#090C10] p-4 space-y-2">
								<div className="flex items-center gap-2 text-foreground font-bold text-sm">
									<Icon icon={DocumentValidationIcon} className="w-4 h-4 text-[#A3E635]" />
									<span>PCI-DSS & BACEN</span>
								</div>
								<p className="text-xs text-muted-foreground leading-normal">
									Conformidade estrita com padrões internacionais de pagamentos e regulação de SPI.
								</p>
							</div>
						</div>

					</div>
				</div>

			</div>
		</section>
	);
}
