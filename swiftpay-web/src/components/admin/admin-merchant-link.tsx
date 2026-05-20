'use client';

import { Tooltip, Link } from '@heroui/react';
import { Routes } from '@/router/routes';

interface AdminMerchantLinkProps {
	merchantId?: string | null;
	name?: string | null;
	className?: string;
	newTab?: boolean;
}

export function AdminMerchantLink({ merchantId, name, className, newTab = true }: AdminMerchantLinkProps) {
	const displayName = name ?? '-';

	if (!merchantId) {
		return <span className={className}>{displayName}</span>;
	}

	return (
		<Tooltip>
			<Link
				href={Routes.panel.admin.merchantDetails(merchantId)}
				target={newTab ? '_blank' : undefined}
				rel={newTab ? 'noopener noreferrer' : undefined}
				className={className ?? 'text-accent hover:underline'}
			>
				{displayName}
				<Link.Icon />
			</Link>
			<Tooltip.Content>Ver organização</Tooltip.Content>
		</Tooltip>
	);
}
