'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Wallet, Link as LinkIcon, ArrowRightLeft, Banknote, Settings, Key, BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Carteira', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Payment Links', href: '/dashboard/payment-links', icon: LinkIcon },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowRightLeft },
  { label: 'Saques', href: '/dashboard/withdrawals', icon: Banknote },
  { label: 'Configurações', href: '/dashboard/settings/webhooks', icon: Settings },
  { label: 'API Keys', href: '/dashboard/settings/api-keys', icon: Key },
  { label: 'Documentação', href: '/dashboard/settings/documentation', icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
          <div className="h-8 w-8 rounded-lg bg-black" />
          <span className="font-semibold text-zinc-900">Swiftpay</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-zinc-100 text-black font-medium" : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
                )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-3 space-y-2">
          <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-zinc-600 hover:text-black">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
