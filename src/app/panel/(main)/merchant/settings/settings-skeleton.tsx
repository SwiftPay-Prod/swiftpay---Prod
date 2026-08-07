'use client';

import { Card, Skeleton } from '@heroui/react';

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-6 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* Microsoft Clarity */}
      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-3 w-56 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </Card.Content>
      </Card>

      {/* Limites PIX */}
      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Saques */}
      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-96 rounded-lg" />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Rate Limits */}
      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-20 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Zona de Perigo */}
      <Card>
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-3 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

