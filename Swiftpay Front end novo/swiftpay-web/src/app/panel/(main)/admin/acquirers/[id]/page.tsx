import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { adminGetAcquirer } from '@/app/actions/admin/acquirers';
import { getSessionData } from '@/auth/session';
import { UserRole } from '@/types/enums';
import { AcquirerDetails } from './acquirer-details';
import { AcquirerDetailsSkeleton } from './acquirer-details-skeleton';

interface PageProps {
	params: Promise<{ id: string }>;
}

async function AcquirerDetailsContent({
	acquirerId,
	currentUserRole,
}: {
	acquirerId: string;
	currentUserRole: UserRole;
}) {
	const response = await adminGetAcquirer(acquirerId);

	if (response.error || !response?.data) {
		notFound();
	}

	return <AcquirerDetails acquirer={response.data} currentUserRole={currentUserRole} />;
}

export default async function AcquirerDetailsPage({ params }: PageProps) {
	const { id } = await params;
	const session = await getSessionData();

	return (
		<Suspense fallback={<AcquirerDetailsSkeleton />}>
			<AcquirerDetailsContent acquirerId={id} currentUserRole={session?.role ?? UserRole.Admin} />
		</Suspense>
	);
}
