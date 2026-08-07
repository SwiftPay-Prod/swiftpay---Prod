'use client';

import type { ReactNode } from 'react';

interface PanelContentProps {
	children: ReactNode;
}

export function PanelContent({ children }: PanelContentProps) {
	return (
		<main className="flex-1 min-w-0 w-full max-w-screen-2xl mx-auto px-5 py-5 md:px-6 md:py-6">
			{children}
		</main>
	);
}

