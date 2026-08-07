'use client';

import type { ReactNode } from 'react';
import { Tag01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface BoletoAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function BoletoAccordion({ summary, children }: BoletoAccordionProps) {
	return (
		<SystemAccordion
			id='boleto'
			icon={Tag01Icon}
			title='Boleto'
			color='amber'
			defaultExpanded={false}
			summary={summary}
		>
			{children}
		</SystemAccordion>
	);
}