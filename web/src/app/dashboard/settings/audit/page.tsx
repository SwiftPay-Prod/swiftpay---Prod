'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api-client';

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => request<{ success: boolean; data: any }>(`/audit-logs?page=${page}&limit=${limit}`),
  });
  const logs = data?.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auditoria</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
              ) : (logs?.items ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum registro</TableCell></TableRow>
              ) : (
                logs?.items?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entityId?.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.ipAddress}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(logs?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">Pagina {page} de {logs?.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(logs?.totalPages ?? 1, p + 1))} disabled={page === (logs?.totalPages ?? 1)}>
            Proxima
          </Button>
        </div>
      )}
    </div>
  );
}
