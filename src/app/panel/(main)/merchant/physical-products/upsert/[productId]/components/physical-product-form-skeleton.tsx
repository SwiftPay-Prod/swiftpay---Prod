import { Card, Skeleton } from '@heroui/react';

export function PhysicalProductFormSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>

      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />

      <Card>
        <Card.Content className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </Card.Content>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>
  );
}
