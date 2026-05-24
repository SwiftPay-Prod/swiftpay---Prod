'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wallet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => wallet.transactions(page, limit),
  });

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transações</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (data?.items ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma transação</TableCell></TableRow>
              ) : (
                data?.items?.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{tx.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.method}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'Failed' ? 'destructive' : tx.status === 'Refunded' ? 'secondary' : 'default'}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === 'Payment' ? 'text-foreground' : 'text-destructive'}`}>
                      {tx.type === 'Payment' ? '+' : '-'}{formatBRL(tx.amount)}
                    </TableCell>
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
