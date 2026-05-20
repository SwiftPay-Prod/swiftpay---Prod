'use client';

import { useSyncExternalStore } from 'react';
import { formatRelativeTime } from '@/utils/datetime';

const emptySubscribe = () => () => {};

interface RelativeTimeProps {
	date: string | null;
	className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
	const isClient = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false
	);

	if (!isClient) {
		return <span className={className}>-</span>;
	}

	return <span className={className}>{formatRelativeTime(date)}</span>;
}

