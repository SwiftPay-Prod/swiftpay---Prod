import { Skeleton } from '@heroui/react';

export function OrderUpsertFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-4 w-72 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-4 w-52 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
