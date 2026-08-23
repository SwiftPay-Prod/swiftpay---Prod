import type { ReactNode } from 'react';

interface ReviewStepLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

interface ReviewIssuesAlertProps {
  issues: string[];
  title?: string;
}

export function ReviewStepLayout({ title, description, children }: ReviewStepLayoutProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ReviewIssuesAlert({ issues, title = 'Corrija os itens abaixo antes de continuar:' }: ReviewIssuesAlertProps) {
  if (issues.length === 0) return null;

  return (
    <div className="rounded-lg border border-danger-soft-hover bg-danger-soft p-3">
      <p className="text-xs font-medium text-danger">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-danger">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
