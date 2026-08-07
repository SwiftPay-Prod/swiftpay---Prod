'use client';

import { Button, Card, Link } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Link01Icon, Copy01Icon, CheckmarkCircle02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { toast } from '@heroui/react';
import { CheckoutStatus } from '@/types/enums';
import type { CheckoutData } from '@/types/merchant/checkouts';

interface CheckoutLinkTabProps {
	checkout: CheckoutData;
}

export function CheckoutLinkTab({ checkout }: CheckoutLinkTabProps) {
	const checkoutUrl = checkout.checkoutUrl;

	function handleCopyLink() {
		if (!checkoutUrl) return;
		void navigator.clipboard.writeText(checkoutUrl).catch(() => undefined);
		toast('Link copiado', {
			description: 'URL do checkout copiada para a área de transferência.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	function handleOpenCheckout() {
		if (!checkoutUrl) return;
		window.open(checkoutUrl, '_blank');
	}

	if (checkout.status !== CheckoutStatus.Active || !checkoutUrl) {
		return (
			<Card>
				<Card.Content className="py-4">
					<div className="flex items-start gap-2 text-muted">
						<Icon icon={InformationCircleIcon} className="icon-md mt-0.5" />
						<p className="text-sm">
							Publique o checkout na aba <strong>Revisão</strong> para liberar o link de compartilhamento.
						</p>
					</div>
				</Card.Content>
			</Card>
		);
	}

	return (
		<Card>
			<Card.Content className="flex flex-col gap-4 py-4">
				<div className="flex items-center gap-2">
					<Icon icon={Link01Icon} className="icon-md text-accent" />
					<p className="text-sm font-medium">Link público do checkout</p>
				</div>

				<Link href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium">
					{checkoutUrl}
				</Link>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" onPress={handleCopyLink}>
						<Icon icon={Copy01Icon} className="icon-sm" />
						Copiar link
					</Button>
					<Button variant="secondary" onPress={handleOpenCheckout}>
						<Icon icon={Link01Icon} className="icon-sm" />
						Abrir checkout
					</Button>
				</div>
			</Card.Content>
		</Card>
	);
}
