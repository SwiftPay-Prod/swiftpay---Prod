'use client';

import { useQuery } from '@tanstack/react-query';
import { wallet } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WalletPage() {
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => wallet.balance(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => wallet.transactions(),
  });

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carteira</h1>

      {loadingBalance ? (
        <div className="animate-pulse h-24 bg-muted rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Saldo Disponível</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatBRL(balance?.data?.available ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Pendente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatBRL(balance?.data?.pending ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatBRL((balance?.data?.available ?? 0) + (balance?.data?.pending ?? 0))}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(transactions?.items ?? []).length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">Nenhuma transação ainda</div>
            ) : (
              transactions?.items?.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'Payment' ? 'text-foreground' : 'text-destructive'}`}>
                      {tx.type === 'Payment' ? '+' : '-'}{formatBRL(tx.amount)}
                    </p>
                    <Badge variant={tx.status === 'Failed' ? 'destructive' : 'secondary'} className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
