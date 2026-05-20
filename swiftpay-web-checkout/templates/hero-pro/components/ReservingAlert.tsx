'use client';

import { Icon } from '@/components/icon';
import { Loading01Icon } from '@hugeicons/core-free-icons';

interface ReservingAlertProps {
	primaryColor: string;
	message?: string;
}

export function ReservingAlert({ primaryColor, message = 'Reservando seus produtos...' }: ReservingAlertProps) {
	return (
		<div
			className="rounded-xl p-3"
			style={{
				backgroundColor: `color-mix(in oklch, ${primaryColor} 15%, transparent)`,
				color: primaryColor,
			}}
		>
			<div className="flex items-center justify-center gap-2">
				<Icon icon={Loading01Icon} className="icon-sm animate-spin" />
				<p className="text-sm font-medium">{message}</p>
			</div>
		</div>
	);
}
