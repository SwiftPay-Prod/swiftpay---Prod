import React from 'react';
import { PaymentStatus, PayoutStatus } from '@/types/enums';

export interface RevolutStatusBadgeProps {
	status: string | PaymentStatus | PayoutStatus | undefined | null;
	label?: string;
	className?: string;
	size?: 'sm' | 'md';
}

export function RevolutStatusBadge({
	status,
	label,
	className = '',
	size = 'sm',
}: RevolutStatusBadgeProps) {
	if (!status) {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 font-mono font-medium text-white/50 ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-white/40" />
				{label || 'Indefinido'}
			</span>
		);
	}

	const normalized = String(status).toLowerCase();

	// Success / Approved / Completed
	if (
		normalized === 'completed' ||
		normalized === 'approved' ||
		normalized === 'success' ||
		normalized === 'active' ||
		normalized === 'paid' ||
		normalized === 'liquidated' ||
		normalized === 'delivered' ||
		normalized === 'confirmed'
	) {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-full border border-[#00a87e]/30 bg-[#00a87e]/15 font-mono font-semibold text-[#00a87e] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-[#00a87e]" />
				{label || 'Concluído'}
			</span>
		);
	}

	// Pending / Processing / In Review / Waiting
	if (
		normalized === 'pending' ||
		normalized === 'processing' ||
		normalized === 'submitted' ||
		normalized === 'in_review' ||
		normalized === 'waiting_payment' ||
		normalized === 'confirming' ||
		normalized === 'under_review'
	) {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-full border border-[#ec7e00]/30 bg-[#ec7e00]/15 font-mono font-semibold text-[#ec7e00] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-[#ec7e00] animate-pulse" />
				{label || 'Pendente'}
			</span>
		);
	}

	// Failed / Rejected / Cancelled / Expired / Refused
	if (
		normalized === 'failed' ||
		normalized === 'rejected' ||
		normalized === 'cancelled' ||
		normalized === 'expired' ||
		normalized === 'refused' ||
		normalized === 'denied'
	) {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-full border border-[#e23b4a]/30 bg-[#e23b4a]/15 font-mono font-semibold text-[#e23b4a] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-[#e23b4a]" />
				{label || 'Falhou'}
			</span>
		);
	}

	// Refunded / Disputed / Chargeback
	if (
		normalized === 'refunded' ||
		normalized === 'partially_refunded' ||
		normalized === 'disputed' ||
		normalized === 'chargeback'
	) {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-full border border-[#494fdf]/30 bg-[#494fdf]/15 font-mono font-semibold text-[#4f55f1] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
				<span className="h-1.5 w-1.5 rounded-full bg-[#4f55f1]" />
				{label || 'Estornado'}
			</span>
		);
	}

	// Default neutral
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 font-mono font-medium text-white/70 ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'} ${className}`}>
			<span className="h-1.5 w-1.5 rounded-full bg-white/40" />
			{label || status}
		</span>
	);
}
