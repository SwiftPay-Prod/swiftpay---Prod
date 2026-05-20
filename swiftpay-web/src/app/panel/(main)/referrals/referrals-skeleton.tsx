'use client';

import { Card, Skeleton } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { UserGroupIcon } from '@hugeicons/core-free-icons';

export function ReferralsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <Icon icon={UserGroupIcon} className="icon-md text-accent-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <Card.Content className="flex flex-col gap-3 p-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-12 w-56 rounded-xl" />
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-18 w-full rounded-xl" />
            ))}
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Content className="flex flex-col gap-3 p-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </Card.Content>
      </Card>
    </div>
  );
}
