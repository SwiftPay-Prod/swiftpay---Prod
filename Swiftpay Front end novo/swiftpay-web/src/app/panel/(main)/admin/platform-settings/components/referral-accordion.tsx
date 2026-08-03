'use client';

import type { ReactNode } from 'react';
import { Target02Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface ReferralAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function ReferralAccordion({ summary, children }: ReferralAccordionProps) {
	return (
		<SystemAccordion
			id='referral'
			icon={Target02Icon}
			title='Indicações'
			color='mauve'
			defaultExpanded={false}
			summary={summary}
		>
			{children}
		</SystemAccordion>
	);
}