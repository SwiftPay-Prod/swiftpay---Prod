import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

export default function BoletoSubdomainNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold text-zinc-400">404</h1>
        <h2 className="mb-2 text-lg font-semibold text-white">Página não encontrada</h2>
        <p className="text-sm text-zinc-400">
          O endereço que você acessou não existe.
        </p>
      </div>
    </div>
  );
}

