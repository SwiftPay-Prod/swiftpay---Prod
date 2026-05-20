'use client';

import type { ReactNode } from 'react';
import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface WithdrawalAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function WithdrawalAccordion({ summary, children }: WithdrawalAccordionProps) {
	return (
		<SystemAccordion
			id='saque'
			icon={Wallet01Icon}
			title='Saque'
			color='violet'
			defaultExpanded={false}
			summary={summary}
		>
			{children}
		</SystemAccordion>
	);
}