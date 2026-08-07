import type { ReactNode } from 'react';

export function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="text-xs text-foreground-500">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}
