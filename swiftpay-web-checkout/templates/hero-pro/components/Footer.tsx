'use client';

import { Icon } from '@/components/icon';
import { ShieldIcon, ShippingTruck01Icon, SquareLock01Icon } from '@hugeicons/core-free-icons';

interface FooterProps {
	footerMessage: string | null;
}

export function Footer({ footerMessage }: FooterProps) {
	return (
		<footer className="py-8 pb-8 hero-bg-card rounded-t-[40px]">
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex flex-col items-center gap-6">
					{footerMessage && <p className="text-sm hero-text-muted truncate max-w-full">{footerMessage}</p>}

					<div className="flex items-center gap-6 text-sm font-semibold">
						<div className="flex items-center gap-2 hero-text-muted">
							<Icon icon={ShieldIcon} className="icon-sm" />
							<span>Ambiente Seguro</span>
						</div>
						<div className="flex items-center gap-2 hero-text-muted">
							<Icon icon={SquareLock01Icon} className="icon-sm" />
							<span>Criptografia SSL</span>
						</div>
						<div className="flex items-center gap-2 hero-text-muted">
							<Icon icon={ShippingTruck01Icon} className="icon-sm" />
							<span>Garantia de 7 dias</span>
						</div>
					</div>

					<div className="text-center text-xs hero-text-subtle">
						<a href="https://swiftpay.com.br/" target="_blank" rel="noopener noreferrer">
							<p className="text-xs font-extrabold">Processado com tecnologia SafefyPay</p>
						</a>
						<p className="mt-1">© 2026 Todos os direitos reservados.</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
