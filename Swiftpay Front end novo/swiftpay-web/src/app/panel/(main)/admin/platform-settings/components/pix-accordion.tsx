'use client';

import type { ReactNode } from 'react';
import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface PixAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function PixAccordion({ summary, children }: PixAccordionProps) {
	return (
		<SystemAccordion id='pix' icon={Wallet01Icon} title='PIX' color='emerald' defaultExpanded={false} summary={summary}>
			{children}
		</SystemAccordion>
	);
}