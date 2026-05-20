'use client';

import { Card, Skeleton } from '@heroui/react';

function FeeBlockSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-divider p-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-16 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function FeeColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-divider p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <Skeleton className="h-3.5 w-24 rounded-lg" />
          <Skeleton className="h-3.5 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function FeesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-6 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <Card>
        <Card.Header>
          <Skeleton className="h-5 w-56 rounded-lg" />
          <Skeleton className="h-3.5 w-80 rounded-lg" />
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-default/20 px-3 py-2.5">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-72 rounded-lg" />
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FeeColumnSkeleton />
            <FeeColumnSkeleton />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-80 rounded-lg" />
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeeBlockSkeleton />
            <FeeBlockSkeleton />
            <FeeBlockSkeleton />
          </div>
          <div className="rounded-xl p-3">
            <Skeleton className="h-3.5 w-80 rounded-lg" />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-44 rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-96 rounded-lg" />
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          <div className="rounded-xl p-3">
            <Skeleton className="h-3.5 w-96 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeeBlockSkeleton />
            <FeeBlockSkeleton />
            <FeeBlockSkeleton />
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

