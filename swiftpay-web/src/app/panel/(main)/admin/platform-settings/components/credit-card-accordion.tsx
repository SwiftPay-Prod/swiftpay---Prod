'use client';

import type { ReactNode } from 'react';
import { CreditCardIcon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface CreditCardAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function CreditCardAccordion({ summary, children }: CreditCardAccordionProps) {
	return (
		<SystemAccordion
			id='credit-card'
			icon={CreditCardIcon}
			title='Cartão de Crédito'
			color='sky'
			defaultExpanded={false}
			summary={summary}
		>
			{children}
		</SystemAccordion>
	);
}