import { Card, Skeleton } from '@heroui/react';

export function CreatePaymentLinkPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-4 w-120 max-w-full rounded-lg" />
      </div>

      <div className="mt-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>

      <div className="mt-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <Card.Content className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </Card.Content>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
