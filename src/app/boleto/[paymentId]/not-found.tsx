import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boleto não encontrado',
  robots: { index: false, follow: false },
};

export default function BoletoNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800">
          <svg className="size-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008V15zm0 3H9.75m3 0h.008v.008h-.008V18zm-6.75-3v.008h.008V15H5.25zm0 3v.008h.008V18H5.25zM10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Boleto não encontrado</h1>
        <p className="text-sm text-zinc-400">
          O boleto que você está procurando não existe ou o link está incorreto.
        </p>
      </div>
    </div>
  );
}
