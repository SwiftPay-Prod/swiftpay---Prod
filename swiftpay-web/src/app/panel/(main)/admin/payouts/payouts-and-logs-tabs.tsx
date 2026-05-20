'use client';

import { CashoutsTable } from './cashouts-table';

interface PayoutsAndLogsTabsProps {
	canReprocess: boolean;
}

export function PayoutsAndLogsTabs({
	canReprocess,
}: PayoutsAndLogsTabsProps) {
	return (
		<CashoutsTable canReprocess={canReprocess} />
	);
}
