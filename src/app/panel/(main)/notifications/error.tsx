'use client';

import { useEffect } from 'react';

export default function NotificationsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[notifications] segment error:', error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4 text-center text-foreground">
			<div className="flex max-w-md flex-col items-center gap-4 rounded-[20px] border border-white/12 bg-card p-8">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
					<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h2 className="text-xl font-bold text-white">Notificações indisponíveis</h2>
				<p className="text-sm text-white/60">
					Não foi possível carregar suas notificações agora. Tente novamente.
				</p>
				<button
					type="button"
					onClick={reset}
					className="button-primary mt-2 cursor-pointer text-sm"
				>
					Tentar novamente
				</button>
			</div>
		</div>
	);
}
