'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { request } from '@/lib/api-client';

export default function WebhookDeliveryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['webhook-delivery', page],
    queryFn: () => request<{ success: boolean; data: any }>(`/webhooks/delivery?page=${page}&limit=25`),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => request(`/webhooks/delivery/${id}/retry`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhook-delivery'] }),
  });

  const d = data?.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Entregas de Webhooks</h1>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Evento</TableHead><TableHead>URL</TableHead><TableHead>Status</TableHead><TableHead>Tentativas</TableHead><TableHead>Data</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow> :
              d?.items?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.eventType}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{log.url}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Success' ? 'default' : log.status === 'Failed' ? 'destructive' : 'secondary'}
                      className={log.status === 'Success' ? 'bg-green-600' : ''}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{log.attempts}/3</TableCell>
                  <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    {log.status === 'Failed' && (
                      <Button size="sm" variant="outline" onClick={() => retryMutation.mutate(log.id)}
                        disabled={retryMutation.isPending}>
                        Reenviar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
