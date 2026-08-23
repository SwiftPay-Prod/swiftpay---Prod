'use client';

import { useEffect } from 'react';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Client-side error caught:', error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
			<div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/12 bg-card p-8">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
					<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h2 className="text-xl font-bold text-white">Algo deu errado</h2>
				<p className="text-sm text-muted-foreground">
					Ocorreu uma falha inesperada ao carregar este conteúdo. Tente recarregar a página.
				</p>
				<button
					type="button"
					onClick={() => reset()}
					className="mt-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-95"
				>
					Tentar novamente
				</button>
			</div>
		</div>
	);
}
