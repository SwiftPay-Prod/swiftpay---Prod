'use client';
export function NotificationsBroadcastContent({ currentUserRole }: { currentUserRole?: string }) {
  const isGod = currentUserRole === 'God';
  if (!isGod) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <p className="text-sm font-medium text-amber-200">Acesso restrito</p>
        <p className="text-xs text-amber-200/70">Apenas God pode enviar push.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold text-white">Notificações Push - Teste Simples</h1>
      <p className="text-sm text-white/60">Se você vê isso, a rota está funcionando. Vamos adicionar o formulário em seguida.</p>
    </div>
  );
}
