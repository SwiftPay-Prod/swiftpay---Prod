import { Suspense } from 'react';
import { listBulletins } from '@/app/actions/user';
import { BulletinsContent } from './bulletins-content';
import { BulletinsSkeleton } from './bulletins-skeleton';

export default async function BulletinsPage() {
	const bulletinsPromise = listBulletins();

	return (
		<Suspense fallback={<BulletinsSkeleton />}>
			<BulletinsContent bulletinsPromise={bulletinsPromise} />
		</Suspense>
	);
}

