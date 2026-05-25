'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Wallet, Link as LinkIcon, ArrowRightLeft, Banknote, Settings, Key, BookOpen, LogOut, User, Building2, History } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Carteira', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Payment Links', href: '/dashboard/payment-links', icon: LinkIcon },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowRightLeft },
  { label: 'Saques', href: '/dashboard/withdrawals', icon: Banknote },
  { label: 'Perfil', href: '/dashboard/settings/profile', icon: User },
  { label: 'Empresa', href: '/dashboard/settings/company', icon: Building2 },
  { label: 'Configurações', href: '/dashboard/settings/webhooks', icon: Settings },
  { label: 'API Keys', href: '/dashboard/settings/api-keys', icon: Key },
  { label: 'Auditoria', href: '/dashboard/settings/audit', icon: History },
  { label: 'Documentação', href: '/dashboard/settings/documentation', icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex flex-col border-r border-border bg-background">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="h-7 w-7 rounded-md bg-foreground" />
          <span className="font-semibold text-base">Swiftpay</span>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            <ThemeToggle />
          </div>
          <button onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
