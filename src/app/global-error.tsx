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
			<body style={{ backgroundColor: '#0B0E14', color: '#FFFFFF', margin: 0, fontFamily: 'sans-serif' }}>
				<div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
					<div style={{ maxWidth: '400px', borderRadius: '16px', border: '1px solid #1E2638', backgroundColor: '#121721', padding: '32px' }}>
						<h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>SwiftPay - Ops!</h2>
						<p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px' }}>
							Ocorreu um erro temporário no aplicativo. Clique abaixo para recarregar.
						</p>
						<button
							type="button"
							onClick={() => reset()}
							style={{ backgroundColor: '#A3E635', color: '#0B0E14', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
						>
							Recarregar Página
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
