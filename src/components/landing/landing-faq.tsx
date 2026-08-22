'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { HelpCircleIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

export function LandingFaq() {
	const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

	const faqs = [
		{
			q: 'Como funciona a aprovação e liquidação das transações PIX?',
			a: 'O SwiftPay é conectado nativamente ao Sistema de Pagamentos Instantâneos (SPI) do Banco Central. Assim que o comprador realiza o pagamento pelo QR Code ou Copia e Cola, a confirmação ocorre em menos de 50 milissegundos e o saldo é disponibilizado imediatamente em sua conta (liquidação D+0).',
		},
		{
			q: 'Quais são as taxas e existe custo de mensalidade?',
			a: 'Não cobramos taxa de adesão, mensalidade ou manutenção de conta. Você paga apenas uma taxa percentual transparente sobre cada cobrança PIX aprovada. Se não vender nada no mês, seu custo é exatamente R$ 0,00.',
		},
		{
			q: 'Como integro a API do SwiftPay ao meu sistema ou checkout?',
			a: 'Disponibilizamos uma API RESTful simples com especificação OpenAPI 3.0 e SDKs para Node.js, Python, PHP e Go. É possível criar uma integração completa em menos de 10 minutos com suporte a webhooks com HMAC SHA-256.',
		},
		{
			q: 'O SwiftPay suporta saques automáticos (PIX Out)?',
			a: 'Sim! Você pode programar saques automáticos para suas chaves PIX cadastradas ou realizar transferências via API e painel a qualquer momento, inclusive nos finais de semana e feriados.',
		},
		{
			q: 'Quais são as medidas de segurança e antifraude?',
			a: 'Utilizamos criptografia bancária TLS 1.3 Strict, armazenamento cifrado em AES-256-GCM, conformidade PCI-DSS e um motor antifraude nativo com inteligência para detecção proativa de comportamentos anômalos.',
		},
	];

	const toggleFaq = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<section id="faq" className="relative py-16 sm:py-24 bg-[#000000] border-t border-white/10 text-white">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				
				{/* Header */}
				<div className="text-center space-y-4 mb-16">
					<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/12 bg-[#16181a] text-xs font-semibold text-[#4f55f1]">
						<Icon icon={HelpCircleIcon} className="w-3.5 h-3.5" />
						<span className="font-mono">PERGUNTAS FREQUENTES</span>
					</div>
					<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
						Dúvidas Frequentes sobre o SwiftPay.
					</h2>
					<p className="text-base text-white/60">
						Tudo o que você precisa saber para começar a processar com a infraestrutura mais rápida do mercado.
					</p>
				</div>

				{/* Accordion List */}
				<div className="space-y-4">
					{faqs.map((faq, index) => {
						const isOpen = openIndex === index;
						return (
							<div
								key={faq.q}
								className="rounded-2xl border border-white/12 bg-[#16181a] overflow-hidden transition-colors hover:border-white/25"
							>
								<button
									type="button"
									onClick={() => toggleFaq(index)}
									className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
								>
									<span className="text-base font-bold text-white">
										{faq.q}
									</span>
									<Icon
										icon={ArrowDown01Icon}
										className={`w-5 h-5 text-white/70 shrink-0 transition-transform duration-200 ${
											isOpen ? 'rotate-180 text-[#4f55f1]' : ''
										}`}
									/>
								</button>

								{isOpen && (
									<div className="px-6 pb-6 pt-0 text-sm text-white/60 leading-relaxed animate-in fade-in duration-150 border-t border-white/8">
										<p className="pt-4">{faq.a}</p>
									</div>
								)}
							</div>
						);
					})}
				</div>

			</div>
		</section>
	);
}
