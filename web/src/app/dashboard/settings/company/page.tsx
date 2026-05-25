'use client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, ShieldCheck } from 'lucide-react';
import { request } from '@/lib/api-client';

export default function CompanyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => request<{ success: boolean; data: any }>('/company'),
  });

  if (isLoading) return <div className="text-muted-foreground p-4">Carregando...</div>;
  const company = data?.data;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Empresa</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24">Razao Social</span>
              <span>{company?.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24">Documento</span>
              <span className="font-mono text-xs">{company?.document}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24">Status KYC</span>
              <Badge variant={company?.kycStatus === 'Approved' ? 'default' : 'secondary'}
                className={company?.kycStatus === 'Approved' ? 'bg-green-600 text-white' : ''}>
                {company?.kycStatus || 'Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
