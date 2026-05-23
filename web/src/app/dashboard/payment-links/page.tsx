'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentLinks } from '@/lib/api-client';
import { Plus, Copy, Check, ExternalLink } from 'lucide-react';

export default function PaymentLinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-links', page],
    queryFn: () => paymentLinks.list(page, 25),
  });

  const copyToClipboard = (slug: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Payment Links</h1>
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          New Link
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {data.items.map(link => (
              <div key={link.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{link.title}</p>
                  {link.description && (
                    <p className="mt-0.5 text-sm text-zinc-500 truncate">{link.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{link.usesCount}/{link.maxUses || '∞'} uses</span>
                    <span className={link.isActive ? 'text-green-600' : 'text-red-600'}>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {link.expiresAt && (
                      <span>Expires {new Date(link.expiresAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-zinc-900">
                    R$ {(link.amount / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(link.slug, link.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    title="Copy link"
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`/pay/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    title="Open payment page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-400">No payment links yet.</p>
            <p className="mt-1 text-xs text-zinc-300">Create your first payment link to get started.</p>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
