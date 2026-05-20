import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ icon, title, description, action }: SectionHeaderProps) {
  if (!icon) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-secondary">{icon}</div>
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

