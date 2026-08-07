'use client';

import { formatDate as formatDateUtil, formatDateOnly as formatDateOnlyUtil } from '@/utils/datetime';

interface FormattedDateProps {
	date: string | null;
	includeTime?: boolean;
	className?: string;
}

export function FormattedDate({ date, includeTime = true, className }: FormattedDateProps) {
	const formatted = includeTime ? formatDateUtil(date) : formatDateOnlyUtil(date);

	return <span className={className}>{formatted}</span>;
}

