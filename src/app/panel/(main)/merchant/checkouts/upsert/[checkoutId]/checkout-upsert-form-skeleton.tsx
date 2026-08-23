import { Skeleton } from '@heroui/react';

export function CheckoutUpsertFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-4 w-80 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
