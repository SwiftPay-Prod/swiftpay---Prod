'use client';

import { Card, Skeleton } from '@heroui/react';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-28 w-full rounded-2xl" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <Card.Content className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-32 rounded-lg" />
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <Card.Content className="flex flex-col gap-1 p-3">
              <Skeleton className="h-3 w-16 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <Card.Header className="px-4 pt-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-lg" />
              </div>
              <Skeleton className="mt-1 h-3 w-20 rounded-lg" />
            </Card.Header>
            <Card.Content className="px-4 pb-3">
              <Skeleton className="h-32 w-full rounded-lg" />
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}

