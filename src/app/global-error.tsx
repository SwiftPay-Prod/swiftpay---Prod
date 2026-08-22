'use client';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="pt-BR">
			<body style={{ backgroundColor: '#000000', color: '#FFFFFF', margin: 0, fontFamily: 'sans-serif' }}>
				<div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
					<div style={{ maxWidth: '400px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: '#16181a', padding: '32px' }}>
						<h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#FFFFFF' }}>SwiftPay - Ops!</h2>
						<p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
							Ocorreu um erro temporário no aplicativo. Clique abaixo para recarregar.
						</p>
						<button
							type="button"
							onClick={() => reset()}
							style={{ backgroundColor: '#FFFFFF', color: '#000000', border: 'none', borderRadius: '9999px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
						>
							Recarregar Página
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
