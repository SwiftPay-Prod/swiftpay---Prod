'use client';

import type { ReactNode } from 'react';
import { Analytics01Icon } from '@hugeicons/core-free-icons';
import { SystemAccordion } from '@/components/ui/system-accordion';

interface RateLimitingAccordionProps {
	summary: ReactNode;
	children: ReactNode;
}

export function RateLimitingAccordion({ summary, children }: RateLimitingAccordionProps) {
	return (
		<SystemAccordion
			id='rate-limiting'
			icon={Analytics01Icon}
			title='Rate Limiting'
			color='rose'
			defaultExpanded={false}
			summary={summary}
		>
			{children}
		</SystemAccordion>
	);
}