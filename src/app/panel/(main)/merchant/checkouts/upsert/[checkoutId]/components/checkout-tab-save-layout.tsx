'use client';

import type { ReactNode } from 'react';
import { UnsavedChangesAlert } from '@/components/ui/unsaved-changes-alert';

interface CheckoutTabSaveLayoutProps {
	hasChanges: boolean;
	onSave: () => void;
	isSaving: boolean;
	children: ReactNode;
	className?: string;
}

export function CheckoutTabSaveLayout({
	hasChanges,
	onSave,
	isSaving,
	children,
	className = 'flex flex-col gap-4',
}: CheckoutTabSaveLayoutProps) {
	return (
		<div className={className}>
			<UnsavedChangesAlert hasChanges={hasChanges} onSave={onSave} isSaving={isSaving} />
			{children}
		</div>
	);
}
