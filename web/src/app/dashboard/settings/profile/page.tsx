'use client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield } from 'lucide-react';
import { request } from '@/lib/api-client';

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request<{ success: boolean; data: any }>('/profile'),
  });

  if (isLoading) return <div className="text-muted-foreground p-4">Carregando...</div>;
  const profile = data?.data;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
              {profile?.name?.[0]}
            </div>
            <div>
              <p className="font-medium">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">Nome</span>
              <span>{profile?.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">Email</span>
              <span>{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">Perfil</span>
              <Badge variant="outline">{profile?.role}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-20">Empresa</span>
              <span>{profile?.company}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
