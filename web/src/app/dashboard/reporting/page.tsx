'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';
import { request } from '@/lib/api-client';

const formatBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export default function ReportingPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ from, to, page: String(page), limit: '50' });
  if (method) params.set('method', method);
  if (status) params.set('status', status);

  const { data, isLoading } = useQuery({
    queryKey: ['reporting', from, to, method, status, page],
    queryFn: () => request<{ success: boolean; data: any }>(`/reporting/transactions?${params}`),
  });

  const d = data?.data;

  const exportCSV = () => {
    if (!d?.items?.length) return;
    const header = 'ID,Valor,Taxa,Metodo,Status,Data\n';
    const rows = d.items
      .map(
        (t: any) =>
          `${t.externalId || t.id},${t.amount},${t.platformFee},${t.method},${t.status},${new Date(t.createdAt).toISOString()}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const el = document.getElementById('report-content');
    if (!el) return;
    html2pdf()
      .set({ margin: 10, filename: `relatorio-${from}-${to}.pdf`, image: { type: 'jpeg', quality: 0.98 } })
      .from(el)
      .save();
  };

  const totalPages = d?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">De</label>
              <Input
                type="date"
                value={from}
                onChange={e => { setFrom(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Até</label>
              <Input
                type="date"
                value={to}
                onChange={e => { setTo(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Método</label>
              <select
                value={method}
                onChange={e => { setMethod(e.target.value); setPage(1); }}
                className="h-9 px-3 border border-border rounded-md text-sm bg-background"
              >
                <option value="">Todos</option>
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto</option>
                <option value="CREDIT_CARD">Cartão</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="h-9 px-3 border border-border rounded-md text-sm bg-background"
              >
                <option value="">Todos</option>
                <option value="PAID">Pago</option>
                <option value="FAILED">Falha</option>
                <option value="REFUNDED">Estornado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {d?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(d.summary.revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.summary.paidTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.summary.successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0" id="report-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : !d?.items?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum resultado</TableCell>
                </TableRow>
              ) : (
                d.items.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.externalId || t.id.toString().slice(0, 8)}</TableCell>
                    <TableCell>{formatBRL(t.amount)}</TableCell>
                    <TableCell className="text-xs">{formatBRL(t.platformFee)}</TableCell>
                    <TableCell>{t.method}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell className="text-xs">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
