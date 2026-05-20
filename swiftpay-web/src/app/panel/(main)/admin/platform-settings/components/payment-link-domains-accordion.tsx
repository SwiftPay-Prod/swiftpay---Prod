'use client';

import type {
	PaymentLinkDomainMethodOptions,
	PaymentLinkDomainOption,
} from '@/types/admin/platform-settings';
import { PaymentMethod } from '@/types/enums';
import { Link01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { PaymentLinkDomainMethodAccordion } from './payment-link-domain-method-accordion';
import {
	resolveDefaultDomainOptionName,
} from '../platform-settings-form.helpers';

interface PaymentLinkDomainsAccordionProps {
	paymentLinkDomainOptions: PaymentLinkDomainMethodOptions[];
	pendingRemovalKey: string | null;
	onAddDomain: (method: PaymentMethod) => void;
	onEditDomain: (method: PaymentMethod, option: PaymentLinkDomainOption) => void;
	onSetDefaultDomain: (method: PaymentMethod, optionId: string) => void;
	onRequestDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onConfirmDomainRemoval: (method: PaymentMethod, optionId: string) => void;
	onCancelDomainRemoval: () => void;
}

const METHODS: PaymentMethod[] = [PaymentMethod.Pix, PaymentMethod.Boleto, PaymentMethod.CreditCard];

export function PaymentLinkDomainsAccordion({
	paymentLinkDomainOptions,
	pendingRemovalKey,
	onAddDomain,
	onEditDomain,
	onSetDefaultDomain,
	onRequestDomainRemoval,
	onConfirmDomainRemoval,
	onCancelDomainRemoval,
}: PaymentLinkDomainsAccordionProps) {
	const summary = (
		<>
			PIX: {resolveDefaultDomainOptionName(PaymentMethod.Pix, paymentLinkDomainOptions)} | Boleto:{' '}
			{resolveDefaultDomainOptionName(PaymentMethod.Boleto, paymentLinkDomainOptions)} | Cartão:{' '}
			{resolveDefaultDomainOptionName(PaymentMethod.CreditCard, paymentLinkDomainOptions)}
		</>
	);

	return (
		<SystemAccordion
			id='payment-link-domains'
			icon={Link01Icon}
			title='Domínios de Visualização da Transação'
			color='sky'
			defaultExpanded={false}
			summary={summary}
		>
			<div className='flex flex-col gap-4'>
				{METHODS.map((method) => (
					<PaymentLinkDomainMethodAccordion
						key={method}
						method={method}
						paymentLinkDomainOptions={paymentLinkDomainOptions}
						pendingRemovalKey={pendingRemovalKey}
						onAddDomain={onAddDomain}
						onEditDomain={onEditDomain}
						onSetDefaultDomain={onSetDefaultDomain}
						onRequestDomainRemoval={onRequestDomainRemoval}
						onConfirmDomainRemoval={onConfirmDomainRemoval}
						onCancelDomainRemoval={onCancelDomainRemoval}
					/>
				))}
			</div>
		</SystemAccordion>
	);
}
