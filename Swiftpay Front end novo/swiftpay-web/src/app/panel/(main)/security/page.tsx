import { Suspense } from 'react';
import { listTrustedDevices } from '@/app/actions/auth';
import { SecurityWrapper } from './security-wrapper';
import { SecuritySkeleton } from './security-skeleton';

export default async function SecurityPage() {
  const devicesPromise = listTrustedDevices();

  return (
    <Suspense fallback={<SecuritySkeleton />}>
      <SecurityWrapper fetchPromise={devicesPromise} />
    </Suspense>
  );
}

