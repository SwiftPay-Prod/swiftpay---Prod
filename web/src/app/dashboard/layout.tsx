'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Wallet, Link as LinkIcon, ArrowRightLeft, Banknote, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Carteira', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Payment Links', href: '/dashboard/payment-links', icon: LinkIcon },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowRightLeft },
  { label: 'Saques', href: '/dashboard/withdrawals', icon: Banknote },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
          <div className="h-8 w-8 rounded-lg bg-orange-500" />
          <span className="text-lg font-bold text-zinc-900">Swiftpay</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <div className="mb-3 text-xs text-zinc-500">
            {user?.name || user?.email}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
