'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import {
	CodeIcon,
	Copy01Icon,
	CheckmarkCircle02Icon,
	ArrowUpRight01Icon,
	ZapIcon,
} from '@hugeicons/core-free-icons';

export function LandingDeveloper() {
	const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go'>('curl');
	const [copied, setCopied] = useState(false);

	const codeExamples = {
		curl: `curl -X POST "https://swiftpayment.info/v1/payment-links" \\
  -H "Authorization: Bearer sec_live_948f..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amountCents": 15000,
    "description": "Mentoria High Ticket",
    "customer": {
      "name": "Gabriel Santos",
      "email": "gabriel@exemplo.com"
    }
  }'`,
		node: `import { SwiftPay } from '@swiftpay/sdk';

const swiftpay = new SwiftPay({ apiKey: process.env.SWIFTPAY_API_KEY });

const payment = await swiftpay.paymentLinks.create({
  amountCents: 15000,
  description: 'Mentoria High Ticket',
  customer: {
    name: 'Gabriel Santos',
    email: 'gabriel@exemplo.com'
  }
});

console.log(payment.pix.copiaECola);`,
		python: `from swiftpay import SwiftPay

client = SwiftPay(api_key="sec_live_948f...")

payment = client.payment_links.create(
    amount_cents=15000,
    description="Mentoria High Ticket",
    customer={
        "name": "Gabriel Santos",
        "email": "gabriel@exemplo.com"
    }
)

print(payment.pix.copy_and_paste)`,
		go: `package main

import (
    "fmt"
    "github.com/swiftpay/sdk-go"
)

func main() {
    client := swiftpay.NewClient("sec_live_948f...")
    payment, _ := client.PaymentLinks.Create(&swiftpay.PaymentParams{
        AmountCents: 15000,
        Description: "Mentoria High Ticket",
    })
    fmt.Println(payment.Pix.CopiaECola)
}`,
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(codeExamples[activeLang]);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section id="developer" className="relative py-16 sm:py-24 bg-[#000000] border-t border-white/10 text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
					
					{/* Text Column */}
					<div className="lg:col-span-5 space-y-6">
						<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/12 bg-card text-xs font-semibold text-link">
							<Icon icon={CodeIcon} className="w-3.5 h-3.5" />
							<span className="font-mono">DEVELOPER EXPERIENCE</span>
						</div>

						<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
							Integre o PIX em Poucas Linhas de Código.
						</h2>

						<p className="text-base text-white/60 leading-relaxed">
							API RESTful padronizada com especificação OpenAPI 3.0, SDKs para as principais linguagens e documentação interativa em tema dark.
						</p>

						<div className="space-y-3 pt-2">
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-success" />
								<span className="text-sm font-semibold text-white">Ambiente Sandbox gratuito para testes</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-success" />
								<span className="text-sm font-semibold text-white">Webhooks assinados por HMAC SHA-256</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-success" />
								<span className="text-sm font-semibold text-white">Especificação pública OpenAPI / Scalar UI</span>
							</div>
						</div>

						<div className="pt-4">
							<Link
								href="/docs"
								className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/12 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all"
							>
								<span>Explorar Documentação Completa</span>
								<Icon icon={ArrowUpRight01Icon} className="w-4 h-4" />
							</Link>
						</div>
					</div>

					{/* Terminal / Code Editor Column */}
					<div className="lg:col-span-7">
						<div className="rounded-2xl border border-white/12 bg-surface-deep overflow-hidden">
							
							{/* Code Header Bar */}
							<div className="flex items-center justify-between border-b border-white/10 bg-card px-4 py-3">
								<div className="flex items-center space-x-2">
									<button
										type="button"
										onClick={() => setActiveLang('curl')}
										className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
											activeLang === 'curl'
												? 'bg-white text-black'
												: 'text-white/60 hover:text-white'
										}`}
									>
										cURL
									</button>
									<button
										type="button"
										onClick={() => setActiveLang('node')}
										className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
											activeLang === 'node'
												? 'bg-white text-black'
												: 'text-white/60 hover:text-white'
										}`}
									>
										Node.js / TS
									</button>
									<button
										type="button"
										onClick={() => setActiveLang('python')}
										className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
											activeLang === 'python'
												? 'bg-white text-black'
												: 'text-white/60 hover:text-white'
										}`}
									>
										Python
									</button>
									<button
										type="button"
										onClick={() => setActiveLang('go')}
										className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
											activeLang === 'go'
												? 'bg-white text-black'
												: 'text-white/60 hover:text-white'
										}`}
									>
										Go
									</button>
								</div>

								<button
									type="button"
									onClick={handleCopy}
									className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
								>
									<Icon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className="w-3.5 h-3.5 text-link" />
									<span>{copied ? 'Copiado!' : 'Copiar'}</span>
								</button>
							</div>

							{/* Code Snippet Box */}
							<div className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
								<pre className="whitespace-pre">
									<code>{codeExamples[activeLang]}</code>
								</pre>
							</div>

							{/* Terminal Footer Benchmark Status */}
							<div className="border-t border-white/10 bg-card px-4 py-2.5 flex items-center justify-between text-xs font-mono text-white/60">
								<div className="flex items-center gap-2">
									<Icon icon={ZapIcon} className="w-3.5 h-3.5 text-success" />
									<span>Tempo médio de execução: <strong className="text-white">38ms</strong></span>
								</div>
								<span className="text-success font-bold">200 OK</span>
							</div>

						</div>
					</div>

				</div>

			</div>
		</section>
	);
}
