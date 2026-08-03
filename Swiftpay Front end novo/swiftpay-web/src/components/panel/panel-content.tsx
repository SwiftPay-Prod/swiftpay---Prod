'use client';

import type { ReactNode } from 'react';

interface PanelContentProps {
	children: ReactNode;
}

export function PanelContent({ children }: PanelContentProps) {
	return (
		<main className="flex-1 min-w-0 w-full max-w-7xl mx-auto p-2 md:p-4">
			{children}
		</main>
	);
}

