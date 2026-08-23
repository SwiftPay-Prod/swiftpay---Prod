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
		<section id="security" className="relative py-16 sm:py-24 bg-[#000000] border-t border-white/10 text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="rounded-2xl border border-white/12 bg-card p-8 sm:p-12 relative overflow-hidden">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
						
						{/* Left Text */}
						<div className="lg:col-span-6 space-y-4">
							<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/12 bg-white/5 text-xs font-semibold text-link">
								<Icon icon={SecurityCheckIcon} className="w-3.5 h-3.5" />
								<span className="font-mono">BLINDAGEM & CONFORMIDADE</span>
							</div>

							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
								Infraestrutura Blindada com Latência Zero.
							</h2>

							<p className="text-base text-white/60 leading-relaxed">
								Protegemos a operação financeira de milhares de sellers com os mais rigorosos padrões de segurança cibernética e criptografia bancária.
							</p>
						</div>

						{/* Right Security Specs */}
						<div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="rounded-xl border border-white/8 bg-surface-deep p-4 space-y-2">
								<div className="flex items-center gap-2 text-white font-bold text-sm">
									<Icon icon={LockKeyIcon} className="w-4 h-4 text-link" />
									<span>Criptografia E2E</span>
								</div>
								<p className="text-xs text-white/50 leading-normal">
									Comunicação protegida por TLS 1.3 Strict e dados armazenados com cifra AES-256-GCM.
								</p>
							</div>

							<div className="rounded-xl border border-white/8 bg-surface-deep p-4 space-y-2">
								<div className="flex items-center gap-2 text-white font-bold text-sm">
									<Icon icon={Key01Icon} className="w-4 h-4 text-link" />
									<span>Chaves Isoladas</span>
								</div>
								<p className="text-xs text-white/50 leading-normal">
									Segredos de API com rotação dinâmica e isolamento total por organização.
								</p>
							</div>

							<div className="rounded-xl border border-white/8 bg-surface-deep p-4 space-y-2">
								<div className="flex items-center gap-2 text-white font-bold text-sm">
									<Icon icon={SecurityCheckIcon} className="w-4 h-4 text-success" />
									<span>Antifraude Nativo</span>
								</div>
								<p className="text-xs text-white/50 leading-normal">
									Análise comportamental de transações em tempo real com bloqueio preventivo de anomalias.
								</p>
							</div>

							<div className="rounded-xl border border-white/8 bg-surface-deep p-4 space-y-2">
								<div className="flex items-center gap-2 text-white font-bold text-sm">
									<Icon icon={DocumentValidationIcon} className="w-4 h-4 text-success" />
									<span>PCI-DSS & BACEN</span>
								</div>
								<p className="text-xs text-white/50 leading-normal">
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
