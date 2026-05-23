'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentLinks } from '@/lib/api-client';
import Link from 'next/link';

export default function PaymentLinksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['payment-links', page],
    queryFn: () => paymentLinks.list(page, 25),
  });

  const formatBRL = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Payment Links</h1>
        <Link href="/dashboard/payment-links/create"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Novo Link
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
              <th className="p-4 font-medium">Título</th>
              <th className="p-4 font-medium">Valor</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Usos</th>
              <th className="p-4 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-zinc-400">Carregando...</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-zinc-400">Nenhum link criado</td></tr>
            ) : (
              data?.items?.map((link: any) => (
                <tr key={link.id} className="hover:bg-zinc-50">
                  <td className="p-4 font-medium text-black">{link.title}</td>
                  <td className="p-4">{formatBRL(link.amount)}</td>
                  <td className="p-4 text-sm text-zinc-500 font-mono">{link.slug}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      link.isActive ? 'border-zinc-300 text-black' : 'border-zinc-200 text-zinc-400'
                    }`}>{link.isActive ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="p-4 text-sm text-zinc-600">{link.usesCount}/{link.maxUses || '∞'}</td>
                  <td className="p-4 text-sm text-zinc-500">{new Date(link.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
