'use client';

import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
	ZapIcon,
	SecurityCheckIcon,
	RefreshIcon,
	Coins01Icon,
	ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons';

export function LandingPillars() {
	const pillars = [
		{
			icon: ZapIcon,
			code: '01 / RESILIÊNCIA',
			title: 'Motor SPI Nativo & Sub-50ms',
			description:
				'Conexão direta com o Sistema de Pagamentos Instantâneos (SPI). Processamento assíncrono em alta escala que reduz a latência da cobrança para milissegundos.',
			tag: 'Sub-50ms SLA',
		},
		{
			icon: SecurityCheckIcon,
			code: '02 / SEGURANÇA',
			title: 'Webhooks Assinados via HMAC',
			description:
				'Notificações de pagamento em tempo real com validação por chave secreta SHA-256, retentativa automática com jitter e logs imutáveis de auditoria.',
			tag: 'HMAC SHA-256',
		},
		{
			icon: RefreshIcon,
			code: '03 / LIQUIDAÇÃO',
			title: 'Liquidação Imediata (D+0)',
			description:
				'Receba seus pagamentos PIX diretamente na sua conta com liquidação no mesmo instante. Sem janela de retenção ou carência de liquidez.',
			tag: 'D+0 Implante',
		},
		{
			icon: Coins01Icon,
			code: '04 / ESCALA',
			title: 'Gestão de Saques & Subcontas',
			description:
				'Automação completa de saques PIX Out, regras de split de pagamentos entre parceiros e conciliação financeira automatizada por API.',
			tag: 'Split & Auto-Payout',
		},
	];

	return (
		<section id="features" className="relative py-16 sm:py-24 bg-[#000000] border-t border-white/10 text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				{/* Section Header */}
				<div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
					<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/12 bg-[#16181a] text-xs font-semibold text-[#4f55f1]">
						<span className="font-mono">ARQUITETURA & RECURSOS</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
						Construído para Altíssima Disponibilidade e Performance.
					</h2>
					<p className="text-base sm:text-lg text-white/60">
						Cada detalhe do SwiftPay foi projetado para garantir a máxima conversão das suas vendas e a estabilidade da sua operação financeira.
					</p>
				</div>

				{/* Pillars Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
					{pillars.map((pillar) => (
						<div
							key={pillar.title}
							className="group relative rounded-2xl border border-white/12 bg-[#16181a] p-6 sm:p-8 transition-all hover:border-white/25 hover:shadow-[0_4px_24px_rgba(73,79,223,0.12)] flex flex-col justify-between"
						>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-xs font-mono font-bold text-white/50 tracking-wider">
										{pillar.code}
									</span>
									<span className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-mono font-semibold text-[#00a87e]">
										{pillar.tag}
									</span>
								</div>

								<div className="space-y-2">
									<h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
										{pillar.title}
									</h3>
									<p className="text-sm text-white/60 leading-relaxed">
										{pillar.description}
									</p>
								</div>
							</div>

							<div className="pt-6 mt-6 border-t border-white/8 flex items-center justify-between text-xs font-semibold text-white/80">
								<span className="flex items-center gap-2">
									<Icon icon={pillar.icon} className="w-4 h-4 text-[#4f55f1]" />
									<span>Tecnologia Nativa</span>
								</span>
								<Icon icon={ArrowUpRight01Icon} className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
							</div>
						</div>
					))}
				</div>

			</div>
		</section>
	);
}
